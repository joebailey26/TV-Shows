// This is very likely to break when we start getting more shows added

import type { H3Event } from 'h3'
import { tvShows } from '../../db/schema'
import { useDb } from '../lib/db'
import { syncShow } from '../lib/episodate'

export default defineEventHandler(async (event: H3Event) => {
  const DB = await useDb(event)

  const results = await DB.select().from(tvShows)

  const syncPromises = results.map(show => syncShow(show.showId, event))

  await Promise.all(syncPromises)

  setResponseStatus(event, 201)
  return 'Success'
})
