import type { H3Event } from 'h3'
import { eq, and } from 'drizzle-orm'
import { tvShows, users } from '../../db/schema'
import { useDb } from '../lib/db'

export default async function getShowExists (showId: number, userEmail: string, event: H3Event): Promise<boolean> {
  const DB = await useDb(event)

  const showResponse = await DB.selectDistinct({id: tvShows.id})
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

  return !!showResponse[0]?.id
}
