import type { H3Event } from 'h3'
import getShow from '../../lib/getShow'
import { getAuthenticatedUserEmail } from '../../lib/auth'

export default defineEventHandler(async (event: H3Event): Promise<EpisodateShow> => {
  const userEmail = await getAuthenticatedUserEmail(event)

  const showIdParam = getRouterParam(event, 'id')

  if (!showIdParam) {
    throw createError({ statusMessage: 'Missing show id', statusCode: 400 })
  }

  const showId = parseInt(showIdParam)

  // Check if the id already exists and return an error if so
  const show = await getShow(showId, userEmail, event)

  if (!show) {
    throw createError({ statusMessage: 'Show does not exist', statusCode: 409 })
  }

  return show
})
