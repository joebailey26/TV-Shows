import type { H3Event } from 'h3'
import { asc, eq, inArray, and, countDistinct, gt, sql, notInArray, gte } from 'drizzle-orm'
import { SQLiteSelect } from 'drizzle-orm/sqlite-core'
import { getAuthenticatedUserEmail } from '../lib/auth'
import { tvShows, users, episodateTvShows, episodes, watchedEpisodes } from '../../db/schema'
import { pageSize as ps } from '../api/shows.get'
import { useDb } from '../lib/db'
import { syncShow } from '../lib/syncShow'

type ShowCategory = 'wantToWatch'|'toCatchUpOn'|'waitingFor'|'cancelled'|''

export const pageSize = 20

export default defineEventHandler(async (event: H3Event): Promise<CustomSearch> => {
  const userEmail = await getAuthenticatedUserEmail(event)

  const queryParams = getQuery(event)
  let page = Array.isArray(queryParams.p) ? queryParams.p[0] : queryParams.p
  page = (typeof page === 'string') ? parseInt(page, 10) : 1

  const showCategory = Array.isArray(queryParams.showCategory) ? queryParams.showCategory[0] : queryParams.showCategory as ShowCategory

  // If offset starts to be slow
  // We could use SELECT WHERE NOT IN ( SELECT episodateTvShows.id FROM episodateTvShows ORDER BY episodateTvShows.name ASC LIMIT :offset )
  // This effectively skips the first X rows
  function withPagination<T extends SQLiteSelect> (qb: T, page: number, pageSize: number = ps) {
    return qb.limit(pageSize).offset((page - 1) * pageSize)
  }

  function querySetup<T extends SQLiteSelect> (qb: T) {
    return qb.leftJoin(
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
      .where(eq(users.email, userEmail))
  }

  function categoryCancelled<T extends SQLiteSelect> (qb: T) {
    return qb.where(inArray(sql`lower(${episodateTvShows.status})`, ['canceled-ended', 'ended']))
  }

  function categoryWantToWatch<T extends SQLiteSelect> (qb: T) {
    return qb.having(({ watchedEpisodeCount }) => eq(watchedEpisodeCount, 0))
  }

  function categoryToCatchUpOn<T extends SQLiteSelect> (qb: T) {
    return qb.having(({ watchedEpisodeCount, episodeCount }) => gt(sql`${episodeCount} - 1`, watchedEpisodeCount))
  }

  function categoryWaitingFor<T extends SQLiteSelect> (qb: T) {
    return qb.having(({ watchedEpisodeCount, episodeCount }) => and(gte(watchedEpisodeCount, sql`${episodeCount} - 1`), notInArray(sql`lower(${episodateTvShows.status})`, ['canceled-ended', 'ended'])))
  }

  const DB = await useDb(event)

  // If this pagination strategy starts to be slow
  // We should instead return limit + 1
  // From this we can work out that there are more records to return
  const countQuery = DB.select({
    episodeCount: countDistinct(episodes.id),
    watchedEpisodeCount: countDistinct(watchedEpisodes.id)
  })
    .from(episodateTvShows)
    .$dynamic()

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
    .$dynamic()

  querySetup(countQuery)
  querySetup(query)

  if (page !== 0) {
    withPagination(query, page)
  }

  if (showCategory === 'cancelled') {
    categoryCancelled(query)
    categoryCancelled(countQuery)
  } else if (showCategory === 'wantToWatch') {
    categoryWantToWatch(query)
    categoryWantToWatch(countQuery)
  } else if (showCategory === 'toCatchUpOn') {
    categoryToCatchUpOn(query)
    categoryToCatchUpOn(countQuery)
  } else if (showCategory === 'waitingFor') {
    categoryWaitingFor(query)
    categoryWaitingFor(countQuery)
  }

  const batch = await DB.batch([
    countQuery,
    query
  ])

  const showsToReturn = batch[1].map((show) => {
    return {
      ...show,
      tracked: true
    } as EpisodateShowFromSearchTransformed
  })

  // ToDo
  //  This should really be on a cron, but we do this instead each time this endpoint is hit
  event.waitUntil(Promise.all(showsToReturn.map(show => syncShow(show, event))))

  return {
    total: batch[0].length.toString(),
    page,
    pages: Math.ceil(batch[0].length / pageSize),
    tv_shows: showsToReturn
  }
})
