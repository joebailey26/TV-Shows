import type { H3Event } from 'h3'
import { asc, eq } from 'drizzle-orm'
import { tvShows, users, episodateTvShows } from '../../db/schema'
import { useDb } from './db'
import { syncShows } from './episodate'

interface ShowCategories {
  currentlyWatching: boolean;
  wantToWatch: boolean;
  toCatchUpOn: boolean;
}

export default async function getShows (event: H3Event, userEmail: string, showCategories: ShowCategories = { currentlyWatching: true, wantToWatch: true, toCatchUpOn: true }, limit = 24, offset = 0): Promise<Partial<EpisodateShow>[]> {
  const DB = await useDb(event)

  let query = DB.select({ episodateTvShows })
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

  if (showCategories.currentlyWatching) {
    // watchedEpisodes.length = episodes.length - 1
  }

  if (showCategories.wantToWatch) {
    // watchedEpisodes.length = 0
  }

  if (showCategories.toCatchUpOn) {
    // watchedEpisodes.length < episodes.length - 1
  }

  const shows = await query

  event.waitUntil(syncShows(shows.map(show => show.episodateTvShows), event))

  return shows.map((show) => {
    // ToDo
    //  Sort out typing here
    show.episodateTvShows.tracked = true
    show.episodateTvShows.genres = show.episodateTvShows.genres?.split(',')
    show.episodateTvShows.pictures = show.episodateTvShows.pictures?.split(',')

    // ToDo
    //  Should we be adding episodes here? Or only in the get single show? Performance?
    return show.episodateTvShows as Partial<EpisodateShow>
  })
}
