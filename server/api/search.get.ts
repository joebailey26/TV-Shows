import type { H3Event } from 'h3'
import getShows from '../lib/getShows'
import { getAuthenticatedUserEmail } from '../lib/auth'

export default defineEventHandler(async (event: H3Event): Promise<EpisodateSearch> => {
  const userEmail = await getAuthenticatedUserEmail(event)
  const query = getQuery(event)

  const q = Array.isArray(query.q) ? query.q[0] : query.q
  let p = Array.isArray(query.p) ? query.p[0] : query.p

  if (typeof q !== 'string') {
    throw createError({ statusMessage: 'You\'re not searching for anything', statusCode: 400 })
  }

  p = (typeof p === 'string') ? parseInt(p, 10) : 1 // Default to 1 if page is not a string

  const fetchPromise = fetch(`https://www.episodate.com/api/search?q=${q}&page=${p}`, {
    method: 'POST'
  })

  const getShowsPromise = getShows(event, userEmail, { currentlyWatching: true, wantToWatch: true, toCatchUpOn: true }, 0)

  const [response, shows] = await Promise.all([fetchPromise, getShowsPromise])

  const data = await response.json() as EpisodateSearch

  for (const show of data.tv_shows) {
    show.tracked = !!shows.find(s => s.id === show.id)
  }

  return data
})
