<script setup lang="ts">
import { buildFreeMatchStats } from '~/utils/free-match-stats'
import type { FreeMatchDetail, Player } from '~/types'

type MatchFormState = {
  team1Player1Id: number
  team1Player2Id: number
  team2Player1Id: number
  team2Player2Id: number
  score1: number | null
  score2: number | null
}

const EMPTY_MATCH_FORM: MatchFormState = {
  team1Player1Id: 0,
  team1Player2Id: 0,
  team2Player1Id: 0,
  team2Player2Id: 0,
  score1: null,
  score2: null,
}

const MATCH_FIELDS = [
  'team1Player1Id',
  'team1Player2Id',
  'team2Player1Id',
  'team2Player2Id',
] as const

type MatchField = typeof MATCH_FIELDS[number]

const { canCreate, canEdit } = usePermissions()

const [
  { data: freeMatches, refresh, pending },
  { data: allPlayers },
] = await Promise.all([
  useFetch<FreeMatchDetail[]>('/api/free-matches'),
  useFetch<Player[]>('/api/players'),
])

const isSubmitting = ref(false)
const editingMatchId = ref<number | null>(null)
const historyQuery = ref('')
const currentPage = ref(1)
const selectedStatsPlayerId = ref<number | null>(null)
const errorMsg = ref('')
const successMsg = ref('')
const isRefreshing = ref(false)

const newMatch = ref<MatchFormState>({ ...EMPTY_MATCH_FORM })
const editMatch = ref<MatchFormState>({ ...EMPTY_MATCH_FORM })

const matchRows = computed(() => freeMatches.value || [])
const players = computed(() => allPlayers.value || [])
const activePlayers = computed(() => players.value.filter((player) => !player.disabled))

const playerLabel = (player: Player) => player.nickname || `${player.name} ${player.surname}`

const playerFullLabel = (player: Player) => {
  const nickname = player.nickname ? ` (${player.nickname})` : ''
  return `${player.name} ${player.surname}${nickname}`
}

const pairLabel = (player1: Player, player2: Player) => `${playerLabel(player1)} & ${playerLabel(player2)}`
const pairFullLabel = (player1: Player, player2: Player) => `${playerFullLabel(player1)} & ${playerFullLabel(player2)}`

const formatDateTime = (value: string | Date) => new Date(value).toLocaleString('it-IT', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const formatTopPlayers = (selectedPlayers: Player[]) => {
  if (!selectedPlayers.length) {
    return '-'
  }

  return selectedPlayers.map((player) => playerLabel(player)).join(', ')
}

const activePlayersForField = (form: MatchFormState, field: MatchField) => {
  const selectedElsewhere = new Set(
    MATCH_FIELDS
      .filter((key) => key !== field)
      .map((key) => form[key])
      .filter((value) => value > 0),
  )

  return activePlayers.value.filter((player) => !selectedElsewhere.has(player.id))
}

const buildSearchText = (match: FreeMatchDetail) => {
  return [
    pairLabel(match.team1Player1, match.team1Player2),
    pairFullLabel(match.team1Player1, match.team1Player2),
    pairLabel(match.team2Player1, match.team2Player2),
    pairFullLabel(match.team2Player1, match.team2Player2),
    `${match.score1}`,
    `${match.score2}`,
    `${match.score1}-${match.score2}`,
    formatDateTime(match.createdAt),
  ].join(' ').toLowerCase()
}

const filteredMatches = computed(() => {
  const query = historyQuery.value.trim().toLowerCase()

  if (!query) {
    return matchRows.value
  }

  return matchRows.value.filter((match) => buildSearchText(match).includes(query))
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredMatches.value.length / 10)))
const paginatedMatches = computed(() => filteredMatches.value.slice((currentPage.value - 1) * 10, currentPage.value * 10))

watch(historyQuery, () => {
  currentPage.value = 1
})

watch(totalPages, (value) => {
  if (currentPage.value > value) {
    currentPage.value = value
  }
})

const playersInMatches = computed(() => {
  const uniquePlayers = new Map<number, Player>()

  for (const match of matchRows.value) {
    for (const player of [match.team1Player1, match.team1Player2, match.team2Player1, match.team2Player2]) {
      uniquePlayers.set(player.id, player)
    }
  }

  return [...uniquePlayers.values()].sort((a, b) => playerLabel(a).localeCompare(playerLabel(b), 'it'))
})

const statsData = computed(() => buildFreeMatchStats(matchRows.value))
const playerStatsRows = computed(() => {
  if (!selectedStatsPlayerId.value) {
    return statsData.value.playerStats
  }

  return statsData.value.playerStats.filter((row) => row.player.id === selectedStatsPlayerId.value)
})
const matchesCountLabel = computed(() => `${matchRows.value.length} ${matchRows.value.length === 1 ? 'PARTITA' : 'PARTITE'}`)

const handleRefresh = async (silent = false) => {
  if (!silent) {
    isRefreshing.value = true
  }
  await refresh()
  if (!silent) {
    isRefreshing.value = false
  }
}

const resetMessages = () => {
  errorMsg.value = ''
  successMsg.value = ''
}

const resetNewMatchForm = () => {
  newMatch.value = { ...EMPTY_MATCH_FORM }
}

const populateEditForm = (match: FreeMatchDetail) => {
  editMatch.value = {
    team1Player1Id: match.team1Player1Id,
    team1Player2Id: match.team1Player2Id,
    team2Player1Id: match.team2Player1Id,
    team2Player2Id: match.team2Player2Id,
    score1: match.score1,
    score2: match.score2,
  }
}

const normalizeFormPayload = (form: MatchFormState) => ({
  team1Player1Id: form.team1Player1Id,
  team1Player2Id: form.team1Player2Id,
  team2Player1Id: form.team2Player1Id,
  team2Player2Id: form.team2Player2Id,
  score1: Number(form.score1),
  score2: Number(form.score2),
})

const validateClientForm = (form: MatchFormState) => {
  const values = MATCH_FIELDS.map((field) => form[field])
  if (values.some((value) => !value)) {
    return 'Seleziona tutti e 4 i giocatori'
  }

  if (new Set(values).size !== values.length) {
    return 'I 4 giocatori devono essere tutti diversi'
  }

  if (form.score1 === null || form.score2 === null || form.score1 < 0 || form.score2 < 0) {
    return 'Inserisci due punteggi validi'
  }

  return ''
}

const handleAddMatch = async () => {
  if (!canCreate.value) {
    return
  }

  resetMessages()
  const validationError = validateClientForm(newMatch.value)
  if (validationError) {
    errorMsg.value = validationError
    return
  }

  isSubmitting.value = true
  try {
    await $fetch('/api/free-matches', {
      method: 'POST',
      body: normalizeFormPayload(newMatch.value),
    })
    resetNewMatchForm()
    successMsg.value = 'Partita salvata'
    await handleRefresh(true)
  } catch (error: any) {
    errorMsg.value = error.data?.message || 'Errore nel salvataggio della partita'
  } finally {
    isSubmitting.value = false
  }
}

const startEdit = (match: FreeMatchDetail) => {
  resetMessages()
  editingMatchId.value = match.id
  populateEditForm(match)
}

const cancelEdit = () => {
  editingMatchId.value = null
}

const handleSaveEdit = async (matchId: number) => {
  if (!canEdit.value) {
    return
  }

  resetMessages()
  const validationError = validateClientForm(editMatch.value)
  if (validationError) {
    errorMsg.value = validationError
    return
  }

  isSubmitting.value = true
  try {
    await $fetch(`/api/free-matches/${matchId}`, {
      method: 'PUT',
      body: normalizeFormPayload(editMatch.value),
    })
    editingMatchId.value = null
    successMsg.value = 'Partita aggiornata'
    await handleRefresh(true)
  } catch (error: any) {
    errorMsg.value = error.data?.message || 'Errore durante la modifica della partita'
  } finally {
    isSubmitting.value = false
  }
}

const handleDeleteMatch = async (matchId: number) => {
  if (!canEdit.value) {
    return
  }

  if (!confirm('Vuoi eliminare questa partita?')) {
    return
  }

  resetMessages()
  isSubmitting.value = true
  try {
    await $fetch(`/api/free-matches/${matchId}`, { method: 'DELETE' })
    if (editingMatchId.value === matchId) {
      editingMatchId.value = null
    }
    successMsg.value = 'Partita eliminata'
    await handleRefresh(true)
  } catch (error: any) {
    errorMsg.value = error.data?.message || 'Errore durante l\'eliminazione della partita'
  } finally {
    isSubmitting.value = false
  }
}

const ws = ref<WebSocket | null>(null)
let wsReconnectTimer: ReturnType<typeof setTimeout>

const connectWs = () => {
  if (!import.meta.client) return

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${protocol}//${window.location.host}/ws`
  const socket = new WebSocket(wsUrl)

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.type === 'free_matches_update') {
        handleRefresh(true)
      }
    } catch (error) {
      console.error('Failed to parse WS message', error)
    }
  }

  socket.onclose = () => {
    clearTimeout(wsReconnectTimer)
    wsReconnectTimer = setTimeout(connectWs, 3000)
  }

  ws.value = socket
}

onMounted(() => {
  connectWs()
})

onUnmounted(() => {
  clearTimeout(wsReconnectTimer)
  ws.value?.close()
})
</script>

<template>
  <div class="space-y-10">
    <BasePageHeader title="Partite Libere" />

    <div class="flex justify-end">
      <div class="flex items-center gap-2 shrink-0">
        <button @click="handleRefresh()" class="btn btn-ghost btn-circle btn-sm sm:btn-md rounded-2xl" :disabled="pending || isSubmitting || isRefreshing" title="Aggiorna dati">
          <Icon name="lucide:refresh-cw" class="w-4 h-4 sm:w-5 sm:h-5" :class="{ 'animate-spin': pending || isRefreshing }" />
        </button>
        <span class="badge badge-primary badge-sm sm:badge-lg font-black tracking-widest">{{ matchesCountLabel }}</span>
      </div>
    </div>

    <div v-if="errorMsg" class="alert alert-error shadow-lg rounded-2xl">
      <Icon name="lucide:alert-circle" class="w-5 h-5" />
      <span class="font-bold">{{ errorMsg }}</span>
    </div>

    <div v-if="successMsg" class="alert alert-success shadow-lg rounded-2xl">
      <Icon name="lucide:check-circle-2" class="w-5 h-5" />
      <span class="font-bold">{{ successMsg }}</span>
    </div>

    <div class="glass-card rounded-[2rem] p-4 sm:p-6 md:p-8 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 class="text-base sm:text-lg font-black uppercase tracking-widest opacity-60">
          <Icon name="lucide:plus-circle" class="inline w-5 h-5 mr-2" />Inserisci Partita
        </h2>
        <span class="badge badge-secondary font-black tracking-widest text-[10px] sm:text-xs px-4 py-3">2 VS 2</span>
      </div>

      <div v-if="!canCreate" class="alert rounded-2xl bg-base-200 border border-base-content/10">
        <Icon name="lucide:lock" class="w-5 h-5" />
        <span class="font-bold">I dati sono pubblici, ma solo gli utenti loggati possono aggiungere, modificare o eliminare partite.</span>
      </div>

      <form @submit.prevent="handleAddMatch" class="space-y-5">
        <div class="grid grid-cols-1 xl:grid-cols-[1fr_200px_1fr_auto] gap-4 items-start">
          <div class="bg-base-200 rounded-[1.5rem] p-4 sm:p-5 space-y-4">
            <div class="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Coppia 1</div>
            <select v-model.number="newMatch.team1Player1Id" class="select rounded-xl w-full" :disabled="!canCreate || isSubmitting">
              <option :value="0" disabled>Giocatore 1</option>
              <option v-for="player in activePlayersForField(newMatch, 'team1Player1Id')" :key="`new-t1p1-${player.id}`" :value="player.id">
                {{ playerFullLabel(player) }}
              </option>
            </select>
            <select v-model.number="newMatch.team1Player2Id" class="select rounded-xl w-full" :disabled="!canCreate || isSubmitting">
              <option :value="0" disabled>Giocatore 2</option>
              <option v-for="player in activePlayersForField(newMatch, 'team1Player2Id')" :key="`new-t1p2-${player.id}`" :value="player.id">
                {{ playerFullLabel(player) }}
              </option>
            </select>
          </div>

          <div class="bg-base-200 rounded-[1.5rem] p-4 sm:p-5 space-y-4">
            <div class="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Risultato</div>
            <div class="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
              <input v-model.number="newMatch.score1" type="number" min="0" class="input rounded-xl text-center font-black" placeholder="0" :disabled="!canCreate || isSubmitting" />
              <span class="font-black opacity-30 text-xs">VS</span>
              <input v-model.number="newMatch.score2" type="number" min="0" class="input rounded-xl text-center font-black" placeholder="0" :disabled="!canCreate || isSubmitting" />
            </div>
          </div>

          <div class="bg-base-200 rounded-[1.5rem] p-4 sm:p-5 space-y-4">
            <div class="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Coppia 2</div>
            <select v-model.number="newMatch.team2Player1Id" class="select rounded-xl w-full" :disabled="!canCreate || isSubmitting">
              <option :value="0" disabled>Giocatore 3</option>
              <option v-for="player in activePlayersForField(newMatch, 'team2Player1Id')" :key="`new-t2p1-${player.id}`" :value="player.id">
                {{ playerFullLabel(player) }}
              </option>
            </select>
            <select v-model.number="newMatch.team2Player2Id" class="select rounded-xl w-full" :disabled="!canCreate || isSubmitting">
              <option :value="0" disabled>Giocatore 4</option>
              <option v-for="player in activePlayersForField(newMatch, 'team2Player2Id')" :key="`new-t2p2-${player.id}`" :value="player.id">
                {{ playerFullLabel(player) }}
              </option>
            </select>
          </div>

          <button type="submit" class="btn btn-primary rounded-2xl font-black tracking-widest h-14 xl:self-stretch" :disabled="!canCreate || isSubmitting">
            <span v-if="isSubmitting" class="loading loading-spinner loading-sm"></span>
            <span v-else>SALVA</span>
          </button>
        </div>
      </form>
    </div>

    <div class="glass-card rounded-[2rem] p-4 sm:p-6 md:p-8 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 class="text-base sm:text-lg font-black uppercase tracking-widest opacity-60">
          <Icon name="lucide:history" class="inline w-5 h-5 mr-2" />Storico Partite
        </h2>
        <div class="relative w-full sm:w-80">
          <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
          <input v-model="historyQuery" type="text" placeholder="Cerca giocatore, coppia, punteggio o data..." class="input input-sm rounded-xl w-full pl-9" />
        </div>
      </div>

      <template v-if="pending">
        <div class="space-y-3">
          <div class="skeleton h-16 rounded-2xl"></div>
          <div class="skeleton h-16 rounded-2xl"></div>
          <div class="skeleton h-16 rounded-2xl"></div>
        </div>
      </template>

      <template v-else>
        <div v-if="!matchRows.length" class="text-center opacity-40 py-8 font-bold">
          Nessuna partita registrata.
        </div>

        <div v-else-if="!filteredMatches.length" class="text-center opacity-40 py-8 font-bold">
          Nessun risultato per "{{ historyQuery }}"
        </div>

        <template v-else>
          <div class="hidden md:block overflow-x-auto">
            <table class="table table-md w-full">
              <thead>
                <tr class="text-[10px] font-black uppercase tracking-widest opacity-40 border-none">
                  <th class="pl-4">Data</th>
                  <th>Coppia 1</th>
                  <th class="text-center">Risultato</th>
                  <th>Coppia 2</th>
                  <th v-if="canEdit" class="text-right pr-4">Azioni</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="match in paginatedMatches" :key="`desktop-${match.id}`" class="hover:bg-base-200 transition-all align-top">
                  <template v-if="editingMatchId !== match.id">
                    <td class="pl-4 font-bold text-xs whitespace-nowrap">{{ formatDateTime(match.createdAt) }}</td>
                    <td>
                      <div class="font-black">{{ pairLabel(match.team1Player1, match.team1Player2) }}</div>
                      <div class="text-xs opacity-50">{{ pairFullLabel(match.team1Player1, match.team1Player2) }}</div>
                    </td>
                    <td class="text-center">
                      <div class="inline-flex items-center gap-2 bg-base-200 rounded-xl px-4 py-2 font-black text-lg">
                        <span>{{ match.score1 }}</span>
                        <span class="opacity-30 text-xs">VS</span>
                        <span>{{ match.score2 }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="font-black">{{ pairLabel(match.team2Player1, match.team2Player2) }}</div>
                      <div class="text-xs opacity-50">{{ pairFullLabel(match.team2Player1, match.team2Player2) }}</div>
                    </td>
                    <td v-if="canEdit" class="pr-4">
                      <div class="flex items-center justify-end gap-2">
                        <button @click="startEdit(match)" class="btn btn-ghost btn-sm btn-square rounded-lg">
                          <Icon name="lucide:pencil" class="w-4 h-4" />
                        </button>
                        <button @click="handleDeleteMatch(match.id)" class="btn btn-ghost btn-sm btn-square rounded-lg text-error" :disabled="isSubmitting">
                          <Icon name="lucide:trash-2" class="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </template>

                  <template v-else>
                    <td class="pl-4">
                      <div class="text-xs font-black uppercase tracking-widest opacity-40">{{ formatDateTime(match.createdAt) }}</div>
                    </td>
                    <td>
                      <div class="space-y-2">
                        <select v-model.number="editMatch.team1Player1Id" class="select select-sm rounded-xl w-full">
                          <option :value="0" disabled>Giocatore 1</option>
                          <option v-for="player in activePlayersForField(editMatch, 'team1Player1Id')" :key="`edit-d-t1p1-${player.id}`" :value="player.id">
                            {{ playerFullLabel(player) }}
                          </option>
                        </select>
                        <select v-model.number="editMatch.team1Player2Id" class="select select-sm rounded-xl w-full">
                          <option :value="0" disabled>Giocatore 2</option>
                          <option v-for="player in activePlayersForField(editMatch, 'team1Player2Id')" :key="`edit-d-t1p2-${player.id}`" :value="player.id">
                            {{ playerFullLabel(player) }}
                          </option>
                        </select>
                      </div>
                    </td>
                    <td>
                      <div class="grid grid-cols-[1fr_auto_1fr] gap-2 items-center max-w-[180px] mx-auto">
                        <input v-model.number="editMatch.score1" type="number" min="0" class="input input-sm rounded-xl text-center font-black" />
                        <span class="font-black opacity-30 text-xs">VS</span>
                        <input v-model.number="editMatch.score2" type="number" min="0" class="input input-sm rounded-xl text-center font-black" />
                      </div>
                    </td>
                    <td>
                      <div class="space-y-2">
                        <select v-model.number="editMatch.team2Player1Id" class="select select-sm rounded-xl w-full">
                          <option :value="0" disabled>Giocatore 3</option>
                          <option v-for="player in activePlayersForField(editMatch, 'team2Player1Id')" :key="`edit-d-t2p1-${player.id}`" :value="player.id">
                            {{ playerFullLabel(player) }}
                          </option>
                        </select>
                        <select v-model.number="editMatch.team2Player2Id" class="select select-sm rounded-xl w-full">
                          <option :value="0" disabled>Giocatore 4</option>
                          <option v-for="player in activePlayersForField(editMatch, 'team2Player2Id')" :key="`edit-d-t2p2-${player.id}`" :value="player.id">
                            {{ playerFullLabel(player) }}
                          </option>
                        </select>
                      </div>
                    </td>
                    <td class="pr-4">
                      <div class="flex items-center justify-end gap-2">
                        <button @click="handleSaveEdit(match.id)" class="btn btn-success btn-sm rounded-xl font-bold" :disabled="isSubmitting">
                          <Icon name="lucide:check" class="w-4 h-4" />
                        </button>
                        <button @click="cancelEdit" class="btn btn-ghost btn-sm rounded-xl" :disabled="isSubmitting">
                          <Icon name="lucide:x" class="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="md:hidden space-y-3">
            <div v-for="match in paginatedMatches" :key="`mobile-${match.id}`" class="bg-base-200 rounded-2xl p-4 space-y-4">
              <template v-if="editingMatchId !== match.id">
                <div class="flex items-center justify-between gap-3">
                  <div class="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">{{ formatDateTime(match.createdAt) }}</div>
                  <div class="bg-base-100 rounded-xl px-3 py-1 font-black">{{ match.score1 }} <span class="opacity-30 text-xs">VS</span> {{ match.score2 }}</div>
                </div>
                <div class="space-y-3">
                  <div>
                    <div class="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-1">Coppia 1</div>
                    <div class="font-black">{{ pairLabel(match.team1Player1, match.team1Player2) }}</div>
                    <div class="text-xs opacity-50">{{ pairFullLabel(match.team1Player1, match.team1Player2) }}</div>
                  </div>
                  <div>
                    <div class="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-1">Coppia 2</div>
                    <div class="font-black">{{ pairLabel(match.team2Player1, match.team2Player2) }}</div>
                    <div class="text-xs opacity-50">{{ pairFullLabel(match.team2Player1, match.team2Player2) }}</div>
                  </div>
                </div>
                <div v-if="canEdit" class="flex gap-2">
                  <button @click="startEdit(match)" class="btn btn-primary btn-sm rounded-xl flex-1 font-black tracking-widest">
                    Modifica
                  </button>
                  <button @click="handleDeleteMatch(match.id)" class="btn btn-ghost btn-sm rounded-xl text-error" :disabled="isSubmitting">
                    <Icon name="lucide:trash-2" class="w-4 h-4" />
                  </button>
                </div>
              </template>

              <template v-else>
                <div class="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">{{ formatDateTime(match.createdAt) }}</div>
                <div class="space-y-3">
                  <select v-model.number="editMatch.team1Player1Id" class="select select-sm rounded-xl w-full">
                    <option :value="0" disabled>Giocatore 1</option>
                    <option v-for="player in activePlayersForField(editMatch, 'team1Player1Id')" :key="`edit-m-t1p1-${player.id}`" :value="player.id">
                      {{ playerFullLabel(player) }}
                    </option>
                  </select>
                  <select v-model.number="editMatch.team1Player2Id" class="select select-sm rounded-xl w-full">
                    <option :value="0" disabled>Giocatore 2</option>
                    <option v-for="player in activePlayersForField(editMatch, 'team1Player2Id')" :key="`edit-m-t1p2-${player.id}`" :value="player.id">
                      {{ playerFullLabel(player) }}
                    </option>
                  </select>
                  <div class="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                    <input v-model.number="editMatch.score1" type="number" min="0" class="input input-sm rounded-xl text-center font-black" />
                    <span class="font-black opacity-30 text-xs">VS</span>
                    <input v-model.number="editMatch.score2" type="number" min="0" class="input input-sm rounded-xl text-center font-black" />
                  </div>
                  <select v-model.number="editMatch.team2Player1Id" class="select select-sm rounded-xl w-full">
                    <option :value="0" disabled>Giocatore 3</option>
                    <option v-for="player in activePlayersForField(editMatch, 'team2Player1Id')" :key="`edit-m-t2p1-${player.id}`" :value="player.id">
                      {{ playerFullLabel(player) }}
                    </option>
                  </select>
                  <select v-model.number="editMatch.team2Player2Id" class="select select-sm rounded-xl w-full">
                    <option :value="0" disabled>Giocatore 4</option>
                    <option v-for="player in activePlayersForField(editMatch, 'team2Player2Id')" :key="`edit-m-t2p2-${player.id}`" :value="player.id">
                      {{ playerFullLabel(player) }}
                    </option>
                  </select>
                </div>
                <div class="flex gap-2">
                  <button @click="handleSaveEdit(match.id)" class="btn btn-success btn-sm rounded-xl flex-1 font-black tracking-widest" :disabled="isSubmitting">
                    Salva
                  </button>
                  <button @click="cancelEdit" class="btn btn-ghost btn-sm rounded-xl" :disabled="isSubmitting">
                    Annulla
                  </button>
                </div>
              </template>
            </div>
          </div>

          <div v-if="filteredMatches.length > 10" class="flex items-center justify-center gap-3 pt-2">
            <button class="btn btn-ghost btn-sm rounded-xl" :disabled="currentPage === 1" @click="currentPage -= 1">
              <Icon name="lucide:chevron-left" class="w-4 h-4" />
            </button>
            <span class="badge badge-ghost font-black tracking-widest px-4 py-3">Pagina {{ currentPage }} / {{ totalPages }}</span>
            <button class="btn btn-ghost btn-sm rounded-xl" :disabled="currentPage === totalPages" @click="currentPage += 1">
              <Icon name="lucide:chevron-right" class="w-4 h-4" />
            </button>
          </div>
        </template>
      </template>
    </div>

    <div class="glass-card rounded-[2rem] p-4 sm:p-6 md:p-8 space-y-6">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <h2 class="text-base sm:text-lg font-black uppercase tracking-widest opacity-60">
          <Icon name="lucide:bar-chart-3" class="inline w-5 h-5 mr-2" />Statistiche Giocatore
        </h2>
        <div class="w-full lg:w-80">
          <label class="label pb-2">
            <span class="label-text text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Filtro giocatore</span>
          </label>
          <select v-model="selectedStatsPlayerId" class="select rounded-xl w-full">
            <option :value="null">Tutti i giocatori</option>
            <option v-for="player in playersInMatches" :key="`vs-${player.id}`" :value="player.id">
              {{ playerFullLabel(player) }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="!playerStatsRows.length" class="text-center opacity-40 py-8 font-bold">
        Nessuna statistica disponibile per il filtro corrente.
      </div>

      <template v-else>
        <div class="hidden md:block overflow-x-auto">
          <table class="table table-md w-full">
            <thead>
              <tr class="text-[10px] font-black uppercase tracking-widest opacity-40 border-none">
                <th class="pl-4">Giocatore</th>
                <th class="text-center">G</th>
                <th class="text-center">GF</th>
                <th class="text-center">GS</th>
                <th class="text-center">V</th>
                <th class="text-center">P</th>
                <th class="text-center">Rateo V/S</th>
                <th>Battuto di più</th>
                <th class="pr-4">Perso di più</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in playerStatsRows" :key="`stats-${row.player.id}`" class="hover:bg-base-200 transition-all">
                <td class="pl-4">
                  <div class="font-black">{{ playerLabel(row.player) }}</div>
                  <div class="text-xs opacity-50">{{ playerFullLabel(row.player) }}</div>
                </td>
                <td class="text-center font-black">{{ row.matchesPlayed }}</td>
                <td class="text-center font-black text-success">{{ row.goalsFor }}</td>
                <td class="text-center font-black text-error/80">{{ row.goalsAgainst }}</td>
                <td class="text-center font-black">{{ row.wins }}</td>
                <td class="text-center font-black">{{ row.losses }}</td>
                <td class="text-center"><span class="badge badge-ghost font-black">{{ row.winLossRatio }}</span></td>
                <td class="font-medium">{{ formatTopPlayers(row.mostBeatenPlayers) }}</td>
                <td class="pr-4 font-medium">{{ formatTopPlayers(row.mostLossPlayers) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="md:hidden space-y-3">
          <div v-for="row in playerStatsRows" :key="`stats-mobile-${row.player.id}`" class="bg-base-200 rounded-2xl p-4 space-y-4">
            <div>
              <div class="font-black text-lg">{{ playerLabel(row.player) }}</div>
              <div class="text-xs opacity-50">{{ playerFullLabel(row.player) }}</div>
            </div>
            <div class="grid grid-cols-3 gap-3 text-center">
              <div class="bg-base-100 rounded-xl p-3">
                <div class="text-[10px] font-black uppercase tracking-widest opacity-40">G</div>
                <div class="font-black">{{ row.matchesPlayed }}</div>
              </div>
              <div class="bg-base-100 rounded-xl p-3">
                <div class="text-[10px] font-black uppercase tracking-widest opacity-40">GF</div>
                <div class="font-black text-success">{{ row.goalsFor }}</div>
              </div>
              <div class="bg-base-100 rounded-xl p-3">
                <div class="text-[10px] font-black uppercase tracking-widest opacity-40">GS</div>
                <div class="font-black text-error/80">{{ row.goalsAgainst }}</div>
              </div>
              <div class="bg-base-100 rounded-xl p-3">
                <div class="text-[10px] font-black uppercase tracking-widest opacity-40">V</div>
                <div class="font-black">{{ row.wins }}</div>
              </div>
              <div class="bg-base-100 rounded-xl p-3">
                <div class="text-[10px] font-black uppercase tracking-widest opacity-40">P</div>
                <div class="font-black">{{ row.losses }}</div>
              </div>
              <div class="bg-base-100 rounded-xl p-3">
                <div class="text-[10px] font-black uppercase tracking-widest opacity-40">V/S</div>
                <div class="font-black">{{ row.winLossRatio }}</div>
              </div>
            </div>
            <div>
              <div class="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-1">Giocatore battuto più volte</div>
              <div class="font-medium">{{ formatTopPlayers(row.mostBeatenPlayers) }}</div>
            </div>
            <div>
              <div class="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-1">Giocatore contro cui si è perso più volte</div>
              <div class="font-medium">{{ formatTopPlayers(row.mostLossPlayers) }}</div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
