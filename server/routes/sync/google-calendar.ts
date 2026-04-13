export default eventHandler(async (event) => {
  const syncSecret = __env__.NUXT_SYNC_SECRET

  if (!syncSecret) {
    throw createError({ statusMessage: 'Missing sync secret', statusCode: 500 })
  }

  const query = getQuery(event)
  const authorization = getHeader(event, 'authorization')
  const bearerToken = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null
  const querySecret = typeof query.secret === 'string' ? query.secret : null

  if (bearerToken !== syncSecret && querySecret !== syncSecret) {
    throw createError({ statusMessage: 'Unauthorized', statusCode: 401 })
  }

  const result = await runTask('sync:google-calendar')

  return {
    result
  }
})
