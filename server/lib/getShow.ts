import type { H3Event } from 'h3'
import { eq, and } from 'drizzle-orm'
import { tvShows, users, seasons, episodes } from '../../db/schema'
import { useDb } from '../lib/db'

export default async function getShow (showId: number, userEmail: string, event: H3Event): Promise<EpisodateShow> {
  const DB = await useDb(event)

  // return await DB.select().from(seasons)

  const response = await DB.selectDistinct().from(tvShows)
    .leftJoin(
      users,
      eq(users.id, tvShows.userId)
    )
    .leftJoin(
      seasons,
      eq(tvShows.showId, seasons.episodateTvShowId)
    )
    .leftJoin(
      episodes,
      eq(seasons.id, episodes.seasonId)
    )
    .where(
      and(
        eq(tvShows.showId, showId),
        eq(users.email, userEmail)
      )
    )

  // ToDo
  //  Place episodes back into seasons

  return response
}
