/* eslint-disable no-console */
import { format } from 'date-fns'
import { callGoogleCalendarApi, getAuthToken } from '../../lib/googleCalendar'
import { getShowsForUser } from '~~/server/lib/getShowsForUser'
import { executeInBatches } from '~~/server/lib/helpers'

async function fetchExistingEvents (token: string) {
  let pageToken = null
  const events = []

  console.time('Fetch existing events')
  do {
    let requestUrl = '/events?maxResults=100'
    if (pageToken) {
      requestUrl = `${requestUrl}&pageToken=${pageToken}`
    }
    const response = await callGoogleCalendarApi(token, requestUrl, 'GET')
    events.push(...(response.items || []))
    pageToken = response.nextPageToken
  } while (pageToken)
  console.timeEnd('Fetch existing events')

  return events
}

// ToDo
//  Abstract this out to allow any account to sync their shows with Google, not just based off these environment variables
export default defineTask({
  meta: {
    name: 'sync:google-calendar',
    description: 'Sync my calendar'
  },
  async run () {
    const googleCalendarToken = await getAuthToken()

    const [existingEvents, episodes] = await Promise.all([
      fetchExistingEvents(googleCalendarToken),
      // ToDo
      //  Don't hardcode this
      getShowsForUser('billybidley26@gmail.com')
    ])

    const existingEventMap = new Map(
      existingEvents.map(event => [event.id, event])
    )

    // Prepare operations
    const insertPromises = []
    const deletePromises = []

    console.time('Prepare episodes array')
    const preparedEpisodes = episodes
      .filter(episode => episode.air_date)
      .map((episode) => {
        // Build the date for the episode
        const date = new Date(episode.air_date)
        // Set the date to plus one to allow for time to be added to streaming platforms etc.
        date.setDate(date.getDate() + 1)

        return {
          title: `${episode.showName} | ${episode.name}`,
          date: format(new Date(date.getFullYear(), date.getMonth(), date.getDate()), 'yyyy-MM-dd')
        }
      })
    console.timeEnd('Prepare episodes array')

    console.time('Prepare insert and delete operations')
    for (const episode of preparedEpisodes) {
      // Check if the event already exists
      const existingEvent = Array.from(existingEventMap.values()).find(
        e =>
          e.summary === episode.title &&
          e.start.date === episode.date &&
          e.end.date === episode.date
      )

      if (!existingEvent) {
        // Event does not exist, add it
        insertPromises.push(() =>
          callGoogleCalendarApi(googleCalendarToken, '/events', 'POST', {
            summary: episode.title,
            start: { date: episode.date },
            end: { date: episode.date }
          })
        )
      }
    }

    // Determine events to delete (existing but not in `.ics`)
    for (const event of existingEvents) {
      const isStillInICS = preparedEpisodes.some(
        episode =>
          event.summary === episode.title &&
          event.start.date === episode.date &&
          event.end.date === episode.date
      )

      if (!isStillInICS) {
        deletePromises.push(() =>
          callGoogleCalendarApi(googleCalendarToken, `/events/${event.id}`, 'DELETE')
        )
      }
    }
    console.timeEnd('Prepare insert and delete operations')

    // Execute deletions in batches
    console.time('Delete events')
    await executeInBatches(deletePromises, 10, 2000)
    console.timeEnd('Delete events')

    // Execute insertions in batches
    console.time('Insert events')
    await executeInBatches(insertPromises, 10, 2000)
    console.timeEnd('Insert events')

    console.log('Synchronization complete.')

    return { result: 'Success' }
  }
})
