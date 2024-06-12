import type { H3Event } from 'h3'
import { getShowExists } from '../../lib/getShowExists'
import { tvShows } from '../../db/schema'
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

  await syncShow(showId, event, true)

  const DB = await useDb(event)
  await DB.insert(tvShows).values({ showId, userId: user.id })

  setResponseStatus(event, 201)
  return 'Added successfully'
})
