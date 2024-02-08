import type { H3Event } from 'h3'
import { asc, eq } from 'drizzle-orm'
import { tvShows, users, episodateTvShows } from '../../db/schema'
import { useDb } from './db'
import { syncShow } from './syncShow'
import { transformShowFromDb } from './transformShowFromDb'

type ShowCategories = Array<'currentlyWatching'|'wantToWatch'|'toCatchUpOn'|'waitingFor'|'cancelled'>

export async function getShows (event: H3Event, userEmail: string, showCategories: ShowCategories = [], limit = 24, offset = 0): Promise<EpisodateShowTransformed[]> {
  const DB = await useDb(event)

  let query = DB.select({ ...episodateTvShows })
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

  // At the moment, we're only going to allow specifying one category
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
      // countdown is null
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
  event.waitUntil(Promise.all(shows.map(show => syncShow(show.id, event))))

  // ToDo
  //  Can we get the countdown episodes directly in the query above?
  const transformedShows = shows.map((show) => {
    // ToDo
    //  Should we be adding episodes here? Or only in the get single show? Performance?
    return transformShowFromDb(show, event)
  })

  return await Promise.all(transformedShows)
}
