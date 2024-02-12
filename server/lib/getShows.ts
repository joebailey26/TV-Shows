import type { H3Event } from 'h3'
import { asc, eq, inArray, and, countDistinct, gt, sql, notInArray, gte } from 'drizzle-orm'
import { tvShows, users, episodateTvShows, episodes, watchedEpisodes } from '../../db/schema'
import { useDb } from './db'
import { syncShow } from './syncShow'

type ShowCategory = 'wantToWatch'|'toCatchUpOn'|'waitingFor'|'cancelled'|''

export async function getShows (event: H3Event, userEmail: string, category: ShowCategory = '', limit = 24, offset = 0): Promise<EpisodateShowFromSearchTransformed[]> {
  const DB = await useDb(event)

  const query = DB.select({
    id: episodateTvShows.id,
    name: episodateTvShows.name,
    permalink: episodateTvShows.permalink,
    start_date: episodateTvShows.start_date,
    end_date: episodateTvShows.end_date,
    country: episodateTvShows.country,
    network: episodateTvShows.network,
    status: episodateTvShows.status,
    image_thumbnail_path: episodateTvShows.image_thumbnail_path,
    updatedAt: episodateTvShows.updatedAt,
    episodeCount: countDistinct(episodes.id),
    watchedEpisodeCount: countDistinct(watchedEpisodes.id)
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
    .leftJoin(
      episodes,
      eq(episodes.episodateTvShowId, episodateTvShows.id)
    )
    .leftJoin(
      watchedEpisodes,
      and(
        eq(
          watchedEpisodes.episodeId, episodes.id
        ),
        eq(
          watchedEpisodes.userId, tvShows.userId
        )
      )
    )
    .orderBy(asc(episodateTvShows.name))
    .groupBy(episodateTvShows.id)

  if (limit !== 0) {
    query.limit(limit).offset(offset)
  }

  if (category === 'cancelled') {
    query.where(
      and(
        eq(users.email, userEmail),
        inArray(sql`lower(${episodateTvShows.status})`, ['canceled-ended', 'ended'])
      )
    )
  } else {
    query.where(eq(users.email, userEmail))
  }
  if (category === 'wantToWatch') {
    // watchedEpisodes.length = 0
    query.having(({ watchedEpisodeCount }) => eq(watchedEpisodeCount, 0))
  } else if (category === 'toCatchUpOn') {
    // watchedEpisodes.length < episodes.length - 1
    query.having(({ watchedEpisodeCount, episodeCount }) => gt(sql`${episodeCount} - 1`, watchedEpisodeCount))
  } else if (category === 'waitingFor') {
    // watchedEpisodes.length = episodes.length && not cancelled
    query.having(({ watchedEpisodeCount, episodeCount }) => and(gte(watchedEpisodeCount, sql`${episodeCount} - 1`), notInArray(sql`lower(${episodateTvShows.status})`, ['canceled-ended', 'ended'])))
  }

  const shows = await query
  const showsToReturn = shows.map((show) => {
    return {
      ...show,
      tracked: true
    }
  })

  // ToDo
  //  This should really be on a cron, but we do this instead each time this endpoint is hit
  event.waitUntil(Promise.all(showsToReturn.map(show => syncShow(show as EpisodateShowFromSearchTransformed, event))))

  return showsToReturn
}
