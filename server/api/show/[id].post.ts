import type { H3Event } from 'h3'
import { eq } from 'drizzle-orm'
import { getShowExists } from '../../lib/getShowExists'
import { episodateTvShows, tvShows } from '../../db/schema'
import { getAuthenticatedUserEmail } from '../../lib/auth'
import { useDb } from '../../lib/db'
import { getUserByEmail } from '../../lib/getUserByEmail'
import { syncShow } from '../../lib/syncShow'

export default defineEventHandler(async (event: H3Event) => {
  const userEmail = await getAuthenticatedUserEmail(event)

  const showIdParam = getRouterParam(event, 'id')

  if (!showIdParam) {
    throw createError({ statusMessage: 'Missing show id', statusCode: 400 })
  }

  const showId = parseInt(showIdParam)

  // Check if the id already exists and return an error if so
  const exists = await getShowExists(showId, userEmail, event)

  if (exists) {
    throw createError({ statusMessage: 'Show already exists', statusCode: 409 })
  }

  const user = await getUserByEmail(userEmail, event)

  if (!user) {
    throw createError({ statusMessage: 'Could not find user', statusCode: 400 })
  }

  const DB = await useDb()

  // Only sync the show if it does not already exist
  const episodateShows = await DB.select({ id: episodateTvShows.id }).from(episodateTvShows).where(eq(episodateTvShows.id, showId)).limit(1)
  if (episodateShows.length === 0) {
    await syncShow(showId)
  }

  await DB.insert(tvShows).values({ showId, userId: user.id })

  setResponseStatus(event, 201)
  return 'Added successfully'
})
