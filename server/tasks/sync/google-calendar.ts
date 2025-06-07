/* eslint-disable no-console */
import { format } from 'date-fns'
import { callGoogleCalendarApi } from '../../lib/googleCalendar'
import { getShowsForUser } from '~~/server/lib/getShowsForUser'
import { executeInBatches } from '~~/server/lib/helpers'
import { useDb } from '~~/server/lib/db'
import { accounts, users } from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'

async function fetchExistingEvents (token: string, calendarId: string) {
  let pageToken = null
  const events = []

  console.time('Fetch existing events')
  do {
    let requestUrl = '/events?maxResults=100'
    if (pageToken) {
      requestUrl = `${requestUrl}&pageToken=${pageToken}`
    }
    const response: any = await callGoogleCalendarApi(token, requestUrl, 'GET', null, calendarId)
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
    const DB = await useDb()
    const googleAccounts = await DB.select({
      userId: accounts.userId,
      email: users.email,
      calendarId: accounts.calendarId,
      access_token: accounts.access_token,
      refresh_token: accounts.refresh_token,
      expires_at: accounts.expires_at
    })
      .from(accounts)
      .innerJoin(users, eq(accounts.userId, users.id))
      .where(eq(accounts.provider, 'google'))

    await Promise.all(googleAccounts.map(async (account) => {
      let token = account.access_token

      if (!token || (account.expires_at && account.expires_at * 1000 < Date.now())) {
        if (!account.refresh_token) {
          return
        }
        const params = new URLSearchParams({
          client_id: globalThis.__env__.NUXT_GOOGLE_CLIENT_ID,
          client_secret: globalThis.__env__.NUXT_GOOGLE_CLIENT_SECRET,
          refresh_token: account.refresh_token,
          grant_type: 'refresh_token'
        })
        const resp = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        })
        if (!resp.ok) {
          return
        }
        const data = await resp.json()
        token = data.access_token
        const expires = Math.floor(Date.now() / 1000) + data.expires_in
        await DB.update(accounts)
          .set({ access_token: token, expires_at: expires })
          .where(and(eq(accounts.userId, account.userId), eq(accounts.provider, 'google')))
      }
      let calendarId = account.calendarId
      if (!calendarId) {
        const calResp = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ summary: 'TV Shows' })
        })
        if (!calResp.ok) {
          return
        }
        const calData = await calResp.json()
        calendarId = calData.id
        await DB.update(accounts)
          .set({ calendarId })
          .where(and(eq(accounts.userId, account.userId), eq(accounts.provider, 'google')))
      }

        fetchExistingEvents(token, calendarId as string),
          }, calendarId as string)
      }

          callGoogleCalendarApi(token, `/events/${event.id}`, 'DELETE', null, calendarId as string)
    }));
        getShowsForUser(account.email)
      ])

      const existingEventMap = new Map(
        existingEvents.map((event: any) => [event.id, event])
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
          callGoogleCalendarApi(token, '/events', 'POST', {
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
          callGoogleCalendarApi(token, `/events/${event.id}`, 'DELETE')
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

    }
    console.log('Synchronization complete.')

    return { result: 'Success' }
  }
})
