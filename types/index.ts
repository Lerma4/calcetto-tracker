export interface Player {
  id: number;
  name: string;
  surname: string;
  role: 'attaccante' | 'portiere' | 'indifferente';
  nickname: string | null;
  disabled: boolean;
  elo?: number;
}

export interface Competition {
  id: number;
  name: string;
  winPoints: number;
  calendarMode: 'auto' | 'manual' | null;
  createdAt: string;
}

export interface Team {
  id: number;
  name: string;
  player1Id: number;
  player2Id: number;
  competitionId: number;
}

export interface Match {
  id: number;
  team1Id: number;
  team2Id: number;
  score1: number;
  score2: number;
  state: 'pending' | 'played';
  matchday: number;
  competitionId: number;
}

export interface TeamWithPlayers extends Team {
  player1: Player;
  player2: Player;
}

export interface CompetitionDetail extends Competition {
  teams: TeamWithPlayers[];
  matches: Match[];
}

export interface FreeMatch {
  id: number;
  team1Player1Id: number;
  team1Player2Id: number;
  team2Player1Id: number;
  team2Player2Id: number;
  score1: number;
  score2: number;
  createdAt: string | Date;
}

export interface FreeMatchDetail extends FreeMatch {
  team1Player1: Player;
  team1Player2: Player;
  team2Player1: Player;
  team2Player2: Player;
}

export interface PlayerStatsRow {
  player: Player;
  matchesPlayed: number;
  goalsFor: number;
  goalsAgainst: number;
  wins: number;
  losses: number;
  winLossRatio: string;
  mostBeatenPlayers: Player[];
  mostLossPlayers: Player[];
}

export interface PairStatsRow {
  pairKey: string;
  player1: Player;
  player2: Player;
  matchesPlayed: number;
  goalsFor: number;
  goalsAgainst: number;
  wins: number;
  losses: number;
  winLossRatio: string;
}
