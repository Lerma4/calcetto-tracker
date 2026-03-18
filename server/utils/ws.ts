import type { Peer } from 'crossws'

const peers = new Set<Peer>()

export function wsOnOpen(peer: Peer) {
  peers.add(peer)
}

export function wsOnClose(peer: Peer) {
  peers.delete(peer)
}

export function wsOnError(peer: Peer) {
  peers.delete(peer)
}

export function broadcastCompetitionUpdate(competitionId: number | string) {
  const message = JSON.stringify({
    type: 'competition_update',
    competitionId: String(competitionId)
  })
  
  for (const peer of peers) {
    peer.send(message)
  }
}

export function broadcastFreeMatchesUpdate() {
  const message = JSON.stringify({
    type: 'free_matches_update',
  })

  for (const peer of peers) {
    peer.send(message)
  }
}
