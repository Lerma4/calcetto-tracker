import type { FreeMatchDetail, PairStatsRow, Player, PlayerStatsRow } from '~/types'

interface BuildStatsOptions {
  vsPlayerId?: number | null
}

interface MutablePlayerStats {
  player: Player
  matchesPlayed: number
  goalsFor: number
  goalsAgainst: number
  wins: number
  losses: number
  beatenCounts: Map<number, number>
  lossCounts: Map<number, number>
}

interface MutablePairStats {
  pairKey: string
  player1: Player
  player2: Player
  matchesPlayed: number
  goalsFor: number
  goalsAgainst: number
  wins: number
  losses: number
}

function playerLabel(player: Player) {
  return player.nickname || `${player.name} ${player.surname}`
}

function sortedPair(players: [Player, Player]) {
  return [...players].sort((a, b) => a.id - b.id) as [Player, Player]
}

function formatWinLossRatio(wins: number, losses: number) {
  if (wins === 0 && losses === 0) {
    return '-'
  }

  if (losses === 0) {
    return '∞'
  }

  return (wins / losses).toFixed(2)
}

function getTopPlayers(counts: Map<number, number>, playersById: Map<number, Player>) {
  let max = 0
  const ids: number[] = []

  for (const [playerId, count] of counts.entries()) {
    if (count > max) {
      max = count
      ids.length = 0
      ids.push(playerId)
      continue
    }

    if (count === max && count > 0) {
      ids.push(playerId)
    }
  }

  return ids
    .map((id) => playersById.get(id))
    .filter((player): player is Player => !!player)
    .sort((a, b) => playerLabel(a).localeCompare(playerLabel(b), 'it'))
}

function getOrCreatePlayerStats(store: Map<number, MutablePlayerStats>, player: Player) {
  const current = store.get(player.id)
  if (current) {
    return current
  }

  const next: MutablePlayerStats = {
    player,
    matchesPlayed: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    wins: 0,
    losses: 0,
    beatenCounts: new Map(),
    lossCounts: new Map(),
  }
  store.set(player.id, next)
  return next
}

function getOrCreatePairStats(store: Map<string, MutablePairStats>, players: [Player, Player]) {
  const [player1, player2] = sortedPair(players)
  const key = `${player1.id}-${player2.id}`
  const current = store.get(key)
  if (current) {
    return current
  }

  const next: MutablePairStats = {
    pairKey: key,
    player1,
    player2,
    matchesPlayed: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    wins: 0,
    losses: 0,
  }
  store.set(key, next)
  return next
}

function applyCounters(target: MutablePlayerStats, scoreFor: number, scoreAgainst: number, opponentIds: number[]) {
  target.matchesPlayed += 1
  target.goalsFor += scoreFor
  target.goalsAgainst += scoreAgainst

  if (scoreFor > scoreAgainst) {
    target.wins += 1
    for (const opponentId of opponentIds) {
      target.beatenCounts.set(opponentId, (target.beatenCounts.get(opponentId) || 0) + 1)
    }
  } else if (scoreFor < scoreAgainst) {
    target.losses += 1
    for (const opponentId of opponentIds) {
      target.lossCounts.set(opponentId, (target.lossCounts.get(opponentId) || 0) + 1)
    }
  }
}

function applyPairCounters(target: MutablePairStats, scoreFor: number, scoreAgainst: number) {
  target.matchesPlayed += 1
  target.goalsFor += scoreFor
  target.goalsAgainst += scoreAgainst

  if (scoreFor > scoreAgainst) {
    target.wins += 1
  } else if (scoreFor < scoreAgainst) {
    target.losses += 1
  }
}

export function buildFreeMatchStats(matches: FreeMatchDetail[], options: BuildStatsOptions = {}) {
  const playersById = new Map<number, Player>()
  const playerStats = new Map<number, MutablePlayerStats>()
  const pairStats = new Map<string, MutablePairStats>()

  for (const match of matches) {
    const team1: [Player, Player] = [match.team1Player1, match.team1Player2]
    const team2: [Player, Player] = [match.team2Player1, match.team2Player2]

    for (const player of [...team1, ...team2]) {
      playersById.set(player.id, player)
    }

    if (options.vsPlayerId) {
      const team1HasVsPlayer = team1.some((player) => player.id === options.vsPlayerId)
      const team2HasVsPlayer = team2.some((player) => player.id === options.vsPlayerId)

      if (!team1HasVsPlayer && !team2HasVsPlayer) {
        continue
      }

      if (team1HasVsPlayer) {
        const pair = getOrCreatePairStats(pairStats, team2)
        applyPairCounters(pair, match.score2, match.score1)

        for (const player of team2) {
          const stats = getOrCreatePlayerStats(playerStats, player)
          applyCounters(stats, match.score2, match.score1, [options.vsPlayerId])
        }
      }

      if (team2HasVsPlayer) {
        const pair = getOrCreatePairStats(pairStats, team1)
        applyPairCounters(pair, match.score1, match.score2)

        for (const player of team1) {
          const stats = getOrCreatePlayerStats(playerStats, player)
          applyCounters(stats, match.score1, match.score2, [options.vsPlayerId])
        }
      }

      continue
    }

    const team1Pair = getOrCreatePairStats(pairStats, team1)
    const team2Pair = getOrCreatePairStats(pairStats, team2)

    applyPairCounters(team1Pair, match.score1, match.score2)
    applyPairCounters(team2Pair, match.score2, match.score1)

    for (const player of team1) {
      const stats = getOrCreatePlayerStats(playerStats, player)
      applyCounters(stats, match.score1, match.score2, team2.map((opponent) => opponent.id))
    }

    for (const player of team2) {
      const stats = getOrCreatePlayerStats(playerStats, player)
      applyCounters(stats, match.score2, match.score1, team1.map((opponent) => opponent.id))
    }
  }

  const playerRows: PlayerStatsRow[] = [...playerStats.values()]
    .map((stats) => ({
      player: stats.player,
      matchesPlayed: stats.matchesPlayed,
      goalsFor: stats.goalsFor,
      goalsAgainst: stats.goalsAgainst,
      wins: stats.wins,
      losses: stats.losses,
      winLossRatio: formatWinLossRatio(stats.wins, stats.losses),
      mostBeatenPlayers: getTopPlayers(stats.beatenCounts, playersById),
      mostLossPlayers: getTopPlayers(stats.lossCounts, playersById),
    }))
    .sort((a, b) =>
      b.matchesPlayed - a.matchesPlayed ||
      b.wins - a.wins ||
      b.goalsFor - a.goalsFor ||
      playerLabel(a.player).localeCompare(playerLabel(b.player), 'it'))

  const pairRows: PairStatsRow[] = [...pairStats.values()]
    .map((stats) => ({
      pairKey: stats.pairKey,
      player1: stats.player1,
      player2: stats.player2,
      matchesPlayed: stats.matchesPlayed,
      goalsFor: stats.goalsFor,
      goalsAgainst: stats.goalsAgainst,
      wins: stats.wins,
      losses: stats.losses,
      winLossRatio: formatWinLossRatio(stats.wins, stats.losses),
    }))
    .sort((a, b) =>
      b.matchesPlayed - a.matchesPlayed ||
      b.wins - a.wins ||
      b.goalsFor - a.goalsFor ||
      a.pairKey.localeCompare(b.pairKey))

  return {
    playerStats: playerRows,
    pairStats: pairRows,
  }
}
