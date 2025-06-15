import type { H3Event } from 'h3'
import { asc, desc, eq, inArray, and, countDistinct, gt, sql, notInArray, lte } from 'drizzle-orm'
import { alias, type SQLiteSelect } from 'drizzle-orm/sqlite-core'
import { getAuthenticatedUserEmail } from '../lib/auth'
import { tvShows, users, episodateTvShows, episodes, watchedEpisodes } from '../db/schema'
import { pageSize as ps } from '../api/shows.get'
import { useDb } from '../lib/db'

type ShowCategory = 'wantToWatch'|'toCatchUpOn'|'waitingFor'|'cancelled'|''
type SortType =
  | 'alphabetical'
  | 'episodesToWatch'
  | 'nextEpisodeDate'
  | 'firstEpisodeDate'
type SortOrder = 'asc'|'desc'

export const pageSize = 20

export default defineEventHandler(async (event: H3Event): Promise<CustomSearch> => {
  const userEmail = await getAuthenticatedUserEmail(event)

  const queryParams = getQuery(event)
  let page = Array.isArray(queryParams.p) ? queryParams.p[0] : queryParams.p
  page = (typeof page === 'string') ? parseInt(page, 10) : 1

  const showCategory = Array.isArray(queryParams.showCategory) ? queryParams.showCategory[0] : queryParams.showCategory as ShowCategory
  const sortParam = Array.isArray(queryParams.sort) ? queryParams.sort[0] : queryParams.sort
  let sort: SortType
  switch (sortParam) {
    case 'episodesToWatch':
    case 'nextEpisodeDate':
    case 'firstEpisodeDate':
      sort = sortParam
      break
    default:
      sort = 'alphabetical'
  }
  const orderParam = Array.isArray(queryParams.order) ? queryParams.order[0] : queryParams.order
  const order: SortOrder = orderParam === 'desc' ? 'desc' : 'asc'

  // If offset starts to be slow
  // We could use SELECT WHERE NOT IN ( SELECT episodateTvShows.id FROM episodateTvShows ORDER BY episodateTvShows.name ASC LIMIT :offset )
  // This effectively skips the first X rows
  function withPagination<T extends SQLiteSelect>(qb: T, page: number, pageSize: number = ps) {
    return qb.limit(pageSize).offset((page - 1) * pageSize)
  }

  function querySetup(qb: SQLiteSelect, sort: SortType, order: SortOrder): SQLiteSelect {
    const futureEpisodes = alias(episodes, 'futureEpisodes')
    const allEpisodes = alias(episodes, 'allEpisodes')

    let q = qb.leftJoin(
      tvShows,
      eq(tvShows.showId, episodateTvShows.id)
    )
      .leftJoin(
        users,
        eq(users.id, tvShows.userId)
      )
      .leftJoin(
        episodes,
        and(
          eq(episodes.episodateTvShowId, episodateTvShows.id),
          lte(sql`date(${episodes.air_date})`, sql`date('now')`)
        )
      )

    if (sort === 'nextEpisodeDate') {
      q = q.leftJoin(
        futureEpisodes,
        and(
          eq(futureEpisodes.episodateTvShowId, episodateTvShows.id),
          gt(sql`date(${futureEpisodes.air_date})`, sql`date('now')`)
        )
      )
    }

    if (sort === 'firstEpisodeDate') {
      q = q.leftJoin(
        allEpisodes,
        eq(allEpisodes.episodateTvShowId, episodateTvShows.id)
      )
    }

    q = q.leftJoin(
      watchedEpisodes,
      and(
        eq(watchedEpisodes.episodeId, episodes.id),
        eq(watchedEpisodes.userId, tvShows.userId)
      )
    )
      .groupBy(episodateTvShows.id)
      .where(eq(users.email, userEmail))

    if (sort === 'episodesToWatch') {
      q = q.orderBy(
        order === 'asc'
          ? asc(sql`count(distinct ${episodes.id}) - count(distinct ${watchedEpisodes.id})`)
          : desc(sql`count(distinct ${episodes.id}) - count(distinct ${watchedEpisodes.id})`),
        order === 'asc' ? asc(episodateTvShows.name) : desc(episodateTvShows.name)
      )
    } else if (sort === 'nextEpisodeDate') {
      q = q.orderBy(
        order === 'asc'
          ? asc(sql`min(date(${futureEpisodes.air_date}))`)
          : desc(sql`min(date(${futureEpisodes.air_date}))`),
        order === 'asc' ? asc(episodateTvShows.name) : desc(episodateTvShows.name)
      )
    } else if (sort === 'firstEpisodeDate') {
      q = q.orderBy(
        order === 'asc'
          ? asc(sql`min(date(${allEpisodes.air_date}))`)
          : desc(sql`min(date(${allEpisodes.air_date}))`),
        order === 'asc' ? asc(episodateTvShows.name) : desc(episodateTvShows.name)
      )
    } else {
      q = q.orderBy(order === 'asc' ? asc(episodateTvShows.name) : desc(episodateTvShows.name))
    }
    return q
  }

  function categoryCancelled(qb: SQLiteSelect) {
    return qb
      .having(({ watchedEpisodeCount, pastEpisodeCount }) =>
        and(
          // Show has status of cancelled
          inArray(sql`lower(${episodateTvShows.status})`, ['canceled-ended', 'ended']),
          // You have watched all released episodes
          eq(watchedEpisodeCount, pastEpisodeCount)
        )
      )
  }

  function categoryWantToWatch(qb: SQLiteSelect) {
    return qb.having(({ watchedEpisodeCount, pastEpisodeCount }) =>
      and(
        // You have not watched any episodes
        eq(watchedEpisodeCount, 0),
        // At least 1 aired episode
        gt(pastEpisodeCount, 1)
      )
    )
  }

  function categoryToCatchUpOn(qb: SQLiteSelect) {
    return qb.having(({ watchedEpisodeCount, pastEpisodeCount }) =>
      and(
        // There have been episodes released that you have not watched
        gt(pastEpisodeCount, watchedEpisodeCount),
        // You have watched at least one episode
        gt(watchedEpisodeCount, 0)
      )
    )
  }

  function categoryWaitingFor(qb: SQLiteSelect) {
    return qb.having(({ watchedEpisodeCount, pastEpisodeCount }) =>
      and(
        // Show does not have status of cancelled
        notInArray(sql`lower(${episodateTvShows.status})`, ['canceled-ended', 'ended']),
        // You have watched all released episodes
        eq(pastEpisodeCount, watchedEpisodeCount)
      )
    )
  }

  const DB = await useDb()

  // If this pagination strategy starts to be slow
  // We should instead return limit + 1
  // From this we can work out that there are more records to return
  const countQuery = DB.select({
    watchedEpisodeCount: countDistinct(watchedEpisodes.id),
    pastEpisodeCount: countDistinct(episodes.id)
  })
    .from(episodateTvShows)
    .$dynamic()

  const query = DB.select({
    id: episodateTvShows.id,
    name: episodateTvShows.name,
    permalink: episodateTvShows.permalink,
    // eslint-disable-next-line camelcase
    start_date: episodateTvShows.start_date,
    // eslint-disable-next-line camelcase
    end_date: episodateTvShows.end_date,
    country: episodateTvShows.country,
    network: episodateTvShows.network,
    status: episodateTvShows.status,
    // eslint-disable-next-line camelcase
    image_thumbnail_path: episodateTvShows.image_thumbnail_path,
    updatedAt: episodateTvShows.updatedAt,
    watchedEpisodeCount: countDistinct(watchedEpisodes.id),
    pastEpisodeCount: countDistinct(episodes.id),
    episodesToWatch: sql<number>`count(distinct ${episodes.id}) - count(distinct ${watchedEpisodes.id})`
  })
    .from(episodateTvShows)
    .$dynamic()

  querySetup(countQuery, sort, order)
  querySetup(query, sort, order)

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

  return {
    total: batch[0].length.toString(),
    page,
    pages: Math.ceil(batch[0].length / pageSize),
    // eslint-disable-next-line camelcase
    tv_shows: showsToReturn
  }
})
