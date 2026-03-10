# Atleti & Arene Pages - Design Spec

## Overview

Add two main pages accessible from the navbar (currently non-functional buttons): Atleti for player management and Arene for competition management with full tournament workflow (teams, calendar, results, standings).

## Routing

- `/` — Dashboard (existing, unchanged)
- `/atleti` — Player management (CRUD)
- `/arene` — Competition list + creation
- `/arene/[id]` — Single competition detail (teams, calendar, results, standings)

Navbar buttons ATLETI and ARENE become `NuxtLink` components with active state styling.

## Schema Changes

### players table
- Add `disabled` field: `integer('disabled').default(0).notNull()` (0 = active, 1 = disabled)

### teams table
- Add `name` field: `text('name').notNull()` (team display name)

## Page: Atleti (`/atleti`)

### Features
- Table listing all players (disabled players shown with visual indicator, e.g. greyed out)
- Form to add new players (same fields: name, surname, role, nickname)
- Per-player actions:
  - **Edit** — inline or modal to modify name, surname, nickname, role
  - **Delete** — backend checks if player is referenced in any team; returns 400 if so, deletes otherwise
  - **Disable/Enable toggle** — flips the `disabled` field

### API Endpoints
- `GET /api/players` — returns all players (including disabled, with disabled field)
- `POST /api/players` — create player (existing)
- `PUT /api/players/[id]` — update player fields
- `DELETE /api/players/[id]` — delete player (fails if linked to teams)
- `PUT /api/players/[id]/toggle-disabled` — toggle disabled status

## Page: Arene (`/arene`)

### Features
- List of all competitions with name, winPoints, creation date
- Form to create new competition
- Click on competition navigates to `/arene/[id]`

### API Endpoints
- `GET /api/competitions` — list all (existing)
- `POST /api/competitions` — create (existing)

## Page: Arena Detail (`/arene/[id]`)

### Layout — 4 sections

#### 1. Header
- Competition name, winPoints, creation date

#### 2. Teams Section
- Form: team name + select 2 players (only non-disabled players shown in dropdown)
- List of created teams showing team name and player names
- Delete team button (only if calendar has NOT been generated yet)

#### 3. Calendar Section
- "Genera Calendario" button: visible only when number of teams is even (>= 2) AND no matches exist yet
- Round-robin algorithm (single round, no return matches)
- Matches grouped by matchday
- Each match shows: team1 name vs team2 name, score inputs, save button
- Match state transitions from 'pending' to 'played' when result is saved

#### 4. Standings Section
- Table sorted by: points DESC > goal difference DESC > goals scored DESC
- Columns: position, team name (with player names), played, won, drawn, lost, goals for, goals against, goal difference, points
- Scoring: win = competition's `winPoints`, draw = 1, loss = 0
- Computed client-side from match results

### API Endpoints
- `GET /api/competitions/[id]` — returns competition with teams (with player data) and matches
- `POST /api/competitions/[id]/teams` — create team (name, player1Id, player2Id)
- `DELETE /api/competitions/[id]/teams/[teamId]` — delete team (only if no matches exist)
- `POST /api/competitions/[id]/generate-calendar` — generate round-robin matches
- `PUT /api/matches/[id]` — update match score and set state to 'played'

## Types Updates

```typescript
// Updated
export interface Player {
  id: number;
  name: string;
  surname: string;
  role: 'attaccante' | 'portiere' | 'indifferente';
  nickname: string | null;
  disabled: number; // 0 = active, 1 = disabled
}

// Updated
export interface Team {
  id: number;
  name: string;
  player1Id: number;
  player2Id: number;
  competitionId: number;
}

// New: enriched types for frontend
export interface TeamWithPlayers extends Team {
  player1: Player;
  player2: Player;
}

export interface CompetitionDetail extends Competition {
  teams: TeamWithPlayers[];
  matches: Match[];
}
```

## Round-Robin Algorithm

Standard round-robin scheduling for N teams (N must be even):
- N-1 matchdays
- Each matchday has N/2 matches
- Every team plays every other team exactly once
- Uses the "circle method": fix team 0, rotate the rest
