import type { H3Event } from 'h3'
import { asc, eq } from 'drizzle-orm'
import { tvShows, users, episodateTvShows } from '../../db/schema'
import { useDb } from './db'
import { syncShow } from './syncShow'

type ShowCategories = Array<'currentlyWatching'|'wantToWatch'|'toCatchUpOn'|'waitingFor'|'cancelled'>

export async function getShows (event: H3Event, userEmail: string, showCategories: ShowCategories = [], limit = 24, offset = 0): Promise<EpisodateShowFromSearchTransformed[]> {
  const DB = await useDb(event)

  let query = DB.select({
    id: episodateTvShows.id,
    name: episodateTvShows.name,
    permalink: episodateTvShows.permalink,
    start_date: episodateTvShows.start_date,
    end_date: episodateTvShows.end_date,
    country: episodateTvShows.country,
    network: episodateTvShows.network,
    status: episodateTvShows.status,
    image_thumbnail_path: episodateTvShows.image_thumbnail_path,
    updatedAt: episodateTvShows.updatedAt
  })
    .from(episodateTvShows)
    .leftJoin(
      tvShows,
      eq(tvShows.showId, episodateTvShows.id)
    )
    .leftJoin(
      users,
      eq(users.id, tvShows.userId)
    )
    .where(eq(users.email, userEmail))
    .orderBy(asc(episodateTvShows.name))

  if (limit !== 0) {
    // @ts-expect-error
    query = query.limit(limit).offset(offset)
  }

  // ToDo
  //  At the moment, we're only going to allow specifying one category
  //  We can revisit this in the future
  for (const category of showCategories) {
    if (category === 'currentlyWatching') {
      // watchedEpisodes.length = episodes.length - 1
      break
    }
    if (category === 'wantToWatch') {
      // watchedEpisodes.length = 0
      break
    }
    if (category === 'toCatchUpOn') {
      // watchedEpisodes.length < episodes.length - 1
      break
    }
    if (category === 'waitingFor') {
      // latest episode is in future
      break
    }
    if (category === 'cancelled') {
      // status = ended
      break
    }
  }

  const shows = await query

  // ToDo
  //  This should really be on a cron, but we do this instead each time this endpoint is hit
  event.waitUntil(Promise.all(shows.map(show => syncShow(show as EpisodateShowFromSearchTransformed, event))))

  return shows.map((show) => {
    return {
      ...show,
      tracked: true
    }
  })
}
