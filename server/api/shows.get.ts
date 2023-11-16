import getShows from '../lib/getShowsWithEpisodate'

export default defineEventHandler(async (event) => {
  const shows = await getShows(event.context)

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
