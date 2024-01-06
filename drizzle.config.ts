// Migrations don't really work for production.
// The changes we're making are too complex for SQLite.
// It's too risky to change existing data.
// You can generate a new migration using `pnpm migrations:generate`.
// Write some new SQL to get the production database into the correct state.
// If there is an error, you can roll back via the dashboard.

import * as path from 'path'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle/migrations',
  driver: 'd1',
  dbCredentials: {
    wranglerConfigPath: path.resolve(__dirname, './wrangler.toml'),
    dbName: 'tv_shows'
  },
  strict: true
})
