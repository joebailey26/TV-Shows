import { sql, lte } from 'drizzle-orm'
import { format, subHours } from 'date-fns'
import { episodateTvShows } from '../../db/schema'
import { useDb } from '../../lib/db'
import { syncShow } from '../../lib/syncShow'
import { executeInBatches } from '~~/server/lib/helpers'

/**
 * Cloudflare Workers Free has a limit of 50 subrequests per instantiation
 * So we only sync 10 shows per task run
 * Shows have a TTL of 8 hours
 */
export default defineTask({
  meta: {
    name: 'sync:episodate',
    description: 'Sync shows from Episodate to D1'
  },
  async run () {
    const DB = await useDb()

    const stmt = DB.select({ id: episodateTvShows.id })
      .from(episodateTvShows)
      .where(
        lte(
          episodateTvShows.updatedAt,
          sql`${format(subHours(new Date(), 8), 'yyyy-MM-dd HH:mm:ss')}`
        )
      )
      .limit(10)
      .prepare('staleShows')

    const results = await stmt.all()

    const syncPromises = results.map(show => () => syncShow(show.id))

    await executeInBatches(syncPromises, 10, 2000)

    return { result: 'Success' }
  }
})
