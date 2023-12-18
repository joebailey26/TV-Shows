import getShows from '../lib/getShowsWithEpisodate'
import { useAuthOptions } from '../lib/auth'
import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const authOptions = await useAuthOptions(event)
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

  const shows = await getShows(event, userEmail)

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

  return shows
})
