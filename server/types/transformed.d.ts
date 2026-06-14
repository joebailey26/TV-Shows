export {}

declare global {
  interface ShowTag {
    id: number
    slug: string
    name: string
  }

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
  interface WatchPartner {
    id: number
    name: string
  }

  interface EpisodateShowTransformed extends EpisodateShow {
    tracked: boolean
    updatedAt: string
    countdown: EpisodesTransformed | null
    episodes: EpisodesTransformed[]
    watchingWith: WatchPartner[]
    tags: ShowTag[]
    rewatch: boolean
  }
}
