import GoogleProvider from '@auth/core/providers/google'
import GithubProvider from '@auth/core/providers/github'
import type { D1Database } from '@cloudflare/workers-types'
import type { AuthConfig } from '@auth/core/types'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1'
import { H3Event } from 'h3'
import { skipCSRFCheck } from '@auth/core'

export function useAuthOptions (event: H3Event) {
  const runtimeConfig = useRuntimeConfig()

  const authOptions: AuthConfig = {
    secret: runtimeConfig.authJs.secret,
    providers: [
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
    skipCSRFCheck
  }

  // if (event.context.cloudflare) {
    const D1DB: D1Database = process.env.DB
    const DB: DrizzleD1Database = drizzle(D1DB)
    authOptions.adapter = DrizzleAdapter(DB)
  // }

  return authOptions
}
