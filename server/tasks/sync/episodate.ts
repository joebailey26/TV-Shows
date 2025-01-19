import { tvShows } from '../../db/schema'
import { useDb } from '../../lib/db'
import { syncShow } from '../../lib/syncShow'
import { executeInBatches } from '~~/server/lib/helpers'

export default defineTask({
  meta: {
    name: 'sync:episodate',
    description: 'Sync shows from Episodate to D1'
  },
  async run () {
    const DB = await useDb()

    const results = await DB.select({ showId: tvShows.showId }).from(tvShows)

    const syncPromises = results.map(show => () => syncShow(show.showId, true))

    await executeInBatches(syncPromises, 10, 2000)

    return { result: 'Success' }
  }
})
