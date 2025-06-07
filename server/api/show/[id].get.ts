import type { H3Event } from 'h3'
import { eq, and, asc, sql, gt } from 'drizzle-orm'
import { getAuthenticatedUserEmail } from '../../lib/auth'
import { tvShows, users, episodateTvShows, episodes } from '../../db/schema'
import { useDb } from '../../lib/db'
import { getEpisodesForShow } from '../../lib/getEpisodesForShow'

export default defineEventHandler(async (event: H3Event): Promise<EpisodateShowTransformed|null> => {
  const userEmail = await getAuthenticatedUserEmail(event)

  const showIdParam = getRouterParam(event, 'id')

  if (!showIdParam) {
    throw createError({ statusMessage: 'Missing show id', statusCode: 400 })
  }

  const showId = parseInt(showIdParam)

  const DB = await useDb()

  const countdown = DB.selectDistinct({
    id: sql<number>`${episodes.id}`.as('countdownId'),
    season: episodes.season,
    episode: episodes.episode,
    name: sql<string>`${episodes.name}`.as('countdownName'),
    air_date: episodes.air_date,
    episodateTvShowId: sql<number>`${episodes.episodateTvShowId}`.as('countdownEpisodateTvShowId'),
    watched: sql<boolean>`0`.as('countdownWatched')
  })
    .from(episodes)
    .where(
      gt(sql`date(${episodes.air_date})`, sql`date('now')`)
    )
    .orderBy(
      asc(sql`date(${episodes.air_date})`)
    )
    .as('countdown')

  const showStmt = DB.selectDistinct({
    id: episodateTvShows.id,
    name: episodateTvShows.name,
    permalink: episodateTvShows.permalink,
    url: episodateTvShows.url,
    description: episodateTvShows.description,
    description_source: episodateTvShows.description_source,
    start_date: episodateTvShows.start_date,
    end_date: episodateTvShows.end_date,
    country: episodateTvShows.country,
    status: episodateTvShows.status,
    runtime: episodateTvShows.runtime,
    network: episodateTvShows.network,
    youtube_link: episodateTvShows.youtube_link,
    image_path: episodateTvShows.image_path,
    image_thumbnail_path: episodateTvShows.image_thumbnail_path,
    rating: episodateTvShows.rating,
    rating_count: episodateTvShows.rating_count,
    genres: episodateTvShows.genres,
    pictures: episodateTvShows.pictures,
    updatedAt: episodateTvShows.updatedAt,
    countdown: {
      id: countdown.id,
      season: countdown.season,
      episode: countdown.episode,
      name: countdown.name,
      air_date: countdown.air_date,
      episodateTvShowId: countdown.episodateTvShowId,
      watched: countdown.watched
    }
  })
    .from(episodateTvShows)
    .leftJoin(
      countdown,
      eq(episodateTvShows.id, countdown.episodateTvShowId)
    )
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
    .limit(1)
    .prepare('getShow')

  const showResponse = await showStmt.all()

  if (!showResponse[0]) {
    return null
  }

  const episodesFromDb = await getEpisodesForShow(showId, userEmail, event)

  return {
    ...showResponse[0],
    tracked: true,
    genres: showResponse[0]?.genres ? showResponse[0].genres.split(',') : [],
    pictures: showResponse[0]?.pictures ? showResponse[0].pictures.split(',') : [],
    episodes: episodesFromDb
  }
})
