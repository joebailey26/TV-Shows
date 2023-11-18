import type { D1Database } from '@cloudflare/workers-types'
import type { H3EventContext } from 'h3'
import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1'
import { eq, and } from 'drizzle-orm'
import { tvShows } from '../../db/schema'

export default async function getShow (showId: string, userEmail: string, context: H3EventContext): Promise<boolean> {
  const D1DB: D1Database = context.cloudflare.env.DB
  const DB: DrizzleD1Database = drizzle(D1DB)

  const response = await DB.select({ id: tvShows.showId }).from(tvShows)
    .where(
      and(
        eq(tvShows.showId, parseInt(showId)),
        eq(tvShows.userEmail, userEmail)
      )
    )

  return !!response.length
}
