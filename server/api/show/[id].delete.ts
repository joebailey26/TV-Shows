import type { D1Database } from '@cloudflare/workers-types'
import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1'
import { eq, and } from 'drizzle-orm'
import getShowExists from '../../lib/getShowExists'
import { tvShows } from '../../../db/schema'
import { authOptions } from '../auth/[...]'
import { getServerSession } from '#auth'

export default defineEventHandler(async (event) => {
  const D1DB: D1Database = event.context.cloudflare.env.DB
  const DB: DrizzleD1Database = drizzle(D1DB)

  const session = await getServerSession(event, authOptions)
  if (!session?.user?.email) {
    throw createError({ statusMessage: 'Unauthenticated', statusCode: 403 })
  }
  const userEmail = session.user.email

  const showId = getRouterParam(event, 'id')

  if (!showId) {
    setResponseStatus(event, 400)
    return 'Missing show id'
  }

  // Check if the id already exists and return an error if it doesn't, we can't delete a show that does not exist
  const exists = await getShowExists(showId, userEmail, event.context)

  if (!exists) {
    setResponseStatus(event, 404)
    return 'Show does not exist'
  }

  await DB.delete(tvShows)
    .where(
      and(
        eq(tvShows.showId, parseInt(showId)),
        eq(tvShows.userEmail, userEmail)
      )
    )

  setResponseStatus(event, 201)
  return 'Removed successfully'
})
