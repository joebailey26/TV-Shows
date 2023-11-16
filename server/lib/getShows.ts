import type { D1Database, KVNamespace } from "@cloudflare/workers-types"
import type { H3EventContext } from 'h3'
import getShowsEpisodate from './getShowsEpisodate'

export default async function getShows (context: H3EventContext) {
  const DB: D1Database = context.cloudflare.env.DB
  const KV_TV_SHOWS: KVNamespace = context.cloudflare.env.KV_TV_SHOWS

  const { results } = await DB.prepare(
    'SELECT * FROM tv_shows'
    // ToDo
    //  Where user = current user
    //  Limit
    //  Offset
  ).all()

  const episodesToReturn = [] as EpisodateShow[]

  // Loop through all shows and fetch the data we need from KV or Episodate
  for (const show of results as unknown as D1Show[]) {
    // Check if we have the show stored in the KV cache
    const cachedShow = await KV_TV_SHOWS.get(show.id)

    if (cachedShow !== undefined && cachedShow !== null) {
      episodesToReturn.push(await JSON.parse(cachedShow))
    } else {
      episodesToReturn.push(await getShowsEpisodate(show.id, context))
    }
  }

  return episodesToReturn
}
