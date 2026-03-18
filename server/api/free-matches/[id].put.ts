import { db } from '../../database/db'
import { freeMatches } from '../../database/schema'
import { eq } from 'drizzle-orm'
import { ensureActivePlayers, getFreeMatchDetailRows, parseFreeMatchPayload } from '../../utils/free-matches'
import { broadcastFreeMatchesUpdate } from '../../utils/ws'

export default defineEventHandler(async (event) => {
  const id = requireIntParam(event, 'id')
  const body = await readBody<Record<string, unknown>>(event)
  const payload = parseFreeMatchPayload(body)

  const [existing] = await db.select().from(freeMatches).where(eq(freeMatches.id, id))
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Partita non trovata' })
  }

  await ensureActivePlayers([
    payload.team1Player1Id,
    payload.team1Player2Id,
    payload.team2Player1Id,
    payload.team2Player2Id,
  ])

  await db.update(freeMatches).set(payload).where(eq(freeMatches.id, id))

  const detailRows = await getFreeMatchDetailRows()
  const updatedDetail = detailRows.find((match) => match.id === id)

  broadcastFreeMatchesUpdate()

  return updatedDetail || { ...existing, ...payload }
})
