import type { D1Database } from '@cloudflare/workers-types'

export {}

declare global {
  const __env__: {
    DB: D1Database
    GOOGLE_CREDENTIALS: string
    NUXT_AUTH_JS_SECRET: string
    NUXT_GITHUB_CLIENT_ID: string
    NUXT_GITHUB_CLIENT_SECRET: string
    NUXT_GOOGLE_CLIENT_ID: string
    NUXT_GOOGLE_CLIENT_SECRET: string
    NUXT_MAILGUN_ENDPOINT: string
    NUXT_MAILGUN_SENDING_KEY: string
    NUXT_PUBLIC_AUTH_JS_BASE_URL: string
    NUXT_SYNC_SECRET: string
  }
}
