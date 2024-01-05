import { sql } from 'drizzle-orm'
import { sqliteTable, integer, uniqueIndex, text, primaryKey } from 'drizzle-orm/sqlite-core'
import type { AdapterAccount } from '@auth/core/adapters'
import type { EpisodateShow } from '../types/episodate'

export const tvShows = sqliteTable('tv_shows', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  showId: integer('showId').notNull().references(() => episodateTvShows.id),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  latestWatchedEpisodeId: integer('latestWatchedEpisodeId')
}, (table) => {
  return {
    emailIdx: uniqueIndex('showUserIdx').on(table.showId, table.userId)
  }
}
)

export const episodateTvShows = sqliteTable('episodateTvShows', {
  // ToDo
  //  ID and Name are stored here in columns as well as in episodateData
  //  Can we de-duplicate somehow?
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  episodateData: text('episodateData', { mode: 'json' }).$type<EpisodateShow>().notNull(),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`).notNull()
})

export const users = sqliteTable('user', {
  id: text('id').notNull().primaryKey(),
  name: text('name'),
  email: text('email').notNull(),
  emailVerified: integer('emailVerified', { mode: 'timestamp_ms' }),
  image: text('image')
})

export const accounts = sqliteTable('account', {
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').$type<AdapterAccount['type']>().notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state')
},
account => ({
  compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] })
})
)

export const sessions = sqliteTable('session', {
  sessionToken: text('sessionToken').notNull().primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp_ms' }).notNull()
})

export const verificationTokens = sqliteTable('verificationToken', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: integer('expires', { mode: 'timestamp_ms' }).notNull()
},
vt => ({
  compoundKey: primaryKey({ columns: [vt.identifier, vt.token] })
})
)
