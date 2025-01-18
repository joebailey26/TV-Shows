import { eq, and, sql } from 'drizzle-orm'
import { subYears, formatISO } from 'date-fns'
import { episodateTvShows, episodes, tvShows, users, watchedEpisodes } from '../db/schema'
import { useDb } from './db'

interface Show {
  name: string
  air_date: string
  showName: string
  showId: number|null
}

export const getShowsForUser = async (userEmail: string): Promise<Show[]> => {
  const DB = await useDb()

  return await DB.selectDistinct({
    name: episodes.name,
    air_date: episodes.air_date,
    showName: sql<string>`${episodateTvShows.name} as showName`,
    showId: episodateTvShows.id
  })
    .from(episodes)
    .leftJoin(
      episodateTvShows,
      eq(episodateTvShows.id, episodes.episodateTvShowId)
    )
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
        eq(users.email, userEmail),
        // Only show episodes for the last year
        sql`episodes.air_date >= ${formatISO(subYears(new Date(), 1), { representation: 'date' })}`,
        sql`NOT EXISTS (
          SELECT 1 FROM ${watchedEpisodes} AS we
          JOIN ${users} AS u ON u.id = we.userId
          WHERE we.episodeId = ${episodes}.id AND u.email = ${userEmail}
        )`
      )
    )
}
