import GoogleProvider from '@auth/core/providers/google'
import GithubProvider from '@auth/core/providers/github'
import type { AuthConfig, Theme } from '@auth/core/types'
import type { EmailConfig, SendVerificationRequestParams } from '@auth/core/providers/email'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import type { H3Event } from 'h3'
import { getRequestHeaders, getRequestURL } from 'h3'
import { skipCSRFCheck, Auth } from '@auth/core'
import { and, eq } from 'drizzle-orm'
import { accounts } from '~~/server/db/schema'
import customCss from './auth.css.js'
import { useDb } from './db'

async function getServerSessionResponse (event: H3Event): Promise<Response> {
  const options = await useAuthOptions(event)
  const url = new URL('/api/auth/session', getRequestURL(event))

  return await Auth(
    new Request(url, { headers: new Headers(getRequestHeaders(event) as Record<string, string>) }),
    options
  ) as Response
}

export async function getServerSession (event: H3Event) {
  const response = await getServerSessionResponse(event)
  const { status = 200 } = response
  const data = await response.json()

  if (!data || !Object.keys(data).length) {
    return null
  }

  if (status === 200) {
    return data
  }

  throw new Error(data.message)
}

export async function getAuthenticatedUserEmail (event: H3Event) {
  let session

  try {
    session = await getServerSession(event)
  } catch {
    throw createError({ statusMessage: 'Unauthenticated', statusCode: 403 })
  }

  if (!session?.user?.email) {
    throw createError({ statusMessage: 'Unauthenticated', statusCode: 403 })
  }

  return session.user.email
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function useAuthOptions (event: H3Event): Promise<AuthConfig> {
  const DB = await useDb()

  return {
    adapter: DrizzleAdapter(DB) as unknown as AuthConfig['adapter'],
    secret: __env__.NUXT_AUTH_JS_SECRET,
    providers: [
      {
        id: 'mailgun',
        name: 'Email',
        type: 'email',
        sendVerificationRequest: async (params: SendVerificationRequestParams) => {
          const { identifier: email, url, theme } = params

          const { host } = new URL(url)

          const formData = new FormData()
          formData.append('to', email)
          formData.append('from', 'noreply@tv.joebailey.xyz')
          formData.append('subject', `Sign in to ${host}`)
          formData.append('text', text({ url, host }))
          formData.append('html', html({ url, host, theme }))

          const response = await fetch(`${__env__.NUXT_MAILGUN_ENDPOINT}/messages`, {
            body: formData,
            headers: {
              Authorization: `Basic ${Buffer.from(`api:${__env__.NUXT_MAILGUN_SENDING_KEY}`).toString('base64')}`
            },
            method: 'POST'
          })

          if (!response.ok) {
            throw new Error(JSON.stringify(await response.json()))
          }
        }
      } as unknown as EmailConfig,
      GoogleProvider({
        clientId: __env__.NUXT_GOOGLE_CLIENT_ID,
        clientSecret: __env__.NUXT_GOOGLE_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true,
        authorization: {
          params: {
            scope: 'openid email profile https://www.googleapis.com/auth/calendar',
            // eslint-disable-next-line camelcase
            access_type: 'offline',
            prompt: 'consent',
            // eslint-disable-next-line camelcase
            response_type: 'code'
          }
        }
      }),
      GithubProvider({
        clientId: __env__.NUXT_GITHUB_CLIENT_ID,
        clientSecret: __env__.NUXT_GITHUB_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true
      })
    ],
    trustHost: true,
    callbacks: {
      async signIn ({ account }) {
        if (account?.provider !== 'google') {
          return true
        }

        const updateData: Partial<typeof accounts.$inferInsert> = {}

        if (account.access_token) {
          // eslint-disable-next-line camelcase
          updateData.access_token = account.access_token
        }

        if (account.expires_at) {
          // eslint-disable-next-line camelcase
          updateData.expires_at = account.expires_at
        }

        if (account.token_type) {
          // eslint-disable-next-line camelcase
          updateData.token_type = account.token_type
        }

        if (account.scope) {
          updateData.scope = account.scope
        }

        if (account.id_token) {
          // eslint-disable-next-line camelcase
          updateData.id_token = account.id_token
        }

        if (typeof account.session_state === 'string') {
          // eslint-disable-next-line camelcase
          updateData.session_state = account.session_state
        }

        if (account.refresh_token) {
          // eslint-disable-next-line camelcase
          updateData.refresh_token = account.refresh_token
        }

        if (Object.keys(updateData).length) {
          await DB.update(accounts)
            .set(updateData)
            .where(
              and(
                eq(accounts.provider, account.provider),
                eq(accounts.providerAccountId, account.providerAccountId)
              )
            )
        }

        return true
      }
    },
    theme: {
      customCss
    },
    skipCSRFCheck
  }
}

/**
 * Email HTML body
 * Insert invisible space into domains from being turned into a hyperlink by email
 * clients like Outlook and Apple mail, as this is confusing because it seems
 * like they are supposed to click on it to sign in.
 *
 * @note We don't add the email address to avoid needing to escape it, if you do, remember to sanitize it!
 */
function html (params: { url: string; host: string; theme: Theme }) {
  const { url, host, theme } = params

  const escapedHost = host.replace(/\./g, '&#8203;.')

  const brandColor = theme.brandColor || '#346df1'
  const buttonText = theme.buttonText || '#fff'

  const color = {
    background: '#f9f9f9',
    text: '#444',
    mainBackground: '#fff',
    buttonBackground: brandColor,
    buttonBorder: brandColor,
    buttonText
  }

  return `
<body style="background: ${color.background};">
  <table width="100%" border="0" cellspacing="20" cellpadding="0"
    style="background: ${color.mainBackground}; max-width: 600px; margin: auto; border-radius: 10px;">
    <tr>
      <td align="center"
        style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        Sign in to <strong>${escapedHost}</strong>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="border-radius: 5px;" bgcolor="${color.buttonBackground}"><a href="${url}"
                target="_blank"
                style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${color.buttonText}; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid ${color.buttonBorder}; display: inline-block; font-weight: bold;">Sign
                in</a></td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center"
        style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        If you did not request this email you can safely ignore it.
      </td>
    </tr>
  </table>
</body>
`
}

/** Email Text body (fallback for email clients that don't render HTML, e.g. feature phones) */
function text ({ url, host }: { url: string; host: string }) {
  return `Sign in to ${host}\n${url}\n\n`
}
