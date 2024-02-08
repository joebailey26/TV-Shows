import type { H3Event } from 'h3'
import { getShow } from '../../lib/getShow'
import { getAuthenticatedUserEmail } from '../../lib/auth'

export default defineEventHandler(async (event: H3Event) => {
  const userEmail = await getAuthenticatedUserEmail(event)

  const showIdParam = getRouterParam(event, 'id')

  if (!showIdParam) {
    throw createError({ statusMessage: 'Missing show id', statusCode: 400 })
  }

  const showId = parseInt(showIdParam)

  return getShow(showId, userEmail, event)
})
