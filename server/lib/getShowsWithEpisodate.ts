import type { D1Database, KVNamespace } from '@cloudflare/workers-types'
import type { H3EventContext } from 'h3'
import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1'
import { tvShows } from '../../db/schema'
import type { EpisodateShow, EpisodateShowDetails } from '../../types/episodate'

export default async function getShows (context: H3EventContext) {
  const D1DB: D1Database = context.cloudflare.env.DB
  const KV_TV_SHOWS: KVNamespace = context.cloudflare.env.KV_TV_SHOWS
  const DB: DrizzleD1Database = drizzle(D1DB)
  // ToDo
  //  Where user = current user
  //  Limit
  //  Offset
  const results = await DB.select().from(tvShows).all()

  const episodesToReturn = [] as EpisodateShow[]

  // Loop through all shows and fetch the data we need from KV or Episodate
  for (const show of results) {
    // Check if we have the show stored in the KV cache
    const cachedShow = await KV_TV_SHOWS.get(show.id.toString())

    if (cachedShow !== undefined && cachedShow !== null) {
      episodesToReturn.push(await JSON.parse(cachedShow))
    } else {
      const episodateData = await fetch(`https://www.episodate.com/api/show-details?q=${show.id}`)
      const r = await episodateData.json() as EpisodateShowDetails
      const tvShow = r.tvShow as EpisodateShow
      // If we don't get data back, then throw an error
      if (!tvShow) {
        throw new Error(`We didn't receive data from the Episodate API for show ${show.id}`)
      }
      // Cache the response in KV with a key of the show id
      await KV_TV_SHOWS.put(show.id.toString(), JSON.stringify(tvShow))

      episodesToReturn.push(tvShow)
    }
  }

  return episodesToReturn
}
