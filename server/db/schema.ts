import { sql } from 'drizzle-orm'
import { sqliteTable, integer, uniqueIndex, text, primaryKey } from 'drizzle-orm/sqlite-core'
import type { AdapterAccount } from '@auth/core/adapters'

export const tvShows = sqliteTable('tv_shows', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  showId: integer('showId').notNull().references(() => episodateTvShows.id),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' })
}, (table) => {
  return {
    emailIdx: uniqueIndex('showUserIdx').on(table.showId, table.userId)
  }
})

export const episodateTvShows = sqliteTable('episodateTvShows', {
  id: integer('id').notNull().primaryKey(),
  name: text('name'),
  permalink: text('permalink'),
  url: text('url'),
  description: text('description'),
  // eslint-disable-next-line camelcase
  description_source: text('description_source'),
  // eslint-disable-next-line camelcase
  start_date: text('start_date'),
  // eslint-disable-next-line camelcase
  end_date: text('end_date'),
  country: text('country'),
  status: text('status'),
  runtime: integer('runtime'),
  network: text('network'),
  // eslint-disable-next-line camelcase
  youtube_link: text('youtube_link'),
  // eslint-disable-next-line camelcase
  image_path: text('image_path'),
  // eslint-disable-next-line camelcase
  image_thumbnail_path: text('image_thumbnail_path'),
  rating: text('rating'),
  // eslint-disable-next-line camelcase
  rating_count: text('rating_count'),
  genres: text('genres'),
  pictures: text('pictures'),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`).notNull()
})

export const episodes = sqliteTable('episodes', {
  id: integer('id').notNull().primaryKey({ autoIncrement: true }),
  season: integer('season').notNull(),
  episode: integer('episode').notNull(),
  name: text('name').notNull(),
  // eslint-disable-next-line camelcase
  air_date: text('air_date').notNull(),
  calendarId: text('calendarId'),
  episodateTvShowId: integer('episodateTvShowId').notNull().references(() => episodateTvShows.id)
}, (table) => {
  return {
    showEpisodeIdx: uniqueIndex('showEpisodeIdx').on(table.episodateTvShowId, table.season, table.episode)
  }
})

export const watchedEpisodes = sqliteTable('watchedEpisodes', {
  id: integer('id').notNull().primaryKey({ autoIncrement: true }),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  episodeId: integer('episodeId').notNull().references(() => episodes.id, { onDelete: 'cascade' })
}, (table) => {
  return {
    userWatchedEpisodeIdx: uniqueIndex('userEpisodeIdx').on(table.userId, table.episodeId)
  }
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
  // eslint-disable-next-line camelcase
  refresh_token: text('refresh_token'),
  // eslint-disable-next-line camelcase
  access_token: text('access_token'),
  // eslint-disable-next-line camelcase
  expires_at: integer('expires_at'),
  // eslint-disable-next-line camelcase
  token_type: text('token_type'),
  scope: text('scope'),
  // eslint-disable-next-line camelcase
  id_token: text('id_token'),
  // eslint-disable-next-line camelcase
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
