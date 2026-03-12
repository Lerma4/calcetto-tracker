<script setup lang="ts">
import type { CompetitionDetail, Player } from '~/types'

const route = useRoute()
const compId = route.params.id

const { canCreate, canEdit, canDelete } = usePermissions()
const { isLoggedIn } = useAuth()

const { data: competition, refresh } = await useFetch<CompetitionDetail>(`/api/competitions/${compId}`)
const { data: allPlayers } = isLoggedIn.value ? await useFetch<Player[]>('/api/players') : { data: ref(null) }

const activePlayers = computed(() => allPlayers.value?.filter(p => !p.disabled) || [])

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

// Team creation
const newTeam = ref({ name: '', player1Id: 0, player2Id: 0 })
const isAddingTeam = ref(false)
const errorMsg = ref('')

const handleAddTeam = async () => {
  if (!newTeam.value.name || !newTeam.value.player1Id || !newTeam.value.player2Id) return
  errorMsg.value = ''
  isAddingTeam.value = true
  try {
    await $fetch(`/api/competitions/${compId}/teams`, { method: 'POST', body: newTeam.value })
    newTeam.value = { name: '', player1Id: 0, player2Id: 0 }
    await refresh()
  } catch (e: any) {
    errorMsg.value = e.data?.statusMessage || 'Errore nella creazione della squadra'
    setTimeout(() => errorMsg.value = '', 4000)
  } finally {
    isAddingTeam.value = false
  }
}

const handleDeleteTeam = async (teamId: number) => {
  errorMsg.value = ''
  try {
    await $fetch(`/api/competitions/${compId}/teams/${teamId}`, { method: 'DELETE' })
    await refresh()
  } catch (e: any) {
    errorMsg.value = e.data?.statusMessage || 'Errore nell\'eliminazione della squadra'
    setTimeout(() => errorMsg.value = '', 4000)
  }
}

// Calendar
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

const handleStartManualCalendar = () => {
  if (competition.value) {
    competition.value.calendarMode = 'manual'
  }
}

// Match results - local scores for editing
const localScores = ref<Record<number, { score1: number | null; score2: number | null }>>({})

const getScores = (matchId: number, defaultScore1: number | null, defaultScore2: number | null) => {
  if (!localScores.value[matchId]) {
    localScores.value[matchId] = { score1: defaultScore1, score2: defaultScore2 }
  }
  return localScores.value[matchId]
}

const handleSaveResult = async (matchId: number) => {
  const scores = localScores.value[matchId]
  if (!scores) return
  errorMsg.value = ''
  try {
    await $fetch(`/api/matches/${matchId}`, { method: 'PUT', body: { score1: scores.score1, score2: scores.score2 } })
    await refresh()
  } catch (e: any) {
    errorMsg.value = e.data?.statusMessage || 'Errore salvataggio risultato'
    setTimeout(() => errorMsg.value = '', 4000)
  }
}

// Matches grouped by matchday
const matchesByDay = computed(() => {
  const matches = competition.value?.matches || []
  const grouped: Record<number, typeof matches> = {}
  for (const m of matches) {
    if (!grouped[m.matchday]) grouped[m.matchday] = []
    grouped[m.matchday]!.push(m)
  }
  return grouped
})

const teamName = (teamId: number) => {
  return competition.value?.teams.find(t => t.id === teamId)?.name || '?'
}

const teamPlayers = (teamId: number) => {
  const team = competition.value?.teams.find(t => t.id === teamId)
  if (!team) return ''
  return `${team.player1.name} ${team.player1.surname} & ${team.player2.name} ${team.player2.surname}`
}

// Standings
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

// Match management
const editingMatchId = ref<number | null>(null)
const editMatch = ref({ team1Id: 0, team2Id: 0 })

// Standings mobile expand
const expandedStandingId = ref<number | null>(null)
const toggleStanding = (teamId: number) => {
  expandedStandingId.value = expandedStandingId.value === teamId ? null : teamId
}

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
</script>

<template>
  <div class="space-y-10">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-4">
        <NuxtLink to="/tornei" class="btn btn-ghost btn-circle rounded-2xl">
          <Icon name="lucide:arrow-left" class="w-5 h-5" />
        </NuxtLink>
        <div>
          <h1 class="text-4xl font-black italic tracking-tighter">{{ competition?.name }}</h1>
          <p class="text-xs font-bold opacity-40 uppercase tracking-[0.3em]">Dettaglio Torneo</p>
        </div>
      </div>
      <span class="badge badge-primary badge-lg font-black tracking-widest">{{ competition?.winPoints }} PV</span>
    </div>

    <!-- Error Alert -->
    <div v-if="errorMsg" class="alert alert-error shadow-lg rounded-2xl">
      <Icon name="lucide:alert-circle" class="w-5 h-5" />
      <span class="font-bold">{{ errorMsg }}</span>
    </div>

    <!-- Classifica Section -->
    <div v-if="hasCalendar" class="glass-card rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden group">
      <div class="absolute top-0 right-0 p-12 -mr-12 -mt-12 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700"></div>
      
      <h2 class="text-lg md:text-xl font-black uppercase tracking-[0.2em] bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4 md:mb-6 flex items-center gap-3">
        <div class="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Icon name="lucide:trophy" class="w-4 h-4 md:w-5 md:h-5 text-primary" />
        </div>
        Classifica Generale
      </h2>

      <table class="table table-sm md:table-md w-full">
        <thead>
          <tr class="text-[9px] md:text-[10px] font-black uppercase tracking-wider text-center opacity-40 border-none">
            <th class="text-left pl-3 md:pl-4">#</th>
            <th class="text-left">Squadra</th>
            <th class="hidden md:table-cell">G</th>
            <th class="hidden md:table-cell">V</th>
            <th class="hidden md:table-cell">N</th>
            <th class="hidden md:table-cell">P</th>
            <th class="hidden lg:table-cell">GF</th>
            <th class="hidden lg:table-cell">GS</th>
            <th class="hidden md:table-cell">DR</th>
            <th class="pr-3 md:pr-4">PT</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(row, idx) in standings" :key="row.team.id">
            <tr
              class="group/row transition-all duration-300 hover:bg-base-200 md:cursor-default cursor-pointer"
              @click="toggleStanding(row.team.id)">
              <td class="pl-3 md:pl-4 font-black opacity-30 text-sm">
                {{ idx + 1 }}
              </td>
              <td class="py-2 md:py-3">
                <div class="flex items-center gap-2 md:gap-3">
                  <div class="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-black text-primary text-sm md:text-base shrink-0">
                    {{ row.team.name.charAt(0) }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="font-black text-sm md:text-base tracking-tight group-hover/row:text-primary transition-colors truncate">
                      {{ row.team.name }}
                    </div>
                    <div class="text-[9px] md:text-[10px] font-bold uppercase tracking-wider opacity-30 truncate">
                      {{ row.team.player1.name }} & {{ row.team.player2.name }}
                    </div>
                  </div>
                  <Icon
                    name="lucide:chevron-down"
                    class="w-4 h-4 opacity-30 transition-transform duration-200 md:hidden shrink-0"
                    :class="{ 'rotate-180': expandedStandingId === row.team.id }" />
                </div>
              </td>
              <td class="hidden md:table-cell text-center font-bold opacity-60 text-sm">{{ row.played }}</td>
              <td class="hidden md:table-cell text-center font-bold text-success/80 text-sm">{{ row.won }}</td>
              <td class="hidden md:table-cell text-center font-bold opacity-40 text-sm">{{ row.drawn }}</td>
              <td class="hidden md:table-cell text-center font-bold text-error/80 text-sm">{{ row.lost }}</td>
              <td class="hidden lg:table-cell text-center font-medium opacity-60 text-sm">{{ row.gf }}</td>
              <td class="hidden lg:table-cell text-center font-medium opacity-60 text-sm">{{ row.ga }}</td>
              <td class="hidden md:table-cell text-center font-black text-sm" :class="row.gd >= 0 ? 'text-success' : 'text-error'">
                {{ row.gd > 0 ? '+' : '' }}{{ row.gd }}
              </td>
              <td class="pr-3 md:pr-4 text-center">
                <div class="bg-primary/10 group-hover/row:bg-primary text-primary group-hover/row:text-primary-content font-black text-base md:text-lg py-1 px-3 rounded-lg transition-all inline-block min-w-[2.5rem]">
                  {{ row.points }}
                </div>
              </td>
            </tr>
            <!-- Mobile expanded detail row -->
            <tr v-if="expandedStandingId === row.team.id" class="md:hidden">
              <td :colspan="3" class="px-3 pb-3 pt-0">
                <div class="grid grid-cols-4 gap-2 bg-base-200 rounded-xl p-3 text-center">
                  <div>
                    <div class="text-[9px] font-bold uppercase tracking-wider opacity-40">G</div>
                    <div class="font-bold text-sm">{{ row.played }}</div>
                  </div>
                  <div>
                    <div class="text-[9px] font-bold uppercase tracking-wider opacity-40">V</div>
                    <div class="font-bold text-sm text-success">{{ row.won }}</div>
                  </div>
                  <div>
                    <div class="text-[9px] font-bold uppercase tracking-wider opacity-40">N</div>
                    <div class="font-bold text-sm">{{ row.drawn }}</div>
                  </div>
                  <div>
                    <div class="text-[9px] font-bold uppercase tracking-wider opacity-40">P</div>
                    <div class="font-bold text-sm text-error">{{ row.lost }}</div>
                  </div>
                  <div>
                    <div class="text-[9px] font-bold uppercase tracking-wider opacity-40">GF</div>
                    <div class="font-bold text-sm">{{ row.gf }}</div>
                  </div>
                  <div>
                    <div class="text-[9px] font-bold uppercase tracking-wider opacity-40">GS</div>
                    <div class="font-bold text-sm">{{ row.ga }}</div>
                  </div>
                  <div class="col-span-2">
                    <div class="text-[9px] font-bold uppercase tracking-wider opacity-40">Diff. Reti</div>
                    <div class="font-black text-sm" :class="row.gd >= 0 ? 'text-success' : 'text-error'">
                      {{ row.gd > 0 ? '+' : '' }}{{ row.gd }}
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Calendar Section -->
    <div class="glass-card rounded-[2rem] p-8">
      <h2 class="text-lg font-black uppercase tracking-widest opacity-60 mb-6">
        <Icon name="lucide:calendar" class="inline w-5 h-5 mr-2" />Calendario
      </h2>

      <!-- Mode Selection (no matches yet, no mode chosen) -->
      <div v-if="!hasCalendar && !competition?.calendarMode && canCreate" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <!-- Manual calendar form -->
      <div v-if="competition?.calendarMode === 'manual' && canCreate" class="space-y-4 mb-6">
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
      </div>

      <!-- Match Days -->
      <div v-if="hasCalendar" class="space-y-6">
        <div v-for="(dayMatches, day) in matchesByDay" :key="day">
          <h3 class="text-sm font-black uppercase tracking-[0.3em] opacity-40 mb-3">Giornata {{ day }}</h3>
          <div class="space-y-2">
            <div v-for="match in dayMatches" :key="match.id"
              class="flex items-center gap-3 bg-base-200 rounded-xl p-4 flex-wrap">

              <template v-if="editingMatchId !== match.id">
                <span class="font-black flex-1 text-right min-w-[100px]" :title="teamPlayers(match.team1Id)">
                  {{ teamName(match.team1Id) }}
                </span>
                <!-- Editable scores (logged in) -->
                <template v-if="canEdit">
                  <div class="flex items-center gap-2">
                    <input type="number" min="0"
                      class="input input-bordered input-sm rounded-lg w-16 text-center font-black"
                      :value="getScores(match.id, match.score1, match.score2).score1"
                      @input="localScores[match.id] = { ...getScores(match.id, match.score1, match.score2), score1: ($event.target as HTMLInputElement).value === '' ? null : Number(($event.target as HTMLInputElement).value) }" />
                    <span class="font-black opacity-30">vs</span>
                    <input type="number" min="0"
                      class="input input-bordered input-sm rounded-lg w-16 text-center font-black"
                      :value="getScores(match.id, match.score1, match.score2).score2"
                      @input="localScores[match.id] = { ...getScores(match.id, match.score1, match.score2), score2: ($event.target as HTMLInputElement).value === '' ? null : Number(($event.target as HTMLInputElement).value) }" />
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
                </template>
                <!-- Read-only scores (guest) -->
                <template v-else>
                  <div class="flex items-center gap-2">
                    <span class="font-black text-lg w-16 text-center">{{ match.score1 ?? '-' }}</span>
                    <span class="font-black opacity-30">vs</span>
                    <span class="font-black text-lg w-16 text-center">{{ match.score2 ?? '-' }}</span>
                  </div>
                  <span class="font-black flex-1 min-w-[100px]" :title="teamPlayers(match.team2Id)">
                    {{ teamName(match.team2Id) }}
                  </span>
                </template>
                <span v-if="match.state === 'played'" class="badge badge-success badge-xs font-bold">GIOCATA</span>
              </template>

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
    </div>

    <!-- Teams Section -->
    <div class="glass-card rounded-[2rem] p-8">
      <h2 class="text-lg font-black uppercase tracking-widest opacity-60 mb-6">
        <Icon name="lucide:users" class="inline w-5 h-5 mr-2" />Squadre ({{ competition?.teams?.length || 0 }})
      </h2>

      <!-- Add Team Form (only if no calendar yet) -->
      <form v-if="!hasCalendar && canCreate" @submit.prevent="handleAddTeam" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <input v-model="newTeam.name" type="text" placeholder="Nome squadra" class="input input-bordered rounded-xl" required />
        <select v-model.number="newTeam.player1Id" class="select select-bordered rounded-xl" required>
          <option :value="0" disabled>Giocatore 1</option>
          <option v-for="p in availablePlayers" :key="p.id" :value="p.id">{{ p.name }} {{ p.surname }}</option>
        </select>
        <select v-model.number="newTeam.player2Id" class="select select-bordered rounded-xl" required>
          <option :value="0" disabled>Giocatore 2</option>
          <option v-for="p in availablePlayers" :key="p.id" :value="p.id">{{ p.name }} {{ p.surname }}</option>
        </select>
        <button type="submit" class="btn btn-primary rounded-xl font-black tracking-widest" :disabled="isAddingTeam">
          <span v-if="isAddingTeam" class="loading loading-spinner loading-sm"></span>
          AGGIUNGI
        </button>
      </form>

      <!-- Teams List -->
      <div class="space-y-2">
        <div v-for="team in competition?.teams" :key="team.id"
          class="flex items-center justify-between bg-base-200 rounded-xl p-4">
          <div>
            <span class="font-black text-lg">{{ team.name }}</span>
            <span class="ml-3 text-sm opacity-50">{{ team.player1.name }} {{ team.player1.surname }} & {{ team.player2.name }} {{ team.player2.surname }}</span>
          </div>
          <button v-if="!hasCalendar && canDelete" @click="handleDeleteTeam(team.id)" class="btn btn-ghost btn-sm text-error rounded-lg">
            <Icon name="lucide:trash-2" class="w-4 h-4" />
          </button>
        </div>
        <div v-if="!competition?.teams?.length" class="text-center opacity-40 py-4 font-bold">
          Nessuna squadra inserita
        </div>
      </div>
    </div>
  </div>
</template>
