export interface Player {
  id: number;
  name: string;
  surname: string;
  role: 'attaccante' | 'portiere' | 'indifferente';
  nickname: string | null;
  disabled: boolean;
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
