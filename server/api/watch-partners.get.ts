import { eq } from 'drizzle-orm'
import { getAuthenticatedUserEmail } from '../lib/auth'
import { useDb } from '../lib/db'
import { getUserByEmail } from '../lib/getUserByEmail'
import { watchPartners } from '../db/schema'

export default defineEventHandler(async (event) => {
  const userEmail = await getAuthenticatedUserEmail(event)
  const user = await getUserByEmail(userEmail, event)
  if (!user) {
    throw createError({ statusCode: 400, statusMessage: 'Could not find user' })
  }

  const DB = await useDb()
  return DB.select().from(watchPartners).where(eq(watchPartners.userId, user.id))
})
