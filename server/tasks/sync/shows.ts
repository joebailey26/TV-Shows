/* eslint-disable camelcase, no-console */

import { google } from 'googleapis'
import type { calendar_v3 } from 'googleapis'
import ical from 'ical'
import { parse, format } from 'date-fns'

interface IcsEvent {
  type: string
  params: []
  uid: string
  class: string
  description: string
  dtstamp: Date
  start: string
  end: string
  location: string
  summary: {
    params: {
      LANGUAGE: string
    }
    val: string
  }
  transparency: string
}

function formatDate (input: string) {
  const parsedDate = parse(input, 'yyyyMMdd', new Date())
  return format(parsedDate, 'yyyy-MM-dd')
}

function delay (ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function executeInBatches (promises: Promise<any>[], batchSize: number, delayMs: number) {
  for (let i = 0; i < promises.length; i += batchSize) {
    const batch = promises.slice(i, i + batchSize).map(fn => fn())
    await Promise.all(batch) // Execute batch
    if (i + batchSize < promises.length) {
      await delay(delayMs) // Delay before next batch
    }
  }
}

async function fetchExistingEvents (calendar: calendar_v3.Calendar, calendarId: string) {
  let pageToken = null
  const events = []

  console.time('Fetch existing events')
  do {
    const response = await calendar.events.list({
      calendarId,
      pageToken,
      maxResults: 100
    })

    events.push(...(response.data.items || []))
    pageToken = response.data.nextPageToken
  } while (pageToken)
  console.timeEnd('Fetch existing events')

  return events
}

/**
 * @todo Fetch from the database rather than doing a whole HTTP request
 */
async function fetchAndParseIcs (url: string) {
  console.time('Fetch and parse .ics')
  const eventCalendar = await fetch(url).then(res => res.text())
  const events = ical.parseICS(eventCalendar) as IcsEvent[]
  console.timeEnd('Fetch and parse .ics')
  return events
}

export default defineTask({
  meta: {
    name: 'sync:shows',
    description: 'Sync my calendar'
  },
  async run () {
    // Load service account credentials
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS)

    // Authenticate
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar']
    })

    // Set up calendar
    const calendar = google.calendar({ version: 'v3', auth })

    console.log('Starting concurrent fetch of events...')
    const [existingEvents, events] = await Promise.all([
      fetchExistingEvents(calendar, process.env.CALENDAR_ID),
      fetchAndParseIcs(process.env.CALENDAR_URL)
    ])

    const existingEventMap = new Map(
      existingEvents.map(event => [event.id, event])
    )

    // Prepare operations
    const insertPromises = []
    const deletePromises = []

    console.time('Prepare insert and delete operations')
    for (const [_, ev] of Object.entries(events)) {
      if (ev.type !== 'VEVENT') {
        continue
      }

      const formattedStart = formatDate(ev.start)
      const formattedEnd = formatDate(ev.end)

      // Check if the event already exists
      const existingEvent = Array.from(existingEventMap.values()).find(
        e =>
          e.summary === ev.summary.val &&
          e.start.date === formattedStart &&
          e.end.date === formattedEnd
      )

      if (!existingEvent) {
        // Event does not exist, add it
        insertPromises.push(() =>
          calendar.events.insert({
            calendarId: process.env.CALENDAR_ID,
            requestBody: {
              summary: ev.summary.val,
              start: { date: formattedStart },
              end: { date: formattedEnd }
            }
          })
        )
      }
    }

    // Determine events to delete (existing but not in `.ics`)
    for (const event of existingEvents) {
      const isStillInICS = Object.entries(events).some(
        ([_, ev]) =>
          ev.type === 'VEVENT' &&
          event.summary === ev.summary.val &&
          event.start.date === formatDate(ev.start) &&
          event.end.date === formatDate(ev.end)
      )

      if (!isStillInICS) {
        deletePromises.push(() =>
          // eslint-disable-next-line drizzle/enforce-delete-with-where
          calendar.events.delete({
            calendarId: process.env.CALENDAR_ID,
            eventId: event.id
          })
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
