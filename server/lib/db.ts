import type { D1Database } from '@cloudflare/workers-types'
import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1'
import { binding } from 'cf-bindings-proxy'
import { H3Event } from 'h3'
import { Logger } from 'drizzle-orm/logger'

class MyLogger implements Logger {
  logQuery (query: string, params: unknown[]): void {
    if (process.env.NODE_ENV === 'development') {
      /* eslint-disable no-console */
      console.log({ query, params })
      console.log('\n')
      console.log('\n')
      /* eslint-enable no-console */
    }
  }
}

export async function useDb (event: H3Event) {
  const D1DB: D1Database = await binding<D1Database>('DB', { fallback: event.context.cloudflare ? event.context.cloudflare.env : null })
  const DB: DrizzleD1Database = drizzle(D1DB, { logger: new MyLogger() })
  return DB
}
