export default function transformShowFromDb (showFromDb: EpisodateTvShows): Partial<EpisodateShow> {
  return {
    ...showFromDb,
    genres: showFromDb?.genres?.split(','),
    pictures: showFromDb?.pictures?.split(',')
  }
}
