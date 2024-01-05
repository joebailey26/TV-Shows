import type { H3Event } from 'h3'
import getShows from '../lib/getShows'
import { getAuthenticatedUserEmail } from '../lib/auth'

export default defineEventHandler(async (event: H3Event) => {
  const userEmail = await getAuthenticatedUserEmail(event)

  const query = getQuery(event)
  let limit = Array.isArray(query.limit) ? query.limit[0] : query.limit
  let offset = Array.isArray(query.offset) ? query.offset[0] : query.offset

  // Convert to number only if the value is a string and not undefined
  limit = (typeof limit === 'string') ? parseInt(limit, 10) : 24 // Default to 24 if limit is not a string
  offset = (typeof offset === 'string') ? parseInt(offset, 10) : 0 // Default to 0 if offset is not a string

  const shows = await getShows(event, userEmail, limit, offset)

  const totalShows = shows.length

  return {
    total: totalShows.toString(),
    page: 0,
    pages: 0,
    tv_shows: shows.map(result => result.episodateData)
  } as EpisodateSearch
})
