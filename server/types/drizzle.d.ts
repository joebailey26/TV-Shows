import type { InferSelectModel } from 'drizzle-orm'
import type { tvShows, episodateTvShows, users, episodes } from '../server/db/schema'

declare global {
  type TvShows = InferSelectModel<typeof tvShows>
  type EpisodateTvShows = InferSelectModel<typeof episodateTvShows>
  type Users = InferSelectModel<typeof users>
  type Episodes = InferSelectModel<typeof episodes>
}
