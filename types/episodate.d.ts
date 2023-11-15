/* eslint-disable camelcase */
export { EpisodeShowCountdown, EpisodateShowEpisode, EpisodateShow }
declare global {
  interface EpisodateShowCountdown {
    season: number;
    episode: number;
    name: string;
    air_date: Date;
  }

  interface EpisodateShowEpisode {
    season: number;
    episode: number;
    name: string;
    air_date: string;
  }

  interface EpisodateShow {
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
    countdown: Countdown;
    genres: string[];
    pictures: string[];
    episodes: Episode[];
  }
}
