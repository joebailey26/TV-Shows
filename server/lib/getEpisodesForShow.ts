import { eq, isNotNull, asc, sql } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { users, episodes, watchedEpisodes } from '../db/schema'
import { useDb } from '../lib/db'

export async function getEpisodesForShow (showId: number, userEmail: string, event: H3Event): Promise<EpisodesTransformed[]> {
  const DB = await useDb(event)

  const watched = DB.selectDistinct({
    episodeId: watchedEpisodes.episodeId
  })
    .from(watchedEpisodes)
    .leftJoin(users,
      eq(users.id, watchedEpisodes.userId)
    )
    .where(
      eq(users.email, userEmail)
    )
    .as('watched')

  return DB.select({
    id: episodes.id,
    season: episodes.season,
    episode: episodes.episode,
    name: episodes.name,
    air_date: episodes.air_date,
    episodateTvShowId: episodes.episodateTvShowId,
    watched: sql<boolean>`${isNotNull(watched.episodeId)}`
  })
    .from(episodes)
    .where(eq(episodes.episodateTvShowId, showId))
    .leftJoin(
      watched,
      eq(episodes.id, watched.episodeId)
    )
    .orderBy(asc(sql`date(${episodes.air_date})`))
}
