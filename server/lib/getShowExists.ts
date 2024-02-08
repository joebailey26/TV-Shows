import type { H3Event } from 'h3'
import { eq, and } from 'drizzle-orm'
import { tvShows, users } from '../../db/schema'
import { useDb } from '../lib/db'

export async function getShowExists (showId: number, userEmail: string, event: H3Event): Promise<boolean> {
  const DB = await useDb(event)

  const showResponse = await DB.selectDistinct({ id: tvShows.id })
    .from(tvShows)
    .leftJoin(
      users,
      eq(users.id, tvShows.userId)
    )
    .where(
      and(
        eq(tvShows.showId, showId),
        eq(users.email, userEmail)
      )
    )
    .limit(1)

  return !!showResponse[0]?.id
}
