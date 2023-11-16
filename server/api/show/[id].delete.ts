import type { D1Database } from "@cloudflare/workers-types"

export default defineEventHandler(async (event) => {
  const DB: D1Database = event.context.cloudflare.env.DB

  const showId = getRouterParam(event, 'id')

  // Check if the id already exists and return an error if so
  const { results } = await DB.prepare('SELECT id FROM tv_shows WHERE id = ? LIMIT 1')
    .bind(showId)
    .all()

  if (!results.length) {
    setResponseStatus(event, 404)
    return 'Show does not exist'
  }

  await DB.prepare('DELETE FROM tv_shows WHERE id = ?')
    .bind(showId)
    .run()

  setResponseStatus(event, 201)
  return 'Removed successfully'
})
