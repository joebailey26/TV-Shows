import type { D1Database } from '@cloudflare/workers-types'
import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1'
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

  // Check if the id already exists and return an error if so
  const exists = await getShowExists(showId, userEmail, event.context)

  if (exists) {
    setResponseStatus(event, 409)
    return 'Show already exists'
  }

  await DB.insert(tvShows).values({ showId: parseInt(showId), userEmail })

  setResponseStatus(event, 201)
  return 'Added successfully'
})
