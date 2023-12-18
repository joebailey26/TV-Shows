
import { eq, and } from 'drizzle-orm'
import getShowExists from '../../lib/getShowExists'
import { tvShows } from '../../../db/schema'
import { useAuthOptions } from '../../lib/auth'
import { useDb } from '../../lib/db'
import getUserByEmail from '../../lib/getUserByEmail'
import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const DB = await useDb(event)
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
