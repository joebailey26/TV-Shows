export function transformShowFromDb (showFromDb: EpisodateTvShows): EpisodateShowTransformed {
  return {
    ...showFromDb,
    tracked: true,
    genres: showFromDb?.genres ? showFromDb.genres.split(',') : [],
    pictures: showFromDb?.pictures ? showFromDb.pictures.split(',') : [],
    episodes: []
  }
}
