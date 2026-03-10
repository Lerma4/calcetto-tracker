# Atleti & Arene Pages Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Atleti and Arene pages with full CRUD, tournament management (teams, round-robin calendar, results, standings).

**Architecture:** Nuxt file-based routing with new pages at `/atleti`, `/arene`, `/arene/[id]`. Backend uses Drizzle ORM REST endpoints. Schema changes add `disabled` to players and `name` to teams. Round-robin calendar generated server-side. Standings computed client-side.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, Drizzle ORM, better-sqlite3, Tailwind CSS, DaisyUI

---

## File Structure

### Schema & Types (modified)
- `server/database/schema.ts` — Add `disabled` to players, `name` to teams
- `types/index.ts` — Add `disabled` to Player, `name` to Team, add `TeamWithPlayers`, `CompetitionDetail`

### API Endpoints (new)
- `server/api/players/[id].put.ts` — Update player
- `server/api/players/[id].delete.ts` — Delete player (with team check)
- `server/api/players/[id]/toggle-disabled.put.ts` — Toggle disabled
- `server/api/competitions/[id].get.ts` — Get competition detail with teams+matches
- `server/api/competitions/[id]/teams.post.ts` — Create team
- `server/api/competitions/[id]/teams/[teamId].delete.ts` — Delete team
- `server/api/competitions/[id]/generate-calendar.post.ts` — Generate round-robin
- `server/api/matches/[id].put.ts` — Update match result

### Pages (new)
- `pages/atleti.vue` — Player management page
- `pages/arene/index.vue` — Competition list page
- `pages/arene/[id].vue` — Competition detail page

### Layout (modified)
- `layouts/default.vue` — Fix navbar links

---

## Chunk 1: Schema, Types & Navbar

### Task 1: Update DB Schema

**Files:**
- Modify: `server/database/schema.ts`

- [ ] **Step 1: Add `disabled` field to players table and `name` field to teams table**

In `server/database/schema.ts`, update the `players` table to add:
```typescript
disabled: integer('disabled').default(0).notNull(),
```
after the `nickname` field.

Update the `teams` table to add:
```typescript
name: text('name').notNull(),
```
after the `id` field.

- [ ] **Step 2: Push schema to database**

Run: `npx drizzle-kit push`
Expected: Schema changes applied successfully.

- [ ] **Step 3: Commit**

```bash
git add server/database/schema.ts
git commit -m "feat: add disabled field to players and name field to teams"
```

### Task 2: Update TypeScript Types

**Files:**
- Modify: `types/index.ts`

- [ ] **Step 1: Update interfaces and add new types**

Update `types/index.ts` to this full content:

```typescript
export interface Player {
  id: number;
  name: string;
  surname: string;
  role: 'attaccante' | 'portiere' | 'indifferente';
  nickname: string | null;
  disabled: number;
}

export interface Competition {
  id: number;
  name: string;
  winPoints: number;
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
```

- [ ] **Step 2: Commit**

```bash
git add types/index.ts
git commit -m "feat: update types with disabled, team name, and detail interfaces"
```

### Task 3: Fix Navbar Links

**Files:**
- Modify: `layouts/default.vue`

- [ ] **Step 1: Replace navbar buttons with NuxtLink**

In `layouts/default.vue`, replace the two `<button>` elements for ATLETI and ARENE (lines 25-30) with:

```html
<NuxtLink to="/atleti" class="btn btn-ghost btn-sm rounded-xl font-black tracking-widest text-[11px] gap-2 px-6 hover:bg-base-100">
  <Icon name="lucide:users" /> ATLETI
</NuxtLink>
<NuxtLink to="/arene" class="btn btn-ghost btn-sm rounded-xl font-black tracking-widest text-[11px] gap-2 px-6 hover:bg-base-100">
  <Icon name="lucide:sword" /> ARENE
</NuxtLink>
```

- [ ] **Step 2: Commit**

```bash
git add layouts/default.vue
git commit -m "feat: connect navbar buttons to /atleti and /arene routes"
```

---

## Chunk 2: Player API Endpoints

### Task 4: Player Update Endpoint

**Files:**
- Create: `server/api/players/[id].put.ts`

- [ ] **Step 1: Create the PUT endpoint**

Create `server/api/players/[id].put.ts`:

```typescript
import { db } from '../../database/db';
import { players } from '../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));
  const body = await readBody(event);

  if (!body.name || !body.surname) {
    throw createError({ statusCode: 400, statusMessage: 'Name and surname are required' });
  }

  const updated = await db.update(players)
    .set({
      name: body.name,
      surname: body.surname,
      role: body.role,
      nickname: body.nickname,
    })
    .where(eq(players.id, id))
    .returning();

  if (!updated.length) {
    throw createError({ statusCode: 404, statusMessage: 'Player not found' });
  }

  return updated[0];
});
```

- [ ] **Step 2: Verify endpoint works**

Run: `npm run dev`
Test manually or with curl: `curl -X PUT http://localhost:3000/api/players/1 -H "Content-Type: application/json" -d '{"name":"Test","surname":"User","role":"attaccante"}'`

- [ ] **Step 3: Commit**

```bash
git add server/api/players/[id].put.ts
git commit -m "feat: add player update endpoint"
```

### Task 5: Player Delete Endpoint (with team check)

**Files:**
- Create: `server/api/players/[id].delete.ts`

- [ ] **Step 1: Create the DELETE endpoint with team reference check**

Create `server/api/players/[id].delete.ts`:

```typescript
import { db } from '../../database/db';
import { players, teams } from '../../database/schema';
import { eq, or } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));

  const linkedTeams = await db.select({ id: teams.id })
    .from(teams)
    .where(or(eq(teams.player1Id, id), eq(teams.player2Id, id)))
    .limit(1);

  if (linkedTeams.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Impossibile eliminare: il giocatore è collegato a una o più squadre',
    });
  }

  const deleted = await db.delete(players).where(eq(players.id, id)).returning();

  if (!deleted.length) {
    throw createError({ statusCode: 404, statusMessage: 'Player not found' });
  }

  return deleted[0];
});
```

- [ ] **Step 2: Commit**

```bash
git add "server/api/players/[id].delete.ts"
git commit -m "feat: add player delete endpoint with team reference check"
```

### Task 6: Player Toggle Disabled Endpoint

**Files:**
- Create: `server/api/players/[id]/toggle-disabled.put.ts`

- [ ] **Step 1: Create the toggle endpoint**

Create `server/api/players/[id]/toggle-disabled.put.ts`:

```typescript
import { db } from '../../../database/db';
import { players } from '../../../database/schema';
import { eq, sql } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));

  const player = await db.select().from(players).where(eq(players.id, id)).limit(1);

  if (!player.length) {
    throw createError({ statusCode: 404, statusMessage: 'Player not found' });
  }

  const updated = await db.update(players)
    .set({ disabled: player[0].disabled ? 0 : 1 })
    .where(eq(players.id, id))
    .returning();

  return updated[0];
});
```

- [ ] **Step 2: Commit**

```bash
git add "server/api/players/[id]/toggle-disabled.put.ts"
git commit -m "feat: add player toggle-disabled endpoint"
```

---

## Chunk 3: Competition & Team API Endpoints

### Task 7: Competition Detail Endpoint

**Files:**
- Create: `server/api/competitions/[id].get.ts`

- [ ] **Step 1: Create GET endpoint that returns competition with teams (with player data) and matches**

Create `server/api/competitions/[id].get.ts`:

```typescript
import { db } from '../../database/db';
import { competitions, teams, matches, players } from '../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));

  const comp = await db.select().from(competitions).where(eq(competitions.id, id)).limit(1);

  if (!comp.length) {
    throw createError({ statusCode: 404, statusMessage: 'Competition not found' });
  }

  const compTeams = await db.select().from(teams).where(eq(teams.competitionId, id));

  const teamsWithPlayers = await Promise.all(
    compTeams.map(async (team) => {
      const [player1] = await db.select().from(players).where(eq(players.id, team.player1Id));
      const [player2] = await db.select().from(players).where(eq(players.id, team.player2Id));
      return { ...team, player1, player2 };
    })
  );

  const compMatches = await db.select().from(matches).where(eq(matches.competitionId, id));

  return {
    ...comp[0],
    teams: teamsWithPlayers,
    matches: compMatches,
  };
});
```

- [ ] **Step 2: Commit**

```bash
git add "server/api/competitions/[id].get.ts"
git commit -m "feat: add competition detail endpoint with teams and matches"
```

### Task 8: Create Team Endpoint

**Files:**
- Create: `server/api/competitions/[id]/teams.post.ts`

- [ ] **Step 1: Create POST endpoint for team creation**

Create `server/api/competitions/[id]/teams.post.ts`:

```typescript
import { db } from '../../../database/db';
import { teams, competitions } from '../../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const competitionId = Number(getRouterParam(event, 'id'));
  const body = await readBody(event);

  if (!body.name || !body.player1Id || !body.player2Id) {
    throw createError({ statusCode: 400, statusMessage: 'Name, player1Id and player2Id are required' });
  }

  if (body.player1Id === body.player2Id) {
    throw createError({ statusCode: 400, statusMessage: 'I due giocatori devono essere diversi' });
  }

  const comp = await db.select().from(competitions).where(eq(competitions.id, competitionId)).limit(1);
  if (!comp.length) {
    throw createError({ statusCode: 404, statusMessage: 'Competition not found' });
  }

  const newTeam = await db.insert(teams).values({
    name: body.name,
    player1Id: body.player1Id,
    player2Id: body.player2Id,
    competitionId,
  }).returning();

  return newTeam[0];
});
```

- [ ] **Step 2: Commit**

```bash
git add "server/api/competitions/[id]/teams.post.ts"
git commit -m "feat: add team creation endpoint"
```

### Task 9: Delete Team Endpoint

**Files:**
- Create: `server/api/competitions/[id]/teams/[teamId].delete.ts`

- [ ] **Step 1: Create DELETE endpoint (only if no matches exist)**

Create `server/api/competitions/[id]/teams/[teamId].delete.ts`:

```typescript
import { db } from '../../../../database/db';
import { teams, matches } from '../../../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const competitionId = Number(getRouterParam(event, 'id'));
  const teamId = Number(getRouterParam(event, 'teamId'));

  const existingMatches = await db.select({ id: matches.id })
    .from(matches)
    .where(eq(matches.competitionId, competitionId))
    .limit(1);

  if (existingMatches.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Impossibile eliminare: il calendario è già stato generato',
    });
  }

  const deleted = await db.delete(teams)
    .where(eq(teams.id, teamId))
    .returning();

  if (!deleted.length) {
    throw createError({ statusCode: 404, statusMessage: 'Team not found' });
  }

  return deleted[0];
});
```

- [ ] **Step 2: Commit**

```bash
git add "server/api/competitions/[id]/teams/[teamId].delete.ts"
git commit -m "feat: add team delete endpoint with calendar check"
```

### Task 10: Generate Round-Robin Calendar Endpoint

**Files:**
- Create: `server/api/competitions/[id]/generate-calendar.post.ts`

- [ ] **Step 1: Create POST endpoint with round-robin algorithm**

Create `server/api/competitions/[id]/generate-calendar.post.ts`:

```typescript
import { db } from '../../../database/db';
import { teams, matches, competitions } from '../../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const competitionId = Number(getRouterParam(event, 'id'));

  const comp = await db.select().from(competitions).where(eq(competitions.id, competitionId)).limit(1);
  if (!comp.length) {
    throw createError({ statusCode: 404, statusMessage: 'Competition not found' });
  }

  const existingMatches = await db.select({ id: matches.id })
    .from(matches)
    .where(eq(matches.competitionId, competitionId))
    .limit(1);

  if (existingMatches.length > 0) {
    throw createError({ statusCode: 400, statusMessage: 'Il calendario è già stato generato' });
  }

  const compTeams = await db.select().from(teams).where(eq(teams.competitionId, competitionId));

  if (compTeams.length < 2 || compTeams.length % 2 !== 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Serve un numero pari di squadre (minimo 2) per generare il calendario',
    });
  }

  // Round-robin circle method
  const n = compTeams.length;
  const teamIds = compTeams.map(t => t.id);
  const fixed = teamIds[0];
  const rotating = teamIds.slice(1);

  const matchesToInsert: Array<{
    team1Id: number;
    team2Id: number;
    matchday: number;
    competitionId: number;
  }> = [];

  for (let round = 0; round < n - 1; round++) {
    const current = [fixed, ...rotating];
    for (let i = 0; i < n / 2; i++) {
      matchesToInsert.push({
        team1Id: current[i],
        team2Id: current[n - 1 - i],
        matchday: round + 1,
        competitionId,
      });
    }
    // Rotate: move last element to front of rotating array
    rotating.unshift(rotating.pop()!);
  }

  await db.insert(matches).values(matchesToInsert);

  return await db.select().from(matches).where(eq(matches.competitionId, competitionId));
});
```

- [ ] **Step 2: Commit**

```bash
git add "server/api/competitions/[id]/generate-calendar.post.ts"
git commit -m "feat: add round-robin calendar generation endpoint"
```

### Task 11: Update Match Result Endpoint

**Files:**
- Create: `server/api/matches/[id].put.ts`

- [ ] **Step 1: Create PUT endpoint for match result**

Create `server/api/matches/[id].put.ts`:

```typescript
import { db } from '../../database/db';
import { matches } from '../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));
  const body = await readBody(event);

  if (body.score1 == null || body.score2 == null) {
    throw createError({ statusCode: 400, statusMessage: 'score1 and score2 are required' });
  }

  const updated = await db.update(matches)
    .set({
      score1: body.score1,
      score2: body.score2,
      state: 'played',
    })
    .where(eq(matches.id, id))
    .returning();

  if (!updated.length) {
    throw createError({ statusCode: 404, statusMessage: 'Match not found' });
  }

  return updated[0];
});
```

- [ ] **Step 2: Commit**

```bash
git add "server/api/matches/[id].put.ts"
git commit -m "feat: add match result update endpoint"
```

---

## Chunk 4: Atleti Page

### Task 12: Create Atleti Page

**Files:**
- Create: `pages/atleti.vue`

- [ ] **Step 1: Create the full Atleti page with CRUD**

Create `pages/atleti.vue` with:
- Fetch players via `useFetch<Player[]>('/api/players')`
- Add player form (reuse same fields/style as existing `PlayerForm.vue`)
- Table listing all players with disabled visual indicator (opacity-40 + strikethrough for disabled)
- Edit modal: clicking edit opens a DaisyUI modal with form fields pre-filled, saves via `PUT /api/players/[id]`
- Delete button: calls `DELETE /api/players/[id]`, shows error alert if linked to teams
- Disable/Enable toggle button: calls `PUT /api/players/[id]/toggle-disabled`

Key UI details:
- Follow existing design language: `rounded-[3rem]`, `font-black`, `tracking-tighter`, DaisyUI cards/tables
- Disabled players: row has `opacity-40` and status badge shows "DISABILITATO"
- Action buttons in last table column: edit (lucide:pencil), delete (lucide:trash-2), toggle (lucide:ban or lucide:check-circle)
- Error messages shown via DaisyUI alert component

The page should be self-contained (no sub-components needed — the form and table are simpler than dashboard since there's no sidebar layout).

```vue
<script setup lang="ts">
import type { Player } from '~/types'

const { data: players, refresh } = await useFetch<Player[]>('/api/players')

const newPlayer = ref({ name: '', surname: '', role: 'indifferente', nickname: '' })
const isAdding = ref(false)
const editingPlayer = ref<Player | null>(null)
const editForm = ref({ name: '', surname: '', role: 'indifferente', nickname: '' })
const errorMsg = ref('')

const handleAdd = async () => {
  if (!newPlayer.value.name || !newPlayer.value.surname) return
  isAdding.value = true
  try {
    await $fetch('/api/players', { method: 'POST', body: newPlayer.value })
    newPlayer.value = { name: '', surname: '', role: 'indifferente', nickname: '' }
    await refresh()
  } finally {
    isAdding.value = false
  }
}

const openEdit = (player: Player) => {
  editingPlayer.value = player
  editForm.value = { name: player.name, surname: player.surname, role: player.role, nickname: player.nickname || '' }
}

const handleEdit = async () => {
  if (!editingPlayer.value) return
  await $fetch(`/api/players/${editingPlayer.value.id}`, { method: 'PUT', body: editForm.value })
  editingPlayer.value = null
  await refresh()
}

const handleDelete = async (id: number) => {
  errorMsg.value = ''
  try {
    await $fetch(`/api/players/${id}`, { method: 'DELETE' })
    await refresh()
  } catch (e: any) {
    errorMsg.value = e.data?.statusMessage || 'Errore durante l\'eliminazione'
    setTimeout(() => errorMsg.value = '', 4000)
  }
}

const handleToggle = async (id: number) => {
  await $fetch(`/api/players/${id}/toggle-disabled`, { method: 'PUT' })
  await refresh()
}
</script>
```

Template structure:
- Page title header
- Error alert (v-if errorMsg)
- Add player card/form
- Players table with action buttons
- Edit modal (DaisyUI `<dialog>` pattern)

- [ ] **Step 2: Verify page renders and all CRUD operations work**

Run: `npm run dev`, navigate to `/atleti`
Test: Add player, edit player, toggle disable, delete player (should fail if linked to team)

- [ ] **Step 3: Commit**

```bash
git add pages/atleti.vue
git commit -m "feat: add Atleti page with full CRUD, disable toggle, and delete protection"
```

---

## Chunk 5: Arene Pages

### Task 13: Create Arene List Page

**Files:**
- Create: `pages/arene/index.vue`

- [ ] **Step 1: Create the Arene list page**

Create `pages/arene/index.vue` with:
- Fetch competitions via `useFetch<Competition[]>('/api/competitions')`
- Form to create new competition (same fields as `CompetitionForm.vue`: name, winPoints)
- Table listing competitions with click-to-navigate to `/arene/[id]`

Follow existing design patterns from `CompetitionTable.vue` and `CompetitionForm.vue`.

```vue
<script setup lang="ts">
import type { Competition } from '~/types'

const { data: competitions, refresh } = await useFetch<Competition[]>('/api/competitions')

const newComp = ref({ name: '', winPoints: 3 })
const isAdding = ref(false)

const handleAdd = async () => {
  if (!newComp.value.name) return
  isAdding.value = true
  try {
    await $fetch('/api/competitions', { method: 'POST', body: newComp.value })
    newComp.value = { name: '', winPoints: 3 }
    await refresh()
  } finally {
    isAdding.value = false
  }
}
</script>
```

Template: header + form card + competition table (each row is a `NuxtLink` to `/arene/${comp.id}`)

- [ ] **Step 2: Commit**

```bash
git add pages/arene/index.vue
git commit -m "feat: add Arene list page with competition creation"
```

### Task 14: Create Arena Detail Page

**Files:**
- Create: `pages/arene/[id].vue`

- [ ] **Step 1: Create the Arena detail page with all 4 sections**

Create `pages/arene/[id].vue` with:

**Script setup:**
```vue
<script setup lang="ts">
import type { CompetitionDetail, Player } from '~/types'

const route = useRoute()
const compId = route.params.id

const { data: competition, refresh } = await useFetch<CompetitionDetail>(`/api/competitions/${compId}`)
const { data: allPlayers } = await useFetch<Player[]>('/api/players')

const activePlayers = computed(() => allPlayers.value?.filter(p => !p.disabled) || [])

// Team creation form
const newTeam = ref({ name: '', player1Id: 0, player2Id: 0 })
const isAddingTeam = ref(false)

const handleAddTeam = async () => {
  if (!newTeam.value.name || !newTeam.value.player1Id || !newTeam.value.player2Id) return
  isAddingTeam.value = true
  try {
    await $fetch(`/api/competitions/${compId}/teams`, { method: 'POST', body: newTeam.value })
    newTeam.value = { name: '', player1Id: 0, player2Id: 0 }
    await refresh()
  } finally {
    isAddingTeam.value = false
  }
}

const handleDeleteTeam = async (teamId: number) => {
  await $fetch(`/api/competitions/${compId}/teams/${teamId}`, { method: 'DELETE' })
  await refresh()
}

// Calendar generation
const canGenerateCalendar = computed(() => {
  const teams = competition.value?.teams || []
  const matches = competition.value?.matches || []
  return teams.length >= 2 && teams.length % 2 === 0 && matches.length === 0
})

const hasCalendar = computed(() => (competition.value?.matches || []).length > 0)

const handleGenerateCalendar = async () => {
  await $fetch(`/api/competitions/${compId}/generate-calendar`, { method: 'POST' })
  await refresh()
}

// Match result saving
const handleSaveResult = async (matchId: number, score1: number, score2: number) => {
  await $fetch(`/api/matches/${matchId}`, { method: 'PUT', body: { score1, score2 } })
  await refresh()
}

// Matches grouped by matchday
const matchesByDay = computed(() => {
  const matches = competition.value?.matches || []
  const grouped: Record<number, typeof matches> = {}
  for (const m of matches) {
    if (!grouped[m.matchday]) grouped[m.matchday] = []
    grouped[m.matchday].push(m)
  }
  return grouped
})

// Find team name by id
const teamName = (teamId: number) => {
  return competition.value?.teams.find(t => t.id === teamId)?.name || '?'
}

// Standings computation
const standings = computed(() => {
  const teams = competition.value?.teams || []
  const matches = competition.value?.matches || []
  const winPts = competition.value?.winPoints ?? 3

  const stats = teams.map(team => {
    let played = 0, won = 0, drawn = 0, lost = 0, gf = 0, ga = 0
    for (const m of matches) {
      if (m.state !== 'played') continue
      if (m.team1Id === team.id) {
        played++; gf += m.score1; ga += m.score2
        if (m.score1 > m.score2) won++
        else if (m.score1 === m.score2) drawn++
        else lost++
      } else if (m.team2Id === team.id) {
        played++; gf += m.score2; ga += m.score1
        if (m.score2 > m.score1) won++
        else if (m.score1 === m.score2) drawn++
        else lost++
      }
    }
    const points = won * winPts + drawn * 1
    const gd = gf - ga
    return { team, played, won, drawn, lost, gf, ga, gd, points }
  })

  stats.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf)
  return stats
})
</script>
```

**Template structure:**

1. **Header section** — Competition name, winPoints badge, back link to `/arene`
2. **Teams section** — Card with add team form (name input + two player selects from `activePlayers`) + teams list with delete buttons (hidden if `hasCalendar`)
3. **Calendar section** — "Genera Calendario" button (v-if `canGenerateCalendar`). If `hasCalendar`, show matches grouped by matchday. Each match row has: team1 name, score1 input, "vs", score2 input, team2 name, save button. If match state is 'played', show scores as text with option to edit.
4. **Standings section** — Table with columns: #, Squadra (team name + player names), G, V, P, S, GF, GS, DR, PTS. Only shown if `hasCalendar`.

Each match row in calendar uses local `ref` for score inputs. Use `v-model.number` for score inputs.

For match score editing, use inline number inputs (small `input` type number, `w-16` width) with a save button per match.

- [ ] **Step 2: Verify all functionality works end-to-end**

Run: `npm run dev`, navigate to `/arene`, create competition, go to detail, add teams, generate calendar, input results, verify standings.

- [ ] **Step 3: Commit**

```bash
git add pages/arene/[id].vue
git commit -m "feat: add Arena detail page with teams, calendar generation, results, and standings"
```

---

## Chunk 6: Dashboard Cleanup

### Task 15: Update Dashboard to Link to New Pages

**Files:**
- Modify: `pages/index.vue`

- [ ] **Step 1: The dashboard stays as-is**

The dashboard (`pages/index.vue`) remains unchanged — it already shows summary stats and quick-add forms. The forms on the dashboard are convenience shortcuts; the full management happens in `/atleti` and `/arene`.

No changes needed. Mark as done.

- [ ] **Step 2: Final verification**

Run: `npm run dev`
Verify:
1. Dashboard loads, stats hero shows correct counts
2. `/atleti` — add, edit, delete (with protection), toggle disable all work
3. `/arene` — list, create competition work
4. `/arene/[id]` — add teams, generate calendar (only with even teams), save results, standings compute correctly
5. Navbar links highlight correctly on each page

- [ ] **Step 3: Final commit if any adjustments needed**

```bash
git add -A
git commit -m "feat: complete Atleti & Arene pages implementation"
```
