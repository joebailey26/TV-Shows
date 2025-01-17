import GoogleProvider from '@auth/core/providers/google'
import GithubProvider from '@auth/core/providers/github'
import type { AuthConfig, Theme } from '@auth/core/types'
import type { EmailConfig, SendVerificationRequestParams } from '@auth/core/providers/email'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import type { H3Event } from 'h3'
import { skipCSRFCheck, Auth } from '@auth/core'
import customCss from './auth.css.js'
import { useDb } from './db'

async function getServerSessionResponse (event: H3Event) {
  const options = await useAuthOptions(event)
  const url = new URL('/api/auth/session', getRequestURL(event))

  return Auth(
    new Request(url, { headers: getRequestHeaders(event) }),
    options
  )
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
  } catch (e) {
    throw createError({ statusMessage: 'Unauthenticated', statusCode: 403 })
  }

  if (!session?.user?.email) {
    throw createError({ statusMessage: 'Unauthenticated', statusCode: 403 })
  }

  return session.user.email
}

export async function useAuthOptions (event: H3Event): Promise<AuthConfig> {
  const DB = await useDb(event)
  const runtimeConfig = useRuntimeConfig(event)

  return {
    adapter: DrizzleAdapter(DB),
    secret: runtimeConfig.authJs.secret,
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

          const response = await fetch(`${runtimeConfig.mailgun.endpoint}/messages`, {
            body: formData,
            headers: {
              Authorization: `Basic ${Buffer.from(`api:${runtimeConfig.mailgun.sendingKey}`).toString('base64')}`
            },
            method: 'POST'
          })

          if (!response.ok) {
            throw new Error(JSON.stringify(await response.json()))
          }
        }
      } as unknown as EmailConfig,
      GoogleProvider({
        clientId: runtimeConfig.google.clientId,
        clientSecret: runtimeConfig.google.clientSecret
      }),
      GithubProvider({
        clientId: runtimeConfig.github.clientId,
        clientSecret: runtimeConfig.github.clientSecret
      })
    ],
    trustHost: true,
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
