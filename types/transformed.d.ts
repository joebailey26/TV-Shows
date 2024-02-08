export { EpisodesTransformed, EpisodateShowTransformed }

declare global {
  interface EpisodesTransformed extends Episodes {
    watched: boolean;
  }
  interface EpisodateShowTransformed extends EpisodateShow {
    countdown: Episodes
    tracked: boolean
    episodes: EpisodesTransformed[]
  }
}