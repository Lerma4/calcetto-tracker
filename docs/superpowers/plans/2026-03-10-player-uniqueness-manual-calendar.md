# Player Uniqueness + Manual Calendar Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce one-team-per-player per competition and add manual calendar creation mode alongside auto round-robin.

**Architecture:** Add `calendarMode` field to competitions schema. Validate player uniqueness in team creation API. New endpoints for manual match CRUD. Frontend updates to arena detail page for mode selection and match management.

**Tech Stack:** Nuxt 3, Drizzle ORM, better-sqlite3, Vue 3 Composition API, DaisyUI, Tailwind CSS. No test framework configured — verify via dev server.

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `server/database/schema.ts` | Modify | Add `calendarMode` to competitions |
| `types/index.ts` | Modify | Add `calendarMode` to Competition/CompetitionDetail |
| `server/api/competitions/[id]/teams.post.ts` | Modify | Player uniqueness validation |
| `server/api/competitions/[id]/generate-calendar.post.ts` | Modify | Set `calendarMode = 'auto'` |
| `server/api/competitions/[id]/matches.post.ts` | Create | Manual match creation |
| `server/api/competitions/[id]/matches/[matchId].delete.ts` | Create | Delete match + compact matchdays |
| `server/api/competitions/[id]/matches/[matchId].put.ts` | Create | Update match teams |
| `pages/arene/[id].vue` | Modify | Mode selection UI, manual form, match management |

---

## Chunk 1: Schema + Player Uniqueness

### Task 1: Add `calendarMode` to schema

**Files:**
- Modify: `server/database/schema.ts:12-17`
- Modify: `types/index.ts:10-15`

- [ ] **Step 1: Update Drizzle schema**

In `server/database/schema.ts`, add `calendarMode` to the `competitions` table:

```typescript
export const competitions = sqliteTable('competitions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  winPoints: integer('win_points').default(3).notNull(),
  calendarMode: text('calendar_mode', { enum: ['auto', 'manual'] }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
```

- [ ] **Step 2: Update TypeScript types**

In `types/index.ts`, add to `Competition` interface:

```typescript
export interface Competition {
  id: number;
  name: string;
  winPoints: number;
  calendarMode: 'auto' | 'manual' | null;
  createdAt: string;
}
```

- [ ] **Step 3: Push schema to DB**

Run: `npx drizzle-kit push --force`

- [ ] **Step 4: Commit**

```bash
git add server/database/schema.ts types/index.ts
git commit -m "feat: add calendarMode field to competitions schema"
```

### Task 2: Player uniqueness validation in team creation

**Files:**
- Modify: `server/api/competitions/[id]/teams.post.ts`

- [ ] **Step 1: Add player uniqueness check**

After the `player1Id === player2Id` check and competition existence check, add:

```typescript
import { db } from '../../../database/db';
import { teams, competitions, players } from '../../../database/schema';
import { eq, and, or } from 'drizzle-orm';

// ... inside handler, after comp existence check:

// Check player uniqueness in this competition
const existingTeams = await db.select().from(teams).where(eq(teams.competitionId, competitionId));

for (const playerId of [body.player1Id, body.player2Id]) {
  const alreadyInTeam = existingTeams.find(
    t => t.player1Id === playerId || t.player2Id === playerId
  );
  if (alreadyInTeam) {
    // Fetch player name for error message
    const [player] = await db.select().from(players).where(eq(players.id, playerId));
    const playerName = player ? `${player.name} ${player.surname}` : `ID ${playerId}`;
    throw createError({
      statusCode: 400,
      statusMessage: `Il giocatore ${playerName} è già in una squadra in questa arena`,
    });
  }
}
```

- [ ] **Step 2: Verify via dev server**

Run: `npm run dev`
Test: Try adding a team with a player already in another team in the same competition. Should get 400 error.

- [ ] **Step 3: Commit**

```bash
git add server/api/competitions/[id]/teams.post.ts
git commit -m "feat: enforce player uniqueness per competition in team creation"
```

### Task 3: Filter assigned players in frontend team form

**Files:**
- Modify: `pages/arene/[id].vue`

- [ ] **Step 1: Add `availablePlayers` computed**

In the `<script setup>` section, after `activePlayers` computed, add:

```typescript
const assignedPlayerIds = computed(() => {
  const teams = competition.value?.teams || []
  const ids = new Set<number>()
  for (const t of teams) {
    ids.add(t.player1Id)
    ids.add(t.player2Id)
  }
  return ids
})

const availablePlayers = computed(() =>
  activePlayers.value.filter(p => !assignedPlayerIds.value.has(p.id))
)
```

- [ ] **Step 2: Replace `activePlayers` with `availablePlayers` in team form selects**

In both `<select>` elements for player1 and player2 in the team creation form, replace:
```html
<option v-for="p in activePlayers"
```
with:
```html
<option v-for="p in availablePlayers"
```

- [ ] **Step 3: Verify via dev server**

Players already in a team should not appear in the dropdowns.

- [ ] **Step 4: Commit**

```bash
git add pages/arene/[id].vue
git commit -m "feat: filter out already-assigned players from team creation form"
```

---

## Chunk 2: Calendar Mode Selection + Auto Mode Update

### Task 4: Update generate-calendar to set calendarMode

**Files:**
- Modify: `server/api/competitions/[id]/generate-calendar.post.ts`

- [ ] **Step 1: Set calendarMode = 'auto' before generating**

After the team count validation, before the round-robin logic, add:

```typescript
await db.update(competitions)
  .set({ calendarMode: 'auto' })
  .where(eq(competitions.id, competitionId));
```

Also add a check at the top (after comp existence):

```typescript
if (comp[0].calendarMode === 'manual') {
  throw createError({
    statusCode: 400,
    statusMessage: 'Questa arena usa il calendario manuale',
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add server/api/competitions/[id]/generate-calendar.post.ts
git commit -m "feat: set calendarMode=auto on calendar generation"
```

### Task 5: Calendar mode selection UI

**Files:**
- Modify: `pages/arene/[id].vue`

- [ ] **Step 1: Add manual mode state and handler**

In `<script setup>`, add:

```typescript
const handleStartManualCalendar = async () => {
  // Mode will be set server-side on first match creation
  // Just update local state to show the manual form
  if (competition.value) {
    competition.value.calendarMode = 'manual'
  }
}
```

- [ ] **Step 2: Replace single generate button with two-card choice**

Replace the "Generate Button" `<div>` section (the `v-if="!hasCalendar"` block inside the Calendar section) with:

```html
<!-- Mode Selection (no matches yet, no mode chosen) -->
<div v-if="!hasCalendar && !competition?.calendarMode" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <!-- Auto card -->
  <div class="bg-base-200 rounded-2xl p-6 flex flex-col items-center text-center gap-4">
    <Icon name="lucide:wand-2" class="w-8 h-8 opacity-60" />
    <div>
      <h3 class="font-black uppercase tracking-widest text-sm mb-1">Automatico</h3>
      <p class="text-xs opacity-50">Genera un calendario round-robin completo</p>
    </div>
    <button
      @click="handleGenerateCalendar"
      class="btn btn-secondary rounded-xl font-black tracking-widest"
      :disabled="!canGenerateCalendar"
    >GENERA</button>
    <p v-if="(competition?.teams?.length || 0) % 2 !== 0 && (competition?.teams?.length || 0) > 0"
      class="text-warning text-xs font-bold uppercase tracking-widest">
      Serve un numero pari di squadre
    </p>
    <p v-else-if="(competition?.teams?.length || 0) < 2"
      class="text-xs font-bold opacity-40 uppercase tracking-widest">
      Inserisci almeno 2 squadre
    </p>
  </div>
  <!-- Manual card -->
  <div class="bg-base-200 rounded-2xl p-6 flex flex-col items-center text-center gap-4">
    <Icon name="lucide:hand" class="w-8 h-8 opacity-60" />
    <div>
      <h3 class="font-black uppercase tracking-widest text-sm mb-1">Manuale</h3>
      <p class="text-xs opacity-50">Aggiungi le partite una alla volta, giornata per giornata</p>
    </div>
    <button
      @click="handleStartManualCalendar"
      class="btn btn-accent rounded-xl font-black tracking-widest"
      :disabled="!canGenerateCalendar"
    >INIZIA</button>
  </div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add pages/arene/[id].vue
git commit -m "feat: add calendar mode selection UI (auto vs manual)"
```

---

## Chunk 3: Manual Match CRUD APIs

### Task 6: Create manual match endpoint

**Files:**
- Create: `server/api/competitions/[id]/matches.post.ts`

- [ ] **Step 1: Create the endpoint**

```typescript
import { db } from '../../../database/db';
import { teams, matches, competitions } from '../../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const competitionId = Number(getRouterParam(event, 'id'));
  const body = await readBody(event);

  if (!body.team1Id || !body.team2Id) {
    throw createError({ statusCode: 400, statusMessage: 'team1Id e team2Id sono richiesti' });
  }

  if (body.team1Id === body.team2Id) {
    throw createError({ statusCode: 400, statusMessage: 'Le due squadre devono essere diverse' });
  }

  // Check competition exists and mode
  const [comp] = await db.select().from(competitions).where(eq(competitions.id, competitionId));
  if (!comp) {
    throw createError({ statusCode: 404, statusMessage: 'Arena non trovata' });
  }

  if (comp.calendarMode === 'auto') {
    throw createError({ statusCode: 400, statusMessage: 'Questa arena usa il calendario automatico' });
  }

  // Verify teams belong to this competition
  const compTeams = await db.select().from(teams).where(eq(teams.competitionId, competitionId));
  const teamIds = new Set(compTeams.map(t => t.id));
  if (!teamIds.has(body.team1Id) || !teamIds.has(body.team2Id)) {
    throw createError({ statusCode: 400, statusMessage: 'Le squadre devono appartenere a questa arena' });
  }

  // Check duplicate matchup (any order)
  const allMatches = await db.select().from(matches).where(eq(matches.competitionId, competitionId));
  const duplicateMatch = allMatches.find(
    m => (m.team1Id === body.team1Id && m.team2Id === body.team2Id) ||
         (m.team1Id === body.team2Id && m.team2Id === body.team1Id)
  );
  if (duplicateMatch) {
    throw createError({ statusCode: 400, statusMessage: 'Questa coppia di squadre ha già una partita in calendario' });
  }

  // Calculate matchday
  const maxMatchday = allMatches.reduce((max, m) => Math.max(max, m.matchday), 0);
  const matchesPerDay = compTeams.length / 2;
  const currentDayMatches = allMatches.filter(m => m.matchday === maxMatchday);

  let matchday: number;
  if (maxMatchday === 0 || currentDayMatches.length >= matchesPerDay) {
    matchday = maxMatchday + 1;
  } else {
    matchday = maxMatchday;
  }

  // Check neither team already plays on this matchday
  const dayMatches = allMatches.filter(m => m.matchday === matchday);
  for (const tId of [body.team1Id, body.team2Id]) {
    const alreadyPlays = dayMatches.find(m => m.team1Id === tId || m.team2Id === tId);
    if (alreadyPlays) {
      const team = compTeams.find(t => t.id === tId);
      throw createError({
        statusCode: 400,
        statusMessage: `La squadra ${team?.name || tId} gioca già nella giornata ${matchday}`,
      });
    }
  }

  // Set mode if first match
  if (!comp.calendarMode) {
    await db.update(competitions)
      .set({ calendarMode: 'manual' })
      .where(eq(competitions.id, competitionId));
  }

  const [newMatch] = await db.insert(matches).values({
    team1Id: body.team1Id,
    team2Id: body.team2Id,
    matchday,
    competitionId,
  }).returning();

  return newMatch;
});
```

- [ ] **Step 2: Commit**

```bash
git add server/api/competitions/[id]/matches.post.ts
git commit -m "feat: add manual match creation endpoint"
```

### Task 7: Create delete match endpoint

**Files:**
- Create: `server/api/competitions/[id]/matches/[matchId].delete.ts`

- [ ] **Step 1: Create the endpoint**

```typescript
import { db } from '../../../../database/db';
import { matches } from '../../../../database/schema';
import { eq, and } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const competitionId = Number(getRouterParam(event, 'id'));
  const matchId = Number(getRouterParam(event, 'matchId'));

  // Delete the match
  const [deleted] = await db.delete(matches)
    .where(and(eq(matches.id, matchId), eq(matches.competitionId, competitionId)))
    .returning();

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Partita non trovata' });
  }

  // Compact matchdays: remove gaps
  const remaining = await db.select().from(matches)
    .where(eq(matches.competitionId, competitionId));

  const usedDays = [...new Set(remaining.map(m => m.matchday))].sort((a, b) => a - b);

  for (let i = 0; i < usedDays.length; i++) {
    const oldDay = usedDays[i]!;
    const newDay = i + 1;
    if (oldDay !== newDay) {
      await db.update(matches)
        .set({ matchday: newDay })
        .where(and(eq(matches.competitionId, competitionId), eq(matches.matchday, oldDay)));
    }
  }

  return { success: true };
});
```

- [ ] **Step 2: Commit**

```bash
git add server/api/competitions/[id]/matches/[matchId].delete.ts
git commit -m "feat: add delete match endpoint with matchday compaction"
```

### Task 8: Create update match teams endpoint

**Files:**
- Create: `server/api/competitions/[id]/matches/[matchId].put.ts`

- [ ] **Step 1: Create the endpoint**

```typescript
import { db } from '../../../../database/db';
import { teams, matches } from '../../../../database/schema';
import { eq, and } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const competitionId = Number(getRouterParam(event, 'id'));
  const matchId = Number(getRouterParam(event, 'matchId'));
  const body = await readBody(event);

  if (!body.team1Id || !body.team2Id) {
    throw createError({ statusCode: 400, statusMessage: 'team1Id e team2Id sono richiesti' });
  }

  if (body.team1Id === body.team2Id) {
    throw createError({ statusCode: 400, statusMessage: 'Le due squadre devono essere diverse' });
  }

  // Get the match being edited
  const [currentMatch] = await db.select().from(matches)
    .where(and(eq(matches.id, matchId), eq(matches.competitionId, competitionId)));

  if (!currentMatch) {
    throw createError({ statusCode: 404, statusMessage: 'Partita non trovata' });
  }

  // Verify teams belong to competition
  const compTeams = await db.select().from(teams).where(eq(teams.competitionId, competitionId));
  const teamIds = new Set(compTeams.map(t => t.id));
  if (!teamIds.has(body.team1Id) || !teamIds.has(body.team2Id)) {
    throw createError({ statusCode: 400, statusMessage: 'Le squadre devono appartenere a questa arena' });
  }

  // Check duplicate matchup (excluding current match)
  const allMatches = await db.select().from(matches).where(eq(matches.competitionId, competitionId));
  const duplicateMatch = allMatches.find(
    m => m.id !== matchId &&
      ((m.team1Id === body.team1Id && m.team2Id === body.team2Id) ||
       (m.team1Id === body.team2Id && m.team2Id === body.team1Id))
  );
  if (duplicateMatch) {
    throw createError({ statusCode: 400, statusMessage: 'Questa coppia di squadre ha già una partita in calendario' });
  }

  // Check neither team already plays on this matchday (excluding current match)
  const dayMatches = allMatches.filter(m => m.matchday === currentMatch.matchday && m.id !== matchId);
  for (const tId of [body.team1Id, body.team2Id]) {
    const alreadyPlays = dayMatches.find(m => m.team1Id === tId || m.team2Id === tId);
    if (alreadyPlays) {
      const team = compTeams.find(t => t.id === tId);
      throw createError({
        statusCode: 400,
        statusMessage: `La squadra ${team?.name || tId} gioca già nella giornata ${currentMatch.matchday}`,
      });
    }
  }

  const [updated] = await db.update(matches)
    .set({ team1Id: body.team1Id, team2Id: body.team2Id })
    .where(eq(matches.id, matchId))
    .returning();

  return updated;
});
```

- [ ] **Step 2: Commit**

```bash
git add server/api/competitions/[id]/matches/[matchId].put.ts
git commit -m "feat: add update match teams endpoint with coherency checks"
```

---

## Chunk 4: Frontend — Manual Calendar Form + Match Management

### Task 9: Manual match creation form UI

**Files:**
- Modify: `pages/arene/[id].vue`

- [ ] **Step 1: Add manual calendar state and logic**

In `<script setup>`, add after the existing calendar logic:

```typescript
// Manual calendar
const newMatch = ref({ team1Id: 0, team2Id: 0 })
const isAddingMatch = ref(false)

const currentMatchday = computed(() => {
  const allMatches = competition.value?.matches || []
  const teamsCount = competition.value?.teams?.length || 0
  const matchesPerDay = Math.floor(teamsCount / 2)
  if (allMatches.length === 0) return 1
  const maxDay = Math.max(...allMatches.map(m => m.matchday))
  const currentDayMatches = allMatches.filter(m => m.matchday === maxDay)
  if (currentDayMatches.length >= matchesPerDay) return maxDay + 1
  return maxDay
})

const currentDayMatchCount = computed(() => {
  const allMatches = competition.value?.matches || []
  return allMatches.filter(m => m.matchday === currentMatchday.value).length
})

const matchesPerDay = computed(() => Math.floor((competition.value?.teams?.length || 0) / 2))

const isCurrentDayFull = computed(() => currentDayMatchCount.value >= matchesPerDay.value)

// Teams available for selection in current matchday (not already playing)
const teamsPlayingCurrentDay = computed(() => {
  const allMatches = competition.value?.matches || []
  const dayMatches = allMatches.filter(m => m.matchday === currentMatchday.value)
  const ids = new Set<number>()
  for (const m of dayMatches) {
    ids.add(m.team1Id)
    ids.add(m.team2Id)
  }
  return ids
})

// All matchups already in calendar (for duplicate check)
const existingMatchups = computed(() => {
  const allMatches = competition.value?.matches || []
  return new Set(allMatches.map(m => {
    const sorted = [m.team1Id, m.team2Id].sort((a, b) => a - b)
    return `${sorted[0]}-${sorted[1]}`
  }))
})

const availableTeamsForMatch = (excludeTeamId?: number) => {
  const allTeams = competition.value?.teams || []
  return allTeams.filter(t => {
    if (teamsPlayingCurrentDay.value.has(t.id)) return false
    if (excludeTeamId && t.id === excludeTeamId) return false
    // Check if this pairing already exists
    if (excludeTeamId) {
      const sorted = [t.id, excludeTeamId].sort((a, b) => a - b)
      if (existingMatchups.value.has(`${sorted[0]}-${sorted[1]}`)) return false
    }
    return true
  })
}

const handleAddMatch = async () => {
  if (!newMatch.value.team1Id || !newMatch.value.team2Id) return
  errorMsg.value = ''
  isAddingMatch.value = true
  try {
    await $fetch(`/api/competitions/${compId}/matches`, {
      method: 'POST',
      body: newMatch.value,
    })
    newMatch.value = { team1Id: 0, team2Id: 0 }
    await refresh()
  } catch (e: any) {
    errorMsg.value = e.data?.statusMessage || 'Errore nell\'aggiunta della partita'
    setTimeout(() => errorMsg.value = '', 4000)
  } finally {
    isAddingMatch.value = false
  }
}
```

- [ ] **Step 2: Add manual calendar form template**

In the calendar section, after the mode selection cards, add:

```html
<!-- Manual calendar form (mode = manual, day not full) -->
<div v-if="competition?.calendarMode === 'manual'" class="space-y-6">
  <!-- Current matchday indicator + form -->
  <div v-if="!isCurrentDayFull" class="space-y-4">
    <div class="flex items-center gap-3">
      <span class="badge badge-accent badge-lg font-black tracking-widest">
        Giornata {{ currentMatchday }} — {{ currentDayMatchCount }}/{{ matchesPerDay }}
      </span>
    </div>
    <form @submit.prevent="handleAddMatch" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <select v-model.number="newMatch.team1Id" class="select select-bordered rounded-xl" required>
        <option :value="0" disabled>Squadra casa</option>
        <option v-for="t in availableTeamsForMatch(newMatch.team2Id || undefined)" :key="t.id" :value="t.id">
          {{ t.name }}
        </option>
      </select>
      <select v-model.number="newMatch.team2Id" class="select select-bordered rounded-xl" required>
        <option :value="0" disabled>Squadra ospite</option>
        <option v-for="t in availableTeamsForMatch(newMatch.team1Id || undefined)" :key="t.id" :value="t.id">
          {{ t.name }}
        </option>
      </select>
      <button type="submit" class="btn btn-accent rounded-xl font-black tracking-widest" :disabled="isAddingMatch">
        <span v-if="isAddingMatch" class="loading loading-spinner loading-sm"></span>
        AGGIUNGI
      </button>
    </form>
  </div>
  <div v-else class="flex items-center gap-3">
    <span class="badge badge-success badge-lg font-black tracking-widest">
      Giornata {{ currentMatchday }} — Completa
    </span>
  </div>

  <!-- Existing matches by day (reuse matchesByDay) -->
  <!-- (same as auto calendar display, shown below in Task 10) -->
</div>
```

- [ ] **Step 3: Commit**

```bash
git add pages/arene/[id].vue
git commit -m "feat: add manual match creation form with smart team filtering"
```

### Task 10: Match delete and edit UI

**Files:**
- Modify: `pages/arene/[id].vue`

- [ ] **Step 1: Add delete and edit handlers**

In `<script setup>`, add:

```typescript
// Match management
const editingMatchId = ref<number | null>(null)
const editMatch = ref({ team1Id: 0, team2Id: 0 })

const handleDeleteMatch = async (matchId: number) => {
  if (!confirm('Eliminare questa partita?')) return
  errorMsg.value = ''
  try {
    await $fetch(`/api/competitions/${compId}/matches/${matchId}`, { method: 'DELETE' })
    await refresh()
  } catch (e: any) {
    errorMsg.value = e.data?.statusMessage || 'Errore nell\'eliminazione della partita'
    setTimeout(() => errorMsg.value = '', 4000)
  }
}

const startEditMatch = (match: { id: number; team1Id: number; team2Id: number }) => {
  editingMatchId.value = match.id
  editMatch.value = { team1Id: match.team1Id, team2Id: match.team2Id }
}

const cancelEditMatch = () => {
  editingMatchId.value = null
}

const handleSaveMatchTeams = async (matchId: number) => {
  errorMsg.value = ''
  try {
    await $fetch(`/api/competitions/${compId}/matches/${matchId}`, {
      method: 'PUT',
      body: editMatch.value,
    })
    editingMatchId.value = null
    await refresh()
  } catch (e: any) {
    errorMsg.value = e.data?.statusMessage || 'Errore nella modifica della partita'
    setTimeout(() => errorMsg.value = '', 4000)
  }
}
```

- [ ] **Step 2: Update match row template with delete/edit buttons**

Replace the Match Days `<div v-else class="space-y-6">` block with:

```html
<div v-if="hasCalendar" class="space-y-6">
  <div v-for="(dayMatches, day) in matchesByDay" :key="day">
    <h3 class="text-sm font-black uppercase tracking-[0.3em] opacity-40 mb-3">Giornata {{ day }}</h3>
    <div class="space-y-2">
      <div v-for="match in dayMatches" :key="match.id"
        class="flex items-center gap-3 bg-base-200 rounded-xl p-4 flex-wrap">

        <!-- Normal view -->
        <template v-if="editingMatchId !== match.id">
          <span class="font-black flex-1 text-right min-w-[100px]" :title="teamPlayers(match.team1Id)">
            {{ teamName(match.team1Id) }}
          </span>
          <div class="flex items-center gap-2">
            <input type="number" min="0"
              class="input input-bordered input-sm rounded-lg w-16 text-center font-black"
              :value="getScores(match.id, match.score1, match.score2).score1"
              @input="localScores[match.id] = { ...getScores(match.id, match.score1, match.score2), score1: Number(($event.target as HTMLInputElement).value) }" />
            <span class="font-black opacity-30">vs</span>
            <input type="number" min="0"
              class="input input-bordered input-sm rounded-lg w-16 text-center font-black"
              :value="getScores(match.id, match.score1, match.score2).score2"
              @input="localScores[match.id] = { ...getScores(match.id, match.score1, match.score2), score2: Number(($event.target as HTMLInputElement).value) }" />
          </div>
          <span class="font-black flex-1 min-w-[100px]" :title="teamPlayers(match.team2Id)">
            {{ teamName(match.team2Id) }}
          </span>
          <button @click="handleSaveResult(match.id)" class="btn btn-primary btn-sm rounded-lg font-bold">
            <Icon name="lucide:save" class="w-4 h-4" />
          </button>
          <button @click="startEditMatch(match)" class="btn btn-ghost btn-sm rounded-lg">
            <Icon name="lucide:pencil" class="w-4 h-4" />
          </button>
          <button @click="handleDeleteMatch(match.id)" class="btn btn-ghost btn-sm text-error rounded-lg">
            <Icon name="lucide:trash-2" class="w-4 h-4" />
          </button>
          <span v-if="match.state === 'played'" class="badge badge-success badge-xs font-bold">GIOCATA</span>
        </template>

        <!-- Edit view -->
        <template v-else>
          <select v-model.number="editMatch.team1Id" class="select select-bordered select-sm rounded-lg flex-1">
            <option v-for="t in competition?.teams" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
          <span class="font-black opacity-30">vs</span>
          <select v-model.number="editMatch.team2Id" class="select select-bordered select-sm rounded-lg flex-1">
            <option v-for="t in competition?.teams" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
          <button @click="handleSaveMatchTeams(match.id)" class="btn btn-success btn-sm rounded-lg font-bold">
            <Icon name="lucide:check" class="w-4 h-4" />
          </button>
          <button @click="cancelEditMatch" class="btn btn-ghost btn-sm rounded-lg">
            <Icon name="lucide:x" class="w-4 h-4" />
          </button>
        </template>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Ensure the manual mode also shows existing matches**

The `hasCalendar` computed already works for both modes (checks `matches.length > 0`). The calendar display section should be shown regardless of mode when there are matches. Structure the calendar section template as:

1. Mode selection cards → shown when `!hasCalendar && !competition?.calendarMode`
2. Manual form → shown when `competition?.calendarMode === 'manual'`
3. Match display → shown when `hasCalendar` (both modes)

- [ ] **Step 4: Verify all flows via dev server**

Test:
1. Create competition → add teams → verify player uniqueness filter
2. Choose auto → verify round-robin generates with `calendarMode = 'auto'`
3. New competition → choose manual → add matches one by one → verify matchday auto-increment
4. Edit match teams → verify coherency checks
5. Delete match → verify matchday compaction
6. Save match scores → verify still works

- [ ] **Step 5: Commit**

```bash
git add pages/arene/[id].vue
git commit -m "feat: add match edit/delete UI and manual calendar display"
```
