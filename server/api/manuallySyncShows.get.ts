import type { H3Event } from 'h3'
import { tvShows } from '../../db/schema'
import { useDb } from '../lib/db'
import { syncShow } from '../lib/episodate'

export default defineEventHandler(async (event: H3Event) => {
  const DB = await useDb(event)

  const results = await DB.select().from(tvShows)

  for (const show of results) {
    await syncShow(show.showId, event)
  }

  setResponseStatus(event, 201)
  return 'Success'
})
