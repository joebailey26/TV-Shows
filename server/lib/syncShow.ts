import type { H3Event } from 'h3'
import { eq } from 'drizzle-orm'
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
    url: tvShow.url,
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
    pictures: tvShow.pictures.join(',')
  }

  await DB.insert(episodateTvShows).values({
    id: tvShow.id,
    ...contentToUpsert
  }).onConflictDoUpdate({
    target: episodateTvShows.id,
    set: contentToUpsert
  })

  for (const episode of tvShow.episodes) {
    const dbEpisode = await DB.insert(episodes)
      .values({
        season: episode.season,
        episode: episode.episode,
        name: episode.name,
        air_date: episode.air_date,
        episodateTvShowId: tvShow.id
      })
      .returning({
        id: episodes.id
      })
      .onConflictDoUpdate({
        target: [episodes.episodateTvShowId, episodes.episode, episodes.season],
        set: {
          name: episode.name,
          air_date: episode.air_date
        }
      })

    // Set countdown
    if (episode.episode === tvShow.countdown?.episode && episode.season === tvShow.countdown?.season) {
      await DB.update(episodateTvShows)
        .set({
          countdown: dbEpisode[0].id
        })
        .where(eq(episodateTvShows.id, tvShow.id))
    }
  }
}
