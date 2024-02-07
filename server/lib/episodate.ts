import type { H3Event } from 'h3'
import { eq, and } from 'drizzle-orm'
import { episodateTvShows, episodes } from '../../db/schema'
import { useDb } from './db'

export async function syncShow (showId: number, event: H3Event, force: boolean = false): Promise<void> {
  const DB = await useDb(event)

  // Get episodate show from data
  const episodateShow = await DB.select().from(episodateTvShows).where(eq(episodateTvShows.id, showId))

  if (episodateShow.length) {
    const currentTime = new Date().getTime() // Get the current time
    const storedTime = new Date(episodateShow[0].updatedAt).getTime() // Convert stored timestamp to Date object
    const differenceInHours = (currentTime - storedTime) / 1000 / 3600 // Calculate difference in hours
    // Only update if 8 hours has elapsed since last update
    if (differenceInHours < 8) {
      return
    }
  } else if (!force) {
    // Show does not exist, so no need to sync
    return
  }

  const episodateData = await fetch(`https://www.episodate.com/api/show-details?q=${showId}`)
  const r = await episodateData.json() as EpisodateShowDetails
  const tvShow = r.tvShow
  // If we don't get data back, then log an error
  if (!tvShow.id) {
    // eslint-disable-next-line
    console.error(`We didn't receive data from the Episodate API for show ${showId}`)
  }

  const contentToUpsert = {
    name: tvShow.name,
    permalink: tvShow.permalink,
    description: tvShow.description,
    description_source: tvShow.description_source,
    start_date: tvShow.start_date,
    end_date: tvShow.end_date,
    country: tvShow.country,
    status: tvShow.status,
    runtime: tvShow.runtime,
    network: tvShow.network,
    youtube_link: tvShow.youtube_link,
    image_path: tvShow.image_path,
    image_thumbnail_path: tvShow.image_thumbnail_path,
    rating: tvShow.rating,
    rating_count: tvShow.rating_count,
    genres: tvShow.genres.join(','),
    pictures: tvShow.pictures.join(','),
    // ToDo
    // We need to implement this in order to show the countdown on the homepage
    // countdown:
  }

  await DB.insert(episodateTvShows).values({
    id: tvShow.id,
    ...contentToUpsert
  }).onConflictDoUpdate({
    target: episodateTvShows.id,
    set: contentToUpsert
  })

  if (tvShow?.episodes) {
    // ToDo
    //  Use Drizzle Batch or promise.all. Perhaps we need to move to upsert?
    for (const episode of tvShow.episodes) {
      // Check Database to see if episode exists
      const dbEpisode = await DB.select({ id: episodes.id }).from(episodes)
      .where(
        and(
          eq(episodes.episodateTvShowId, tvShow.id),
          eq(episodes.episode, episode.episode)
        )
      )
      // Update episode if so, otherwise create it
      if (dbEpisode[0]?.id) {
        await DB.update(episodes)
          .set({
            name: episode.name,
            air_date: episode.air_date
          })
          .where(
            and(
              eq(episodes.episodateTvShowId, tvShow.id),
              eq(episodes.episode, episode.episode)
            )
          )
      } else {
        await DB.insert(episodes)
          .values({
            season: episode.season,
            episode: episode.episode,
            name: episode.name,
            air_date: episode.air_date,
            episodateTvShowId: tvShow.id
          })
      }
    }
  }
}

export async function syncShows (episodateTvShows: EpisodateTvShows[], event: H3Event): Promise<void> {
  // Check if we need to update D1 from episodate
  for (const show of episodateTvShows) {
    await syncShow(show.id, event)
  }
}
