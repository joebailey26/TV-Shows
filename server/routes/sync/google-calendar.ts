/* eslint-disable no-console */

export default eventHandler(async (event) => {
  const syncSecret = __env__.NUXT_SYNC_SECRET

  if (!syncSecret) {
    console.error('Manual Google Calendar sync failed: NUXT_SYNC_SECRET is not configured')
    throw createError({ statusMessage: 'Missing sync secret', statusCode: 500 })
  }

  const query = getQuery(event)
  const authorization = getHeader(event, 'authorization')
  const bearerToken = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null
  const querySecret = typeof query.secret === 'string' ? query.secret : null

  if (bearerToken !== syncSecret && querySecret !== syncSecret) {
    console.warn('Manual Google Calendar sync rejected: invalid sync secret')
    throw createError({ statusMessage: 'Unauthorized', statusCode: 401 })
  }

  console.log('Manual Google Calendar sync started')

  try {
    const result = await runTask('sync:google-calendar')

    console.log('Manual Google Calendar sync finished')

    return {
      result
    }
  } catch (error) {
    console.error('Manual Google Calendar sync failed:', error)
    throw error
  }
})
