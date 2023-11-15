import type { H3EventContext } from 'h3';

export default function getShowsEpisodate (id: number, context: H3EventContext) {
  return fetch(`https://www.episodate.com/api/show-details?q=${id}`).then(async (response) => {
    const r = await response.json()
    // If we don't get data back, then throw an error
    if (!r.tvShow) {
      throw new Error(`We didn't receive data from the Episodate API for show ${id}`)
    }
    // Cache the response in KV with a key of the show id
    await context.cloudflare.env.KV_TV_SHOWS.put(id.toString(), JSON.stringify(r.tvShow))

    // Return the data
    return r.tvShow
  })
}
