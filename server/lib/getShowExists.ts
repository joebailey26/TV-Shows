import type { H3Event } from 'h3'
import { eq, and } from 'drizzle-orm'
import { tvShows } from '../../db/schema'
import { useDb } from '../lib/db'

export default async function getShow (showId: string, userId: string, event: H3Event): Promise<boolean> {
  const DB = useDb(event)

  const response = await DB.select({ id: tvShows.showId }).from(tvShows)
    .where(
      and(
        eq(tvShows.showId, parseInt(showId)),
        eq(tvShows.userId, userId)
      )
    )

  return !!response.length
}
