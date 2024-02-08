import type { H3Event } from 'h3'
import { eq, and } from 'drizzle-orm'
import { tvShows, users, episodateTvShows } from '../../db/schema'
import { useDb } from '../lib/db'
import { transformShowFromDb } from './transformShowFromDb'
import { getEpisodesForShow } from './getEpisodesForShow'

export async function getShow (showId: number, userEmail: string, event: H3Event): Promise<EpisodateShowTransformed | null> {
  const DB = await useDb(event)

  const showResponse = await DB.selectDistinct({ ...episodateTvShows })
    .from(episodateTvShows)
    .leftJoin(
      tvShows,
      eq(tvShows.showId, episodateTvShows.id)
    )
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

  if (!showResponse[0]) {
    return null
  }

  const episodesFromDb = await getEpisodesForShow(showResponse[0].id, userEmail, event)

  // ToDo
  //  Add countdown

  return {
    ...transformShowFromDb(showResponse[0]),
    episodes: episodesFromDb
  }
}
