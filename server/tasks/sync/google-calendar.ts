/* eslint-disable no-console */
import { format } from 'date-fns'
import { callGoogleCalendarApi } from '../../lib/googleCalendar'
import { getShowsForUser } from '~~/server/lib/getShowsForUser'
import { executeInBatches } from '~~/server/lib/helpers'
import { useDb } from '~~/server/lib/db'
import { accounts, users } from '~~/server/db/schema'
import { and, eq } from 'drizzle-orm'

async function fetchExistingEvents(token: string, calendarId: string) {
  let pageToken = null
  const events = []

  console.time('Fetch existing events')
  do {
    let requestUrl = '/events?maxResults=100'
    if (pageToken) {
      requestUrl += `&pageToken=${pageToken}`
    }
    const response: any = await callGoogleCalendarApi(token, requestUrl, 'GET', null, calendarId)
    console.log(`Fetched ${response.items?.length || 0} events from page`)
    events.push(...(response.items || []))
    pageToken = response.nextPageToken
  } while (pageToken)
  console.timeEnd('Fetch existing events')

  return events
}

export default defineTask({
  meta: {
    name: 'sync:google-calendar',
    description: 'Sync all user calendars'
  },
  async run () {
    const clientId = __env__.NUXT_GOOGLE_CLIENT_ID
    const clientSecret = __env__.NUXT_GOOGLE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error('Missing Google OAuth client ID or client secret')
    }

    const DB = await useDb()
    const googleAccounts = await DB.select({
      userId: accounts.userId,
      email: users.email,
      calendarId: accounts.calendarId,
      // eslint-disable-next-line camelcase
      access_token: accounts.access_token,
      // eslint-disable-next-line camelcase
      refresh_token: accounts.refresh_token,
      // eslint-disable-next-line camelcase
      expires_at: accounts.expires_at
    })
      .from(accounts)
      .innerJoin(users, eq(accounts.userId, users.id))
      .where(eq(accounts.provider, 'google'))

    console.log(`Found ${googleAccounts.length} Google account(s)`)

    await Promise.all(googleAccounts.map(async (account, i) => {
      console.log(`\n--- Processing account #${i + 1}: ${account.email} ---`)
      let token = account.access_token

      if (!token || (account.expires_at && account.expires_at * 1000 < Date.now())) {
        if (!account.refresh_token) {
          console.warn('Missing refresh token. Skipping user.')
          return
        }

        console.log('Refreshing access token...')
        const params = new URLSearchParams({
          // eslint-disable-next-line camelcase
          client_id: clientId,
          // eslint-disable-next-line camelcase
          client_secret: clientSecret,
          // eslint-disable-next-line camelcase
          refresh_token: account.refresh_token,
          // eslint-disable-next-line camelcase
          grant_type: 'refresh_token'
        })

        const resp = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        })

        if (!resp.ok) {
          console.error('Failed to refresh token:', await resp.text())
          return
        }

        const data = await resp.json()
        token = data.access_token
        const expires = Math.floor(Date.now() / 1000) + data.expires_in

        console.log('Token refreshed successfully.')

        await DB.update(accounts)
          // eslint-disable-next-line camelcase
          .set({ access_token: token, expires_at: expires })
          .where(and(eq(accounts.userId, account.userId), eq(accounts.provider, 'google')))
      }

      if (!token) {
        console.error('Could not log in to Google')
        return
      }

      let calendarId = account.calendarId
      if (!calendarId) {
        console.log('Creating new calendar...')
        const calResp = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ summary: 'TV Shows' })
        })

        if (!calResp.ok) {
          console.error('Failed to create calendar:', calResp.status)
          console.error(await calResp.text())
          return
        }

        const calData = await calResp.json()
        calendarId = calData.id
        console.log('Calendar created with ID:', calendarId)

        await DB.update(accounts)
          .set({ calendarId })
          .where(and(eq(accounts.userId, account.userId), eq(accounts.provider, 'google')))
      }

      if (!calendarId) {
        console.error('Could not find or create calendar')
        return
      }

      console.log('Using calendarId:', calendarId)

      const [existingEvents, episodes] = await Promise.all([
        fetchExistingEvents(token, calendarId),
        getShowsForUser(account.email)
      ])

      console.log(`Fetched ${existingEvents.length} existing events`)
      console.log(`Fetched ${episodes.length} episodes for user`)

      const existingEventMap = new Map(
        existingEvents.map((event: any) => [event.id, event])
      )

      const insertPromises = []
      const deletePromises = []

      console.time('Prepare episodes array')
      const preparedEpisodes = episodes
        .filter(episode => episode.air_date)
        .map((episode) => {
          const date = new Date(episode.air_date)
          date.setDate(date.getDate() + 1)

          return {
            title: `${episode.showName} | ${episode.name}`,
            date: format(new Date(date.getFullYear(), date.getMonth(), date.getDate()), 'yyyy-MM-dd')
          }
        })
      console.timeEnd('Prepare episodes array')

      console.log(`Prepared ${preparedEpisodes.length} episodes`)

      console.time('Prepare insert and delete operations')
      for (const episode of preparedEpisodes) {
        const existingEvent = Array.from(existingEventMap.values()).find(
          e =>
            e.summary === episode.title &&
            e.start.date === episode.date &&
            e.end.date === episode.date
        )

        if (!existingEvent) {
          insertPromises.push(() =>
            callGoogleCalendarApi(token, '/events', 'POST', {
              summary: episode.title,
              start: { date: episode.date },
              end: { date: episode.date }
            }, calendarId)
          )
        }
      }

      for (const event of existingEvents) {
        const isStillInICS = preparedEpisodes.some(
          episode =>
            event.summary === episode.title &&
            event.start.date === episode.date &&
            event.end.date === episode.date
        )

        if (!isStillInICS) {
          deletePromises.push(() =>
            callGoogleCalendarApi(token, `/events/${event.id}`, 'DELETE', null, calendarId)
          )
        }
      }
      console.timeEnd('Prepare insert and delete operations')

      console.log(`Will insert ${insertPromises.length} events`)
      console.log(`Will delete ${deletePromises.length} events`)

      console.time('Delete events')
      await executeInBatches(deletePromises, 10, 2000)
      console.timeEnd('Delete events')

      console.time('Insert events')
      await executeInBatches(insertPromises, 10, 2000)
      console.timeEnd('Insert events')

      console.log(`Finished processing ${account.email}`)
    }))

    console.log('\nSynchronization complete.')
    return { result: 'Success' }
  }
})
