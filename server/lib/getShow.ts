import type { H3Event } from 'h3'
import { eq, and } from 'drizzle-orm'
import { tvShows, users, episodes, episodateTvShows } from '../../db/schema'
import { useDb } from '../lib/db'

export default async function getShow (showId: number, userEmail: string, event: H3Event): Promise<Partial<EpisodateShow> | null> {
  const DB = await useDb(event)

  const showResponse = await DB.selectDistinct({ episodateTvShows })
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

  const showFromDb = showResponse[0]?.episodateTvShows

  if (!showFromDb) {
    return null
  }

  const episodeResponse = await DB.select({ episodes })
    .from(episodes)
    .where(
      eq(episodes.episodateTvShowId, showFromDb.id)
    )

  const episodesFromDb = episodeResponse.map(episode => episode.episodes)

  const show: Partial<EpisodateShow> = {
    ...showFromDb,
    genres: showFromDb?.genres?.split(','),
    pictures: showFromDb?.pictures?.split(','),
    episodes: episodesFromDb
  }

  return show
}
