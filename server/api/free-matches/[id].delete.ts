import { db } from '../../database/db'
import { freeMatches } from '../../database/schema'
import { eq } from 'drizzle-orm'
import { broadcastFreeMatchesUpdate } from '../../utils/ws'

export default defineEventHandler(async (event) => {
  const id = requireIntParam(event, 'id')

  const [existing] = await db.select().from(freeMatches).where(eq(freeMatches.id, id))
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Partita non trovata' })
  }

  await db.delete(freeMatches).where(eq(freeMatches.id, id))

  broadcastFreeMatchesUpdate()

  return { success: true }
})
