import type { H3Event } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { episodes, users, watchedEpisodes } from '../../db/schema'
import { useDb } from '../lib/db'

export async function getEpisodesForShow (showId: number, userEmail: string, event: H3Event): Promise<EpisodesTransformed[]> {
  const DB = await useDb(event)

  const episodesResponse = await DB.select({
    ...episodes,
    watched: sql`EXISTS (
      SELECT 1 FROM ${watchedEpisodes} AS we
      JOIN ${users} AS u ON u.id = we.userId
      WHERE we.episodeId = ${episodes}.id AND u.email = ${userEmail}
    )`
  })
    .from(episodes)
    .where(eq(episodes.episodateTvShowId, showId))

  return episodesResponse as EpisodesTransformed[]
}
