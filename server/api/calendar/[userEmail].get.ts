import type { H3Event } from 'h3'
import { ics } from '../../lib/ics'
import { getShowsForUser } from '~~/server/lib/getShowsForUser'

// Return an ICS file containing events for all episodes of all shows stored in D1.
export default defineEventHandler(async (event: H3Event) => {
  const userEmail = getRouterParam(event, 'userEmail')

  if (!userEmail) {
    setResponseStatus(event, 400)
    return 'Missing user email'
  }

  const episodesFromDb = await getShowsForUser(userEmail)

  // Initialise a new calendar
  const cal = ics()

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

  // Return the built calendar
  return cal.build()
})
