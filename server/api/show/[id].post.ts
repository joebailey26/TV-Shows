import type { H3Event } from 'h3'
import getShowExists from '../../lib/getShowExists'
import { tvShows } from '../../../db/schema'
import { getAuthenticatedUserEmail } from '../../lib/auth'
import { useDb } from '../../lib/db'
import getUserByEmail from '../../lib/getUserByEmail'
import { syncShow } from '../../lib/episodate'

export default defineEventHandler(async (event: H3Event) => {
  const DB = await useDb(event)

  const userEmail = await getAuthenticatedUserEmail(event)

  const showId = getRouterParam(event, 'id')

  if (!showId) {
    throw createError({ statusMessage: 'Missing show id', statusCode: 400 })
  }

  // Check if the id already exists and return an error if so
  const exists = await getShowExists(showId, userEmail, event)

  if (exists) {
    throw createError({ statusMessage: 'Show already exists', statusCode: 409 })
  }

  const user = await getUserByEmail(userEmail, event)

  if (!user) {
    throw createError({ statusMessage: 'Could not find user', statusCode: 400 })
  }

  await syncShow(parseInt(showId), event)

  await DB.insert(tvShows).values({ showId: parseInt(showId), userId: user.id })

  setResponseStatus(event, 201)
  return 'Added successfully'
})
