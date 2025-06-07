import type { H3Event } from 'h3'
import { eq } from 'drizzle-orm'
import { users } from '../db/schema'
import { useDb } from '../lib/db'

export async function getUserByEmail (email: string, event: H3Event) {
  const DB = await useDb()

  const stmt = DB.select().from(users)
    .where(
      eq(users.email, email)
    )
    .limit(1)
    .prepare()

  const foundUsers = await stmt.all()

  return foundUsers.length ? foundUsers[0] : null
}
