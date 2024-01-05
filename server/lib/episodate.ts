import type { H3Event } from 'h3'
import { eq } from 'drizzle-orm'
import { episodateTvShows } from '../../db/schema'
import { useDb } from './db'

export async function syncShow (showId: number, event: H3Event): Promise<void> {
  let shouldSync = true

  const DB = await useDb(event)

  // Get episodate show from data
  const episodateShow = await DB.select().from(episodateTvShows).where(eq(episodateTvShows.id, showId))

  if (episodateShow.length) {
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
  if (!tvShow) {
    // eslint-disable-next-line
    console.error(`We didn't receive data from the Episodate API for show ${showId}`)
  }

  await DB.insert(episodateTvShows).values({
    id: tvShow.id,
    name: tvShow.name,
    episodateData: tvShow
  })
}

export async function syncShows (episodateTvShows: EpisodateTvShows[], event: H3Event): Promise<void> {
  // Check if we need to update D1 from episodate
  for (const show of episodateTvShows) {
    await syncShow(show.id, event)
  }
}
