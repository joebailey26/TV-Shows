import type { H3Event } from 'h3'
import { eq, and } from 'drizzle-orm'
import { episodateTvShows, seasons, episodes } from '../../db/schema'
import { useDb } from './db'

export async function syncShow (showId: number, event: H3Event): Promise<void> {
  let shouldSync = true
  // ToDo
  //  Should we use upsert here instead?
  let isExisting = false

  const DB = await useDb(event)

  // Get episodate show from data
  const episodateShow = await DB.select().from(episodateTvShows).where(eq(episodateTvShows.id, showId))

  if (episodateShow.length) {
    isExisting = true
    const currentTime = new Date().getTime() // Get the current time
    const storedTime = new Date(episodateShow[0].updatedAt).getTime() // Convert stored timestamp to Date object
    const differenceInHours = (currentTime - storedTime) / 1000 / 3600 // Calculate difference in hours
    // Only update if 8 hours has elapsed since last update
    if (differenceInHours < 8) {
      shouldSync = false
    }
  }

  if (!shouldSync) {
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

  if (isExisting) {
    await DB.update(episodateTvShows).set({
      id: tvShow.id,
      name: tvShow.name,
      permalink: tvShow.permalink,
      url: tvShow.permalink,
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
      genres: tvShow.genres,
      pictures: tvShow.pictures
      // countdown
    }).where(eq(episodateTvShows.id, tvShow.id))
  } else {
    await DB.insert(episodateTvShows).values({
      id: tvShow.id,
      name: tvShow.name,
      permalink: tvShow.permalink,
      url: tvShow.permalink,
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
      genres: tvShow.genres,
      pictures: tvShow.pictures
      // countdown
    })
  }

  if (tvShow?.episodes) {
    // ToDo
    //  Group episodes into seasons to batch the DB requests
    for (const episode of tvShow.episodes) {
      // Check Database to see if season exists
      // We never need to update seasons
      let season = await DB.select({ id: seasons.id }).from(seasons)
        .where(
          and(
            eq(seasons.season, episode.season),
            eq(seasons.episodateTvShowId, tvShow.id)
          )
        )
      // Create season if it doesn't exist
      if (!season[0]?.id) {
        season = await DB.insert(seasons).values({
          season: episode.season,
          episodateTvShowId: tvShow.id
        }).returning({ id: seasons.id })
      }
      // Check Database to see if episode exists
      const dbEpisode = await DB.select({ id: episodes.id }).from(episodes)
        .where(
          and(
            eq(episodes.seasonId, season[0].id),
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
              eq(episodes.seasonId, season[0].id),
              eq(episodes.episode, episode.episode)
            )
          )
      } else {
        await DB.insert(episodes)
          .values({
            seasonId: season[0].id,
            episode: episode.episode,
            name: episode.name,
            air_date: episode.air_date
          })
      }
      // let watched = false
      // if (episode.season === tvShow.latestWatchedEpisode?.season) {
      //   if (episode.episode <= tvShow.latestWatchedEpisode?.episode) {
      //     watched = true
      //   }
      // } else if (episode.season < tvShow.latestWatchedEpisode?.season) {
      //   watched = true
      // }
      // episode.watched = watched
    }

    // show.seasons = episodesBySeason
    // show.seasons.sort((a, b) => b.season - a.season)
    // show.seasons.forEach((season) => {
    //   season.episodes.sort((a, b) => new Date(b.air_date).getTime() - new Date(a.air_date).getTime())
    // })
  }
}

export async function syncShows (episodateTvShows: EpisodateTvShows[], event: H3Event): Promise<void> {
  // Check if we need to update D1 from episodate
  for (const show of episodateTvShows) {
    await syncShow(show.id, event)
  }
}
