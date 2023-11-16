import type { D1Database } from '@cloudflare/workers-types'
import type { H3EventContext } from 'h3'
import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import { tvShows } from '../../db/schema'

export default async function getShow (showId: string, context: H3EventContext): Promise<boolean> {
  const D1DB: D1Database = context.cloudflare.env.DB
  const DB: DrizzleD1Database = drizzle(D1DB)

  return !!await DB.select({ id: tvShows.id }).from(tvShows).where(eq(tvShows.id, parseInt(showId)))
}
