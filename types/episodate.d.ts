/* eslint-disable camelcase */
/* DO NOT EDIT THESE */
/* These are the types of the data coming from the EpisoDate API */

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
    name: string | null;
    permalink: string | null;
    url: string | null;
    description: string | null;
    description_source: string | null;
    start_date: string | null;
    end_date: string | null;
    country: string | null;
    status: string | null;
    runtime: number | null;
    network: string | null;
    youtube_link: string | null;
    image_path: string | null;
    image_thumbnail_path: string | null;
    rating: string | null;
    rating_count: string | null;
    countdown: EpisodateShowEpisode | null;
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
