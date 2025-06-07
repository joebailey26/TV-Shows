import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1'
import type { Logger } from 'drizzle-orm/logger'

class MyLogger implements Logger {
  logQuery (query: string, params: unknown[]): void {
    if (process.env.NODE_ENV === 'development' && process.env.DB_LOGGING) {
      /* eslint-disable no-console */
      console.log({ query, params })
      console.log('\n')
      console.log('\n')
      /* eslint-enable no-console */
    }
  }
}

export function useDb (): DrizzleD1Database {
  return drizzle(globalThis.__env__.DB, { logger: new MyLogger() })
}
