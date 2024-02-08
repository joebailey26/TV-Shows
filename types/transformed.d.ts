export { EpisodesTransformed, EpisodateShowTransformed }

declare global {
  interface EpisodesTransformed extends Episodes {
    watched: boolean
  }
  interface TrackedShow extends EpisodateShow {
    tracked: boolean
  }
  interface EpisodateShowTransformed extends TrackedShow {
    countdown: Episodes
    episodes: EpisodesTransformed[]
  }
  interface CustomSearch extends EpisodateSearch {
    tv_shows: TrackedShow[]
  }
}