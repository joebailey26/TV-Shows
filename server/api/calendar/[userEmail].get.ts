import type { H3Event } from 'h3'
import { eq, and, sql } from 'drizzle-orm'
import { subYears } from 'date-fns'
import { ics } from '../../lib/ics'
import { episodateTvShows, episodes, tvShows, users, watchedEpisodes } from '../../db/schema'
import { useDb } from '../../lib/db'
import { syncShow } from '../../lib/syncShow'

// Return an ICS file containing events for all episodes of all shows stored in D1.
export default defineEventHandler(async (event: H3Event) => {
  const userEmail = getRouterParam(event, 'userEmail')

  if (!userEmail) {
    setResponseStatus(event, 400)
    return 'Missing user email'
  }

  // Initialise a new calendar
  // @ts-expect-error
  const cal = ics()

  const DB = await useDb(event)

  // Compute the cutoff date for episodes (one year ago from now)
  const oneYearAgo = subYears(new Date(), 1)

  // Get all shows
  const episodesFromDb = await DB.selectDistinct({
    name: episodes.name,
    air_date: episodes.air_date,
    showName: sql<string>`${episodateTvShows.name} as showName`,
    showId: episodateTvShows.id
  })
    .from(episodes)
    .leftJoin(
      episodateTvShows,
      eq(episodateTvShows.id, episodes.episodateTvShowId)
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
        eq(users.email, userEmail),
        sql`episodes.air_date >= ${oneYearAgo}`,
        sql`NOT EXISTS (
          SELECT 1 FROM ${watchedEpisodes} AS we
          JOIN ${users} AS u ON u.id = we.userId
          WHERE we.episodeId = ${episodes}.id AND u.email = ${userEmail}
        )`
      )
    )

  // Loop through all shows and all episodes for show and create a calendar event for that episode
  episodesFromDb.forEach((episode) => {
  // Only process the episode if it has an air_date
    if (episode.air_date) {
    // Build the date for the episode
      let date = new Date(episode.air_date)
      // Set the date to plus one to allow for time to be added to streaming platforms etc.
      date.setDate(date.getDate() + 1)
      // Strip the time from the date as we don't need it
      date = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      // Add the event to the calendar
      cal.addEvent(
        `${episode.showName} | ${episode.name}`,
        '',
        '',
        date.toString(),
        date.toString()
      )
    }
  })

  // Send the correct content type header so the browser knows what to do with it.
  // This also lets Google Calendar sync from this endpoint
  setHeader(event, 'Content-Type', 'text/calendar')

  // ToDo
  //  This should really be on a cron, but we do this instead each time this endpoint is hit
  event.waitUntil(Promise.all(episodesFromDb.map(show => show.showId ? syncShow(show.showId, event) : null)))

  // Return the built calendar
  return cal.build()
})
