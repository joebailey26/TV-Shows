import { sqliteTable, integer, uniqueIndex, text } from 'drizzle-orm/sqlite-core'

export const tvShows = sqliteTable('tv_shows', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  showId: integer('show_id').notNull(),
  userEmail: text('user_email').notNull().default('joe@joebailey.xyz'),
  latestWatchedEpisodeId: integer('latest_watched_episode_id')
}, (table) => {
  return {
    emailIdx: uniqueIndex('show_user_idx').on(table.showId, table.userEmail)
  }
})
