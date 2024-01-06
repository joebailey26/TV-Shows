import type { H3Event } from 'h3'
import { asc, eq } from 'drizzle-orm'
import { tvShows, users, episodateTvShows } from '../../db/schema'
import { useDb } from './db'
import { syncShows } from './episodate'

export default async function getShows (event: H3Event, userEmail: string, limit = 24, offset = 0): Promise<Show[]> {
  const DB = await useDb(event)

  let query = DB.select({
    episodateTvShows: {
      id: episodateTvShows.id,
      name: episodateTvShows.name,
      episodateData: episodateTvShows.episodateData,
      updatedAt: episodateTvShows.updatedAt
    },
    tvShows: {
      latestWatchedEpisode: tvShows.latestWatchedEpisode
    }
  })
    .from(episodateTvShows)
    .leftJoin(
      tvShows,
      eq(tvShows.showId, episodateTvShows.id)
    )
    .leftJoin(
      users,
      eq(users.id, tvShows.userId)
    )
    .where(eq(users.email, userEmail))
    .orderBy(asc(episodateTvShows.name))

  if (limit !== 0) {
    // @ts-expect-error
    query = query.limit(limit).offset(offset)
  }

  const results = await query

  event.waitUntil(syncShows(results.map(result => result.episodateTvShows), event))

  return results.map((result) => {
    return {
      ...result.episodateTvShows.episodateData,
      latestWatchedEpisode: result.tvShows ? result.tvShows.latestWatchedEpisode : null
    }
  })
}
