import type { H3Event } from 'h3'
import { eq, and, inArray, sql } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'
import { getShowExists } from '../../lib/getShowExists'
import { episodes, watchedEpisodes, users, tvShows, showWatchPartners, watchPartners, showTags, tags } from '../../db/schema'
import { getAuthenticatedUserEmail } from '../../lib/auth'
import { useDb } from '../../lib/db'
import { getUserByEmail } from '../../lib/getUserByEmail'

export default defineEventHandler(async (event: H3Event) => {
  const maxVariablesPerQuery = 49 // D1 max is 100. We divide by 2 as the insert statement uses 2 params in the query
  const DB = await useDb()

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

  const hasEpisode = body.episode !== undefined
  const hasWatchPartnerIds = body.watchPartnerIds !== undefined
  const hasRewatch = body.rewatch !== undefined

  if (!hasEpisode && !hasWatchPartnerIds && !hasRewatch) {
    throw createError({ statusMessage: 'You must pass at least one supported field (episode, watchPartnerIds or rewatch)', statusCode: 400 })
  }

  if (hasRewatch && typeof body.rewatch !== 'boolean') {
    throw createError({ statusMessage: 'rewatch must be a boolean', statusCode: 400 })
  }

  if (hasWatchPartnerIds && !Array.isArray(body.watchPartnerIds)) {
    throw createError({ statusMessage: 'watchPartnerIds must be an array', statusCode: 400 })
  }

  if (Array.isArray(body.watchPartnerIds) && !body.watchPartnerIds.every((id: unknown) => Number.isInteger(id))) {
    throw createError({ statusMessage: 'watchPartnerIds must contain only integer ids', statusCode: 400 })
  }


  const showRecord = (Array.isArray(body.watchPartnerIds) || hasRewatch)
    ? await DB.select({ id: tvShows.id })
      .from(tvShows)
      .leftJoin(users, eq(users.id, tvShows.userId))
      .where(and(eq(tvShows.showId, showId), eq(users.email, userEmail)))
      .limit(1)
    : []

  let validWatchPartnerIds: number[] = []
  let rewatchTagId = 0

  if (hasRewatch) {
    const rewatchTag = await DB.select({ id: tags.id })
      .from(tags)
      .where(eq(tags.slug, 'rewatch'))
      .limit(1)

    if (!rewatchTag[0]) {
      throw createError({ statusMessage: 'Rewatch tag does not exist', statusCode: 500 })
    }

    rewatchTagId = rewatchTag[0].id
  }

  if (Array.isArray(body.watchPartnerIds) && body.watchPartnerIds.length > 0) {
    // Validate that all provided IDs actually belong to the authenticated user
    const ownedPartners = await DB.select({ id: watchPartners.id })
      .from(watchPartners)
      .where(and(
        eq(watchPartners.userId, user.id),
        inArray(watchPartners.id, body.watchPartnerIds)
      ))
    validWatchPartnerIds = ownedPartners.map(p => p.id)
  }

  // Set up batch requests after validation so partner and episode mutations commit together.
  const dbRequestBatch: BatchItem<'sqlite'>[] = []

  if (showRecord[0]) {
    const showDbId = showRecord[0].id

    if (hasRewatch) {
      if (body.rewatch) {
        dbRequestBatch.push(
          DB.insert(showTags)
            .values({ showId: showDbId, tagId: rewatchTagId })
            .onConflictDoNothing()
        )
      } else {
        dbRequestBatch.push(
          DB.delete(showTags).where(
            and(
              eq(showTags.showId, showDbId),
              eq(showTags.tagId, rewatchTagId)
            )
          )
        )
      }
    }

    if (Array.isArray(body.watchPartnerIds)) {
      dbRequestBatch.push(
        DB.delete(showWatchPartners).where(eq(showWatchPartners.showId, showDbId))
      )
    }

    if (Array.isArray(body.watchPartnerIds) && validWatchPartnerIds.length > 0) {
      dbRequestBatch.push(
        DB.insert(showWatchPartners).values(validWatchPartnerIds.map((watchPartnerId: number) => ({
          showId: showDbId,
          watchPartnerId
        })))
      )
    }
  }

  if (!hasEpisode) {
    if (dbRequestBatch.length > 0) {
      await DB.batch(dbRequestBatch as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]])
    }

    return {
      success: true,
      watchedEpisodeIds: []
    }
  }

  // Find the episode in the database that has been passed in the payload
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

  // Find all episodes for show
  const watched = DB.selectDistinct({
    episodeId: watchedEpisodes.episodeId,
    id: watchedEpisodes.id
  })
    .from(watchedEpisodes)
    .leftJoin(users,
      eq(users.id, watchedEpisodes.userId)
    )
    .where(
      eq(users.email, userEmail)
    )
    .as('watched')

  const episodesFromDb = await DB.select({
    id: episodes.id,
    episode: episodes.episode,
    season: episodes.season,
    watchedEpisodeId: sql<number>`watched.id as watchedId`
  })
    .from(episodes)
    .where(
      eq(episodes.episodateTvShowId, showId)
    )
    .leftJoin(
      watched,
      eq(episodes.id, watched.episodeId)
    )

  // Create an array of episodes that have been watched previously
  const watchedEpisodesInDb = episodesFromDb.filter(item => item.watchedEpisodeId)

  // Create an updated array of episodes that have been watched
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

  // Find the watched episodes that have been removed
  const watchedEpisodesToPushIds = new Set(watchedEpisodesToPush.map(ep => ep.id))
  const notWatchedEpisodes = watchedEpisodesInDb.filter(item => !watchedEpisodesToPushIds.has(item.id))
  const notWatchedEpisodesIds = notWatchedEpisodes.map(episode => episode.watchedEpisodeId)

  // Clear current watched episodes that are not in the watchedEpisodesToPush
  if (notWatchedEpisodes.length > 0) {
    const deleteChunks = []
    for (let i = 0; i < notWatchedEpisodesIds.length; i += maxVariablesPerQuery) {
      deleteChunks.push(notWatchedEpisodesIds.slice(i, i + maxVariablesPerQuery))
    }
    for (const chunk of deleteChunks) {
      dbRequestBatch.push(
        DB.delete(watchedEpisodes)
          .where(
            inArray(watchedEpisodes.id, chunk)
          )
      )
    }
  }

  // Find new watched episodes
  const watchedEpisodesInDbIds = new Set(watchedEpisodesInDb.map(ep => ep.id))
  const newWatchedEpisodes = watchedEpisodesToPush.filter(item => !watchedEpisodesInDbIds.has(item.id))

  // Add new watched episodes
  if (newWatchedEpisodes.length > 0) {
    const insertChunks = []
    for (let i = 0; i < newWatchedEpisodes.length; i += maxVariablesPerQuery) {
      insertChunks.push(newWatchedEpisodes.slice(i, i + maxVariablesPerQuery))
    }
    for (const chunk of insertChunks) {
      dbRequestBatch.push(
        DB.insert(watchedEpisodes)
          .values(
            chunk.map((episode) => {
              return {
                userId: user.id,
                episodeId: episode.id
              }
            })
          )
      )
    }
  }

  if (dbRequestBatch.length > 0) {
    await DB.batch(dbRequestBatch as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]])
  }

  return {
    success: true,
    watchedEpisodeIds: watchedEpisodesToPush.map(episode => episode.id)
  }
})
