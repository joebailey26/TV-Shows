import { eq } from 'drizzle-orm'
import { getAuthenticatedUserEmail } from '../../lib/auth'
import { useDb } from '../../lib/db'
import { getUserByEmail } from '../../lib/getUserByEmail'
import { watchPartners } from '../../db/schema'

function isWatchPartnerUniqueConstraintError (error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  return error.message.includes('UNIQUE constraint failed') && error.message.includes('watchPartners')
}

export default defineEventHandler(async (event) => {
  const userEmail = await getAuthenticatedUserEmail(event)
  const user = await getUserByEmail(userEmail, event)
  if (!user) {
    throw createError({ statusCode: 400, statusMessage: 'Could not find user' })
  }

  const body = await readBody<{name?: string}>(event)
  const name = body?.name?.trim()
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Name is required' })
  }
  if (name.length > 64) {
    throw createError({ statusCode: 400, statusMessage: 'Name must be between 1 and 64 characters' })
  }

  const DB = await useDb()
  const existing = await DB.select().from(watchPartners).where(eq(watchPartners.userId, user.id))
  if (existing.some(partner => partner.name.toLowerCase() === name.toLowerCase())) {
    throw createError({ statusCode: 409, statusMessage: 'Partner already exists' })
  }

  try {
    await DB.insert(watchPartners).values({ userId: user.id, name })
  } catch (error) {
    if (isWatchPartnerUniqueConstraintError(error)) {
      throw createError({ statusCode: 409, statusMessage: 'Partner already exists' })
    }

    throw error
  }

  return DB.select().from(watchPartners).where(eq(watchPartners.userId, user.id))
})
