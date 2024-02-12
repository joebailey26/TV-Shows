import type { H3Event } from 'h3'
import { eq, and } from 'drizzle-orm'
import { tvShows, users, episodateTvShows } from '../../db/schema'
import { useDb } from '../lib/db'
import { getEpisodesForShow } from './getEpisodesForShow'

export async function getShow (showId: number, userEmail: string, event: H3Event): Promise<EpisodateShowTransformed | null> {
  const DB = await useDb(event)

  // @ts-expect-error
  const showResponse = await DB.selectDistinct({ ...episodateTvShows })
    .from(episodateTvShows)
    .leftJoin(
      tvShows,
      eq(tvShows.showId, episodateTvShows.id)
    )
    .leftJoin(
      users,
      eq(users.id, tvShows.userId)
    )
    .where(
      and(
        eq(tvShows.showId, showId),
        eq(users.email, userEmail)
      )
    )
    .limit(1) as EpisodateTvShows[]

  if (!showResponse[0]) {
    return null
  }

  const episodesFromDb = await getEpisodesForShow(showId, userEmail, event)

  function getNextEpisode (episodes: EpisodesTransformed[]) {
    // Get today's date for comparison
    const today = new Date()

    // Filter episodes that are after today's date
    const futureEpisodes = episodes.filter((episode) => {
      const episodeDate = new Date(episode.air_date)
      return episodeDate > today
    })

    // Sort these future episodes by air date
    futureEpisodes.sort((a, b) => new Date(a.air_date).getTime() - new Date(b.air_date).getTime())

    // Return the first episode in the sorted array, which is the next episode to air
    return futureEpisodes.length > 0 ? futureEpisodes[0] : null
  }

  return {
    ...showResponse[0],
    tracked: true,
    genres: showResponse[0]?.genres ? showResponse[0].genres.split(',') : [],
    pictures: showResponse[0]?.pictures ? showResponse[0].pictures.split(',') : [],
    episodes: episodesFromDb,
    countdown: getNextEpisode(episodesFromDb)
  }
}
