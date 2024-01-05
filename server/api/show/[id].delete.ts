import type { H3Event } from 'h3'
import { eq, and } from 'drizzle-orm'
import getShowExists from '../../lib/getShowExists'
import { tvShows } from '../../../db/schema'
import { getAuthenticatedUserEmail } from '../../lib/auth'
import { useDb } from '../../lib/db'
import getUserByEmail from '../../lib/getUserByEmail'

export default defineEventHandler(async (event: H3Event) => {
  const DB = await useDb(event)

  const userEmail = await getAuthenticatedUserEmail(event)

  const showId = getRouterParam(event, 'id')

  if (!showId) {
    throw createError({ statusMessage: 'Missing show id', statusCode: 400 })
  }

  // Check if the id already exists and return an error if it doesn't, we can't delete a show that does not exist
  const exists = await getShowExists(showId, userEmail, event)

  if (!exists) {
    throw createError({ statusMessage: 'Show does not exist', statusCode: 404 })
  }

  const user = await getUserByEmail(userEmail, event)

  if (!user) {
    throw createError({ statusMessage: 'Could not find user', statusCode: 400 })
  }

  await DB.delete(tvShows)
    .where(
      and(
        eq(tvShows.showId, parseInt(showId)),
        eq(tvShows.userId, user.id)
      )
    )

  setResponseStatus(event, 201)
  return 'Removed successfully'
})
