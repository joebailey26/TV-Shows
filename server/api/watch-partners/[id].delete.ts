import { and, eq } from 'drizzle-orm'
import { getAuthenticatedUserEmail } from '../../lib/auth'
import { useDb } from '../../lib/db'
import { getUserByEmail } from '../../lib/getUserByEmail'
import { watchPartners } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  if (!idParam) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  const partnerId = parseInt(idParam, 10)
  const userEmail = await getAuthenticatedUserEmail(event)
  const user = await getUserByEmail(userEmail, event)
  if (!user) {
    throw createError({ statusCode: 400, statusMessage: 'Could not find user' })
  }

  const DB = await useDb()
  await DB.delete(watchPartners).where(and(eq(watchPartners.id, partnerId), eq(watchPartners.userId, user.id)))
  return { success: true }
})
