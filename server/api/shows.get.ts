import getShows from '../lib/getShows'

export default defineEventHandler(async ({context}) => {
  if (!context.cloudflare) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Cloudflare not available in this environment.',
    })
  }

  const shows = await getShows(context)

  // Return the shows sorted alphabetically
  shows.sort((a, b) => {
    const nameA = a.name.toUpperCase() // to ensure case-insensitive comparison
    const nameB = b.name.toUpperCase() // to ensure case-insensitive comparison

    if (nameA < nameB) {
      return -1
    }
    if (nameA > nameB) {
      return 1
    }

    // names must be equal
    return 0
  })

  return shows
})
