import { eq, sql } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { users, episodes, watchedEpisodes } from '../../db/schema'
import { useDb } from '../lib/db'

export async function getEpisodesForShow (showId: number, userEmail: string, event: H3Event) {
  const DB = await useDb(event)

  return DB.select({
    id: episodes.id,
    season: episodes.season,
    episode: episodes.episode,
    name: episodes.name,
    air_date: episodes.air_date,
    episodateTvShowId: episodes.episodateTvShowId,
    watched: sql`EXISTS (
      SELECT 1 FROM ${watchedEpisodes} AS we
      JOIN ${users} AS u ON u.id = we.userId
      WHERE we.episodeId = ${episodes}.id AND u.email = ${userEmail}
    )`
  })
    .from(episodes)
    .where(eq(episodes.episodateTvShowId, showId)) as Promise<EpisodesTransformed[]>
}
