import type { InferSelectModel } from 'drizzle-orm'
import { tvShows, episodateTvShows, users } from '../db/schema'

export { TvShows, EpisodateTvShows, Users }

declare global {
  type TvShows = typeof tvShows.$inferSelect
  type EpisodateTvShows = typeof episodateTvShows.$inferSelect
  type Users = typeof users.$inferSelect
}