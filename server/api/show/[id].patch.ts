import type { H3Event } from 'h3'
import { eq, and } from 'drizzle-orm'
import { getShowExists } from '../../lib/getShowExists'
import { tvShows } from '../../../db/schema'
import { getAuthenticatedUserEmail } from '../../lib/auth'
import { useDb } from '../../lib/db'
import { getUserByEmail } from '../../lib/getUserByEmail'

export default defineEventHandler(async (event: H3Event) => {
  const DB = await useDb(event)

  const userEmail = await getAuthenticatedUserEmail(event)

  const showIdParam = getRouterParam(event, 'id')

  if (!showIdParam) {
    throw createError({ statusMessage: 'Missing show id', statusCode: 400 })
  }

  const showId = parseInt(showIdParam)

  // Check if the id already exists and return an error if so
  const exists = await getShowExists(showId, userEmail, event)

  if (!exists) {
    throw createError({ statusMessage: 'Show does not exist', statusCode: 409 })
  }

  const user = await getUserByEmail(userEmail, event)

  if (!user) {
    throw createError({ statusMessage: 'Could not find user', statusCode: 400 })
  }

  const body = await readBody(event)

  if (!body) {
    throw createError({ statusMessage: 'You must pass a body', statusCode: 400 })
  }

  let parsedBody

  try {
    parsedBody = JSON.parse(body)
  } catch {
    throw createError({ statusMessage: 'Body is not valid JSON', statusCode: 400 })
  }

  const episode: Number = parsedBody.episode

  // ToDo
  //  Fetch episodes for show
  //  Add them to watched episodes if they match

  setResponseStatus(event, 200)
  return 'Updated successfully'
})
