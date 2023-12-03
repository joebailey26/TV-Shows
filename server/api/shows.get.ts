import { getQuery } from 'h3'
import getShows from '../lib/getShowsWithEpisodate'
import { useAuthOptions } from '../lib/auth'
import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const authOptions = useAuthOptions(event)
  let session
  try {
    session = await getServerSession(event, authOptions)
  } catch (e) {
    throw createError({ statusMessage: 'Unauthenticated', statusCode: 403 })
  }
  if (!session?.user?.email) {
    throw createError({ statusMessage: 'Unauthenticated', statusCode: 403 })
  }
  const userEmail = session.user.email

  const query = getQuery(event)
  let limit = Array.isArray(query.limit) ? query.limit[0] : query.limit
  let offset = Array.isArray(query.offset) ? query.offset[0] : query.offset

  // Convert to number only if the value is a string and not undefined
  limit = (typeof limit === 'string') ? parseInt(limit, 10) : 24 // Default to 24 if limit is not a string
  offset = (typeof offset === 'string') ? parseInt(offset, 10) : 0 // Default to 0 if offset is not a string

  const shows = await getShows(event, userEmail, limit, offset)

  // Return the shows sorted alphabetically
  shows.sort((a, b) => {
    const nameA = a.name.toUpperCase() // to ensure case-insensitive comparison
    const nameB = b.name.toUpperCase() // to ensure case-insensitive comparison

    if (nameA < nameB) {
      return -1
    }
    if (nameA > nameB) {
      return 1
    }

    // names must be equal
    return 0
  })

  return {
    total: '0',
    page: 0,
    pages: 0,
    tv_shows: shows
  } as EpisodateSearch
})
