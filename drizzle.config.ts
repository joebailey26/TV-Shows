import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  driver: 'd1-http',
  schema: './server/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    accountId: '',
    databaseId: '',
    token: ''
  },
  migrations: {
    table: 'migrations'
  }
})
