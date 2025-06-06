import { format } from 'date-fns'
import { eq } from 'drizzle-orm'
import { episodateTvShows, episodes, tvShows, users } from '../db/schema'
import { useDb } from './db'
import { sendEmail } from './sendEmail'

export async function syncShow (showId: number): Promise<void> {
  const DB = await useDb()

  const existing = await DB.select({
    start_date: episodateTvShows.start_date,
    status: episodateTvShows.status,
    name: episodateTvShows.name
  })
    .from(episodateTvShows)
    .where(eq(episodateTvShows.id, showId))
    .limit(1)

  const prevStartDate = existing[0]?.start_date || null
  const prevStatus = existing[0]?.status || null

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

  const releaseDateAdded = !prevStartDate && tvShow.start_date
  const cancelled = prevStatus && !['canceled-ended', 'ended'].includes(prevStatus.toLowerCase()) && ['canceled-ended', 'ended'].includes((tvShow.status || '').toLowerCase())

  if (releaseDateAdded || cancelled) {
    const watchers = await DB.select({ email: users.email })
      .from(tvShows)
      .leftJoin(users, eq(tvShows.userId, users.id))
      .where(eq(tvShows.showId, showId))

    const subject = cancelled
      ? `${tvShow.name} has been cancelled`
      : `${tvShow.name} has a release date`

    const message = cancelled
      ? `The show ${tvShow.name} has been marked as cancelled.`
      : `The show ${tvShow.name} will premiere on ${tvShow.start_date}.`

    await Promise.all(
      watchers.map(w => sendEmail(w.email, subject, message, `<p>${message}</p>`))
    )
  }
}
