import type { H3Event } from 'h3'
import { eq, and, inArray } from 'drizzle-orm'
import { getShowExists } from '../../lib/getShowExists'
import { episodes, watchedEpisodes } from '../../../db/schema'
import { getAuthenticatedUserEmail } from '../../lib/auth'
import { useDb } from '../../lib/db'
import { getUserByEmail } from '../../lib/getUserByEmail'
import { getShow } from '../../lib/getShow'

export default defineEventHandler(async (event: H3Event) => {
  const DB = await useDb(event)

  const userEmail = await getAuthenticatedUserEmail(event)

  const showIdParam = getRouterParam(event, 'id')

  if (!showIdParam) {
    throw createError({ statusMessage: 'Missing show id', statusCode: 400 })
  }

  const showId = parseInt(showIdParam)

  // Check if the id already exists and return an error if so
  const exists = await getShowExists(showId, userEmail, event)

  if (!exists) {
    throw createError({ statusMessage: 'Show does not exist', statusCode: 409 })
  }

  const user = await getUserByEmail(userEmail, event)

  if (!user) {
    throw createError({ statusMessage: 'Could not find user', statusCode: 400 })
  }

  const body = await readBody(event)

  if (!body) {
    throw createError({ statusMessage: 'You must pass a body', statusCode: 400 })
  }

  if (!body.episode) {
    throw createError({ statusMessage: 'You must pass an episode', statusCode: 400 })
  }

  // ToDo
  //  Combine these queries to be more efficient

  const watchedEpisode = await DB.selectDistinct()
    .from(episodes)
    .where(
      and(
        eq(episodes.id, body.episode),
        eq(episodes.episodateTvShowId, showId)
      )
    )
    .limit(1)

  if (!watchedEpisode[0]) {
    throw createError({ statusMessage: 'Invalid Episode', statusCode: 400 })
  }

  const episodesFromDb = await DB.select()
    .from(episodes)
    .where(eq(episodes.episodateTvShowId, showId))

  const watchedEpisodesToPush = []

  for (const episode of episodesFromDb) {
    if (episode.season < watchedEpisode[0].season) {
      watchedEpisodesToPush.push(episode)
    } else if (episode.season === watchedEpisode[0].season) {
      if (episode.episode <= watchedEpisode[0].episode) {
        watchedEpisodesToPush.push(episode)
      }
    }
  }

  const watchedEpisodesInDb = await DB.select({ id: watchedEpisodes.id })
    .from(watchedEpisodes)
    .where(
      and(
        eq(episodes.episodateTvShowId, showId),
        eq(watchedEpisodes.userId, user.id)
      )
    )
    .leftJoin(
      episodes,
      eq(watchedEpisodes.episodeId, episodes.id)
    )

  // Clear current watched episodes
  if (watchedEpisodesInDb.length > 0) {
    await DB.delete(watchedEpisodes)
      .where(
        inArray(watchedEpisodes.id, watchedEpisodesInDb.map(episode => episode.id))
      )
  }

  // Add watched episodes
  watchedEpisodesToPush.forEach(async (episode) => {
    await DB.insert(watchedEpisodes)
      .values({
        userId: user.id,
        episodeId: episode.id
      })
  })

  return getShow(showId, userEmail, event)
})
