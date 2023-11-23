import type { H3Event } from 'h3'
import { eq } from 'drizzle-orm'
import { users } from '../../db/schema'
import { useDb } from '../lib/db'

export default async function getUserByEmail (email: string, event: H3Event) {
  const DB = useDb(event)

  const foundUsers = await DB.select().from(users)
    .where(
      eq(users.email, email)
    )
    .limit(1)

  return foundUsers.length ? foundUsers[0] : null
}
