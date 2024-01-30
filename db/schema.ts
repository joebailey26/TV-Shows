import { Many, sql } from 'drizzle-orm'
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
}
)

export const episodateTvShows = sqliteTable('episodateTvShows', {
  id: integer('id').primaryKey(),
  name: text('name'),
  permalink: text('permalink'),
  url: text('url'),
  description: text('description'),
  description_source: text('description_source'),
  start_date: text('start_date'),
  end_date: text('end_date'),
  country: text('country'),
  status: text('status'),
  runtime: integer('runtime'),
  network: text('network'),
  youtube_link: text('youtube_link'),
  image_path: text('image_path'),
  image_thumbnail_path: text('image_thumbnail_path'),
  rating: text('rating'),
  rating_count: text('rating'),
  genres: text('genres', { mode: 'json' }),
  pictures: text('pictures', { mode: 'json' }),
  // countdown: integer('countdown').references(() => episodes.id),
  updatedAt: text('updatedAt').default(sql`CURRENT_TIMESTAMP`).notNull()
})

export const seasons = sqliteTable('seasons', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  season: integer('season').notNull(),
  episodateTvShowId: integer('episodateTvShowId').notNull().references(() => episodateTvShows.id)
})

export const episodes = sqliteTable('episodes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  seasonId: integer('seasonId').notNull().references(() => seasons.id, { onDelete: 'cascade' }),
  episode: integer('episode').notNull(),
  name: text('name').notNull(),
  air_date: text('air_date').notNull()
}, (table) => {
  return {
    episodeSeasonIdx: uniqueIndex('episodeSeasonIdx').on(table.seasonId, table.episode)
  }
})

export const watchedEpisodes = sqliteTable('watchedEpisodes', {
  userId: integer('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  episodeId: integer('episodeId').notNull().references(() => episodes.id, { onDelete: 'cascade' })
}, (table) => {
  return {
    userEpisodeIdx: uniqueIndex('userEpisodeIdx').on(table.userId, table.episodeId)
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
