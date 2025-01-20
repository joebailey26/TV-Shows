import { format } from 'date-fns'
import { episodateTvShows, episodes } from '../db/schema'
import { useDb } from './db'

export async function syncShow (showId: number): Promise<void> {
  const DB = await useDb()

  const episodateData = await fetch(`https://www.episodate.com/api/show-details?q=${showId}`)
  const r = await episodateData.json() as EpisodateShowDetails
  const tvShow = r.tvShow
  // If we don't get data back, then log an error
  if (!tvShow.id) {
    // eslint-disable-next-line
    console.error(`We didn't receive data from the Episodate API for show ${showId}`)

    return
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
    pictures: tvShow.pictures.join(','),
    updatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
  }

  const batchStatements = []

  batchStatements.push(
    DB.insert(episodateTvShows).values({
      id: tvShow.id,
      ...contentToUpsert
    }).onConflictDoUpdate({
      target: episodateTvShows.id,
      set: contentToUpsert
    })
  )

  for (const episode of tvShow.episodes) {
    batchStatements.push(
      DB.insert(episodes)
        .values({
          season: episode.season,
          episode: episode.episode,
          name: episode.name,
          air_date: episode.air_date,
          episodateTvShowId: tvShow.id
        })
        .onConflictDoUpdate({
          target: [episodes.episodateTvShowId, episodes.episode, episodes.season],
          set: {
            name: episode.name,
            air_date: episode.air_date
          }
        })
    )
  }

  await DB.batch(batchStatements)
}
