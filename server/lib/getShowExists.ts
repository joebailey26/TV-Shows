import type { H3Event } from 'h3'
import { eq, and } from 'drizzle-orm'
import { tvShows, users } from '../../db/schema'
import { useDb } from '../lib/db'

export default async function getShow (showId: string, userEmail: string, event: H3Event): Promise<boolean> {
  const DB = useDb(event)

  const response = await DB.select({ id: tvShows.showId }).from(tvShows)
    .leftJoin(
      users,
      eq(users.id, tvShows.userId)
    )
    .where(
      and(
        eq(tvShows.showId, parseInt(showId)),
        eq(users.email, userEmail)
      )
    )

  return !!response.length
}
