import type { H3Event } from 'h3'
import { getShows } from '../../lib/getShows'
import { ics } from '../../lib/ics'
import { getEpisodesForShow } from '~/server/lib/getEpisodesForShow'

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

  // Get all shows
  const shows = await getShows(event, userEmail, '', 0)

  // Fill shows with episodes
  const showsWithEpisodes = await Promise.all(shows.map(async (show) => {
    const episodes = await getEpisodesForShow(show.id, userEmail, event)
    return {
      ...show,
      episodes
    }
  }))

  // Loop through all shows and all episodes for show and create a calendar event for that episode
  showsWithEpisodes.forEach((show) => {
    show.episodes.forEach((episode) => {
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
          `${show.name} | ${episode.name}`,
          '',
          '',
          date.toString(),
          date.toString()
        )
      }
    })
  })

  // Send the correct content type header so the browser knows what to do with it.
  // This also lets Google Calendar sync from this endpoint
  setHeader(event, 'Content-Type', 'text/calendar')

  // Return the built calendar
  return cal.build()
})
