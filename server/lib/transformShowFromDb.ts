import type { H3Event } from 'h3'
import { eq } from 'drizzle-orm'
import { episodes } from '../../db/schema'
import { useDb } from '../lib/db'

export async function transformShowFromDb (showFromDb: EpisodateTvShows, event: H3Event): Promise<EpisodateShowTransformed> {
  const DB = await useDb(event)

  // Find countdown for show
  const countdown = await DB.selectDistinct({ ...episodes })
    .from(episodes)
    .where(
      eq(episodes.id, showFromDb.countdown)
    )
    .limit(1)

  return {
    ...showFromDb,
    tracked: true,
    genres: showFromDb?.genres ? showFromDb.genres.split(',') : [],
    pictures: showFromDb?.pictures ? showFromDb.pictures.split(',') : [],
    episodes: [],
    countdown: countdown[0] ?? {}
  }
}
