import type { D1Database } from '@cloudflare/workers-types'
import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1'
import { binding } from 'cf-bindings-proxy'
import { H3Event } from 'h3'

export async function useDb (event: H3Event) {
  const D1DB: D1Database = await binding<D1Database>('DB', { fallback: event.context.cloudflare ? event.context.cloudflare.env : null })
  const DB: DrizzleD1Database = drizzle(D1DB)
  return DB
}
