import { H3EventContext } from 'h3'
import { EpisodateShow } from '~/types/episodate'

export default function getShowsEpisodate (id: string, context: H3EventContext) {
  const KV_TV_SHOWS: KVNamespace = context.cloudflare.env.KV_TV_SHOWS

  return fetch(`https://www.episodate.com/api/show-details?q=${id}`).then(async (response) => {
    const r = await response.json()
    const tvShow = r.tvShow as EpisodateShow
    // If we don't get data back, then throw an error
    if (!tvShow) {
      throw new Error(`We didn't receive data from the Episodate API for show ${id}`)
    }
    // Cache the response in KV with a key of the show id
    await KV_TV_SHOWS.put(id, JSON.stringify(tvShow))

    // Return the data
    return tvShow
  })
}
