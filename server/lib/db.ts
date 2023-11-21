import type { D1Database } from '@cloudflare/workers-types'
import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1'
import { H3Event } from 'h3'

export function useDb (event: H3Event) {
  const D1DB: D1Database = event.context.cloudflare.env.DB
  const DB: DrizzleD1Database = drizzle(D1DB)

  return DB
}
