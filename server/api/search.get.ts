import type { H3Event } from 'h3'
import { and, eq, inArray } from 'drizzle-orm'
import { getAuthenticatedUserEmail } from '../lib/auth'
import { useDb } from '../lib/db'
import { episodateTvShows, tvShows, users } from '~/db/schema'

export default defineEventHandler(async (event: H3Event): Promise<CustomSearch> => {
  const userEmail = await getAuthenticatedUserEmail(event)
  const query = getQuery(event)

  const q = Array.isArray(query.q) ? query.q[0] : query.q
  let p = Array.isArray(query.p) ? query.p[0] : query.p

  if (typeof q !== 'string') {
    throw createError({ statusMessage: 'You\'re not searching for anything', statusCode: 400 })
  }

  p = (typeof p === 'string') ? parseInt(p, 10) : 1 // Default to 1 if page is not a string

  const response = await fetch(`https://www.episodate.com/api/search?q=${q}&page=${p}`, {
    method: 'POST'
  })

  const data = await response.json() as EpisodateSearch

  const transformedTvShows = data.tv_shows.map(show => ({
    ...show,
    tracked: false
  })) as EpisodateShowFromSearchTransformed[]

  const searchedShowIds = data.tv_shows.map(show => show.id)

  if (searchedShowIds) {
    const DB = await useDb(event)

    const trackedShows = await DB.select({
      id: episodateTvShows.id
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
      .where(
        and(
          eq(users.email, userEmail),
          inArray(episodateTvShows.id, searchedShowIds)
        )
      )

    for (const show of transformedTvShows) {
      show.tracked = !!trackedShows.find(s => s.id === show.id)
    }
  }

  return {
    ...data,
    tv_shows: transformedTvShows
  }
})
