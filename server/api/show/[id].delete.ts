
import { eq, and } from 'drizzle-orm'
import getShowExists from '../../lib/getShowExists'
import { tvShows } from '../../../db/schema'
import { useAuthOptions } from '../../lib/auth'
import { useDb } from '../../lib/db'
import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const DB = useDb(event)
  const authOptions = useAuthOptions(event)

  const session = await getServerSession(event, authOptions)
  if (!session?.user?.id) {
    throw createError({ statusMessage: 'Unauthenticated', statusCode: 403 })
  }
  const userId = session.user.id

  const showId = getRouterParam(event, 'id')

  if (!showId) {
    setResponseStatus(event, 400)
    return 'Missing show id'
  }

  // Check if the id already exists and return an error if it doesn't, we can't delete a show that does not exist
  const exists = await getShowExists(showId, userId, event)

  if (!exists) {
    setResponseStatus(event, 404)
    return 'Show does not exist'
  }

  await DB.delete(tvShows)
    .where(
      and(
        eq(tvShows.showId, parseInt(showId)),
        eq(tvShows.userId, userId)
      )
    )

  setResponseStatus(event, 201)
  return 'Removed successfully'
})
