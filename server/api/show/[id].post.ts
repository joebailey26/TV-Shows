export default defineEventHandler(async (event) => {
  const DB: D1Database = event.context.cloudflare.env.DB

  const showId = getRouterParam(event, 'id')

  // Check if the id already exists and return an error if so
  const { results } = await DB.prepare('SELECT id FROM tv_shows WHERE id = ? LIMIT 1')
    .bind(showId)
    .all()

  if (results.length) {
    setResponseStatus(event, 409)
    return 'Show already exists'
  }

  await DB.prepare('INSERT INTO tv_shows (id) VALUES (?)')
    .bind(showId)
    .run()

  setResponseStatus(event, 201)
  return 'Added successfully'
})
