/* eslint-disable camelcase */
export { EpisodateShowEpisode, EpisodateShow, EpisodateShowDetails, EpisodateSearch }

declare global {
  type EpisodateShowEpisode = {
    season: number;
    episode: number;
    name: string;
    air_date: string;
  }
  type EpisodateShow = {
    id: number;
    name: string;
    permalink: string;
    url: string;
    description: string;
    description_source: string | null;
    start_date: string;
    end_date: string | null;
    country: string;
    status: string;
    runtime: number;
    network: string;
    youtube_link: string | null;
    image_path: string;
    image_thumbnail_path: string;
    rating: string;
    rating_count: string;
    countdown: EpisodateShowEpisode;
    genres: string[];
    pictures: string[];
    episodes: EpisodateShowEpisode[];
  }
  type EpisodateShowDetails = {
    tvShow: EpisodateShow
  }
  type EpisodateSearch = {
    total: string;
    page: number;
    pages: number;
    tv_shows: EpisodateShow[]
  }
}
