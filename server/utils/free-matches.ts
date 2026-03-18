import { desc, eq, inArray } from 'drizzle-orm'
import { db } from '../database/db'
import { freeMatches, players } from '../database/schema'
import type { FreeMatch, FreeMatchDetail, Player } from '../../types'

interface FreeMatchPayload {
  team1Player1Id: number
  team1Player2Id: number
  team2Player1Id: number
  team2Player2Id: number
  score1: number
  score2: number
}

const FREE_MATCH_PLAYER_KEYS = [
  'team1Player1Id',
  'team1Player2Id',
  'team2Player1Id',
  'team2Player2Id',
] as const

function toInteger(value: unknown, field: string): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(parsed)) {
    throw createError({ statusCode: 400, message: `${field} deve essere un intero` })
  }
  return parsed
}

export function parseFreeMatchPayload(body: Record<string, unknown>): FreeMatchPayload {
  const payload = {
    team1Player1Id: toInteger(body.team1Player1Id, 'team1Player1Id'),
    team1Player2Id: toInteger(body.team1Player2Id, 'team1Player2Id'),
    team2Player1Id: toInteger(body.team2Player1Id, 'team2Player1Id'),
    team2Player2Id: toInteger(body.team2Player2Id, 'team2Player2Id'),
    score1: toInteger(body.score1, 'score1'),
    score2: toInteger(body.score2, 'score2'),
  }

  if (payload.score1 < 0 || payload.score2 < 0) {
    throw createError({ statusCode: 400, message: 'I punteggi devono essere maggiori o uguali a zero' })
  }

  const playerIds = FREE_MATCH_PLAYER_KEYS.map((key) => payload[key])
  if (new Set(playerIds).size !== playerIds.length) {
    throw createError({ statusCode: 400, message: 'I 4 giocatori devono essere tutti diversi' })
  }

  return payload
}

export async function ensureActivePlayers(playerIds: number[]) {
  const uniqueIds = [...new Set(playerIds)]
  const playerRows = await db.select().from(players).where(inArray(players.id, uniqueIds))

  if (playerRows.length !== uniqueIds.length) {
    throw createError({ statusCode: 404, message: 'Uno o piu giocatori non esistono' })
  }

  const disabledPlayer = playerRows.find((player) => !!player.disabled)
  if (disabledPlayer) {
    throw createError({
      statusCode: 400,
      message: `Il giocatore ${disabledPlayer.name} ${disabledPlayer.surname} e disabilitato`,
    })
  }

  return playerRows
}

function normalizePlayer(player: typeof players.$inferSelect): Player {
  return {
    ...player,
    disabled: !!player.disabled,
  }
}

export async function getFreeMatchDetailRows(): Promise<FreeMatchDetail[]> {
  const matchRows = await db.select().from(freeMatches).orderBy(desc(freeMatches.createdAt), desc(freeMatches.id))

  if (!matchRows.length) {
    return []
  }

  const playerIds = [...new Set(matchRows.flatMap((match) => [
    match.team1Player1Id,
    match.team1Player2Id,
    match.team2Player1Id,
    match.team2Player2Id,
  ]))]

  const playerRows = await db.select().from(players).where(inArray(players.id, playerIds))
  const playersById = new Map(playerRows.map((player) => [player.id, normalizePlayer(player)]))

  return matchRows
    .map((match) => {
      const team1Player1 = playersById.get(match.team1Player1Id)
      const team1Player2 = playersById.get(match.team1Player2Id)
      const team2Player1 = playersById.get(match.team2Player1Id)
      const team2Player2 = playersById.get(match.team2Player2Id)

      if (!team1Player1 || !team1Player2 || !team2Player1 || !team2Player2) {
        return null
      }

      return {
        ...match,
        team1Player1,
        team1Player2,
        team2Player1,
        team2Player2,
      }
    })
    .filter((match): match is FreeMatchDetail => !!match)
}

export async function getFreeMatchById(id: number): Promise<FreeMatch | undefined> {
  const [match] = await db.select().from(freeMatches).where(eq(freeMatches.id, id))
  return match
}
