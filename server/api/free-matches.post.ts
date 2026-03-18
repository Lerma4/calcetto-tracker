import { db } from '../database/db'
import { freeMatches } from '../database/schema'
import { ensureActivePlayers, getFreeMatchDetailRows, parseFreeMatchPayload } from '../utils/free-matches'
import { broadcastFreeMatchesUpdate } from '../utils/ws'

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event)
  const payload = parseFreeMatchPayload(body)

  await ensureActivePlayers([
    payload.team1Player1Id,
    payload.team1Player2Id,
    payload.team2Player1Id,
    payload.team2Player2Id,
  ])

  const [created] = await db.insert(freeMatches).values(payload).returning()

  if (!created) {
    throw createError({ statusCode: 500, message: 'Impossibile creare la partita' })
  }

  const detailRows = await getFreeMatchDetailRows()
  const createdDetail = detailRows.find((match) => match.id === created.id)

  broadcastFreeMatchesUpdate()

  return createdDetail || created
})
