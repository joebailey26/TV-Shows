// Migrations don't really work for production.
// The changes we're making are too complex for SQLite.
// It's too risky to change existing data.
// You can generate a new migration using `npx drizzle-kit generate:sqlite`.
// Use this to update `db/fixtures.sql`.
// The local database is automatically reset each time the dev environment starts up.
// Write some new SQL to get the production database into the correct state.
// You can use `wrangler d1 execute tv_shows --file=db/production.sql` to update the production database.
// If there is an error, you can roll back via the dashboard.

import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  driver: 'd1',
  dbCredentials: {
    wranglerConfigPath: 'wrangler.toml',
    dbName: 'tv_shows'
  },
  strict: true
})
