export { EpisodesTransformed, EpisodateShowTransformed }

declare global {
  interface EpisodateShowFromSearchTransformed extends EpisodateShowFromSearch {
    tracked: boolean
    episodesToWatch: number
  }
  interface CustomSearch extends EpisodateSearch {
    tv_shows: EpisodateShowFromSearchTransformed[]
  }
  interface EpisodesTransformed extends Episodes {
    watched: boolean
  }
  interface EpisodateShowTransformed extends EpisodateShow {
    tracked: boolean
    updatedAt: string
    countdown: EpisodesTransformed | null
    episodes: EpisodesTransformed[]
  }
}
