import { sqliteTable, integer, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const tvShows = sqliteTable('tv_shows', {
  id: integer('id').notNull(),
  userId: integer('user_id').notNull().default(1)
}, (table) => {
  return {
    emailIdx: uniqueIndex('id_user_idx').on(table.id, table.userId)
  }
})
