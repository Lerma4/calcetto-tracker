<script setup lang="ts">
import type { Player } from '~/types'

const { data: players, refresh } = await useFetch<Player[]>('/api/players')

const newPlayer = ref({ name: '', surname: '', role: 'indifferente', nickname: '' })
const isAdding = ref(false)
const editingPlayer = ref<Player | null>(null)
const editForm = ref({ name: '', surname: '', role: 'indifferente', nickname: '' })
const errorMsg = ref('')

const searchName = ref('')
const searchRole = ref('')

const filteredPlayers = computed(() => {
  if (!players.value) return []
  return players.value.filter(p => {
    const term = searchName.value.toLowerCase()
    const matchesName = !term || p.name.toLowerCase().includes(term) || p.surname.toLowerCase().includes(term) || (p.nickname || '').toLowerCase().includes(term)
    const matchesRole = !searchRole.value || p.role === searchRole.value
    return matchesName && matchesRole
  })
})

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
  const modal = document.getElementById('edit-modal') as HTMLDialogElement
  modal?.showModal()
}

const handleEdit = async () => {
  if (!editingPlayer.value) return
  await $fetch(`/api/players/${editingPlayer.value.id}`, { method: 'PUT', body: editForm.value })
  editingPlayer.value = null
  const modal = document.getElementById('edit-modal') as HTMLDialogElement
  modal?.close()
  await refresh()
}

const handleDelete = async (id: number) => {
  if (!confirm('Eliminare questo atleta?')) return
  errorMsg.value = ''
  try {
    await $fetch(`/api/players/${id}`, { method: 'DELETE' })
    await refresh()
  } catch (e: any) {
    errorMsg.value = e.data?.message || 'Errore durante l\'eliminazione'
    setTimeout(() => errorMsg.value = '', 4000)
  }
}

const handleToggle = async (id: number) => {
  await $fetch(`/api/players/${id}/toggle-disabled`, { method: 'PUT' })
  await refresh()
}
</script>

<template>
  <div class="space-y-10">
    <!-- Header -->
    <BasePageHeader title="Gestione Atleti" />

    <!-- Error Alert -->
    <BaseAlert
      v-if="errorMsg"
      variant="error"
      icon="lucide:alert-circle"
      alert-class="shadow-lg rounded-2xl"
      @close="errorMsg = ''"
    >
      <span class="font-bold">{{ errorMsg }}</span>
    </BaseAlert>

    <!-- Add Player Card -->
    <BaseSectionCard title="Nuovo Atleta" icon="lucide:user-plus">
      <form @submit.prevent="handleAdd" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <input v-model="newPlayer.name" type="text" placeholder="Nome" class="input input rounded-xl" required />
        <input v-model="newPlayer.surname" type="text" placeholder="Cognome" class="input input rounded-xl" required />
        <select v-model="newPlayer.role" class="select select rounded-xl">
          <option value="attaccante">Attaccante</option>
          <option value="portiere">Portiere</option>
          <option value="indifferente">Indifferente</option>
        </select>
        <input v-model="newPlayer.nickname" type="text" placeholder="Nickname (opzionale)" class="input input rounded-xl" />
        <button type="submit" class="btn btn-primary rounded-xl font-black tracking-widest" :disabled="isAdding">
          <span v-if="isAdding" class="loading loading-spinner loading-sm"></span>
          AGGIUNGI
        </button>
      </form>
    </BaseSectionCard>

    <!-- Players Table -->
    <BaseSectionCard title="Roster" icon="lucide:list">
      <template #default>
        <div class="flex flex-col sm:flex-row gap-3 mb-6">
          <div class="relative flex-1">
            <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
            <input v-model="searchName" type="text" placeholder="Cerca per nome, cognome o nickname..." class="input input rounded-xl w-full pl-10" />
          </div>
          <select v-model="searchRole" class="select select rounded-xl">
            <option value="">Tutti i ruoli</option>
            <option value="attaccante">Attaccante</option>
            <option value="portiere">Portiere</option>
            <option value="indifferente">Indifferente</option>
          </select>
        </div>
        <div class="overflow-x-auto -mx-4 sm:mx-0">
        <table class="table table-zebra w-full">
          <thead>
            <tr class="text-xs font-black uppercase tracking-widest opacity-50">
              <th>Nome</th>
              <th>Cognome</th>
              <th>Ruolo</th>
              <th class="hidden sm:table-cell">Nickname</th>
              <th>Stato</th>
              <th class="text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="player in filteredPlayers" :key="player.id" :class="{ 'opacity-40': player.disabled }">
              <td class="font-bold" :class="{ 'line-through': player.disabled }">{{ player.name }}</td>
              <td class="font-bold" :class="{ 'line-through': player.disabled }">{{ player.surname }}</td>
              <td>
                <span class="badge badge-sm font-bold uppercase tracking-wider"
                  :class="{
                    'badge-primary': player.role === 'attaccante',
                    'badge-secondary': player.role === 'portiere',
                    'badge-accent': player.role === 'indifferente'
                  }">
                  {{ player.role }}
                </span>
              </td>
              <td class="opacity-60 hidden sm:table-cell">{{ player.nickname || '—' }}</td>
              <td>
                <span v-if="player.disabled" class="badge badge-error badge-sm font-bold uppercase tracking-wider">DISABILITATO</span>
                <span v-else class="badge badge-success badge-sm font-bold uppercase tracking-wider">ATTIVO</span>
              </td>
              <td class="text-right">
                <div class="flex justify-end gap-1">
                  <button @click="openEdit(player)" class="btn btn-ghost btn-xs rounded-lg" title="Modifica">
                    <Icon name="lucide:pencil" class="w-4 h-4" />
                  </button>
                  <button @click="handleToggle(player.id)" class="btn btn-ghost btn-xs rounded-lg" :title="player.disabled ? 'Abilita' : 'Disabilita'">
                    <Icon v-if="player.disabled" name="lucide:check-circle" class="w-4 h-4 text-success" />
                    <Icon v-else name="lucide:ban" class="w-4 h-4 text-warning" />
                  </button>
                  <button @click="handleDelete(player.id)" class="btn btn-ghost btn-xs rounded-lg text-error" title="Elimina">
                    <Icon name="lucide:trash-2" class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!filteredPlayers.length">
              <td colspan="6" class="text-center opacity-40 py-8 font-bold">{{ players?.length ? 'Nessun risultato' : 'Nessun atleta registrato' }}</td>
            </tr>
          </tbody>
        </table>
        </div>
      </template>
    </BaseSectionCard>

    <!-- Edit Modal -->
    <dialog id="edit-modal" class="modal">
      <div class="modal-box rounded-[2rem]">
        <h3 class="font-black text-lg uppercase tracking-widest mb-6">Modifica Atleta</h3>
        <form @submit.prevent="handleEdit" class="space-y-4">
          <input v-model="editForm.name" type="text" placeholder="Nome" class="input input rounded-xl w-full" required />
          <input v-model="editForm.surname" type="text" placeholder="Cognome" class="input input rounded-xl w-full" required />
          <select v-model="editForm.role" class="select select rounded-xl w-full">
            <option value="attaccante">Attaccante</option>
            <option value="portiere">Portiere</option>
            <option value="indifferente">Indifferente</option>
          </select>
          <input v-model="editForm.nickname" type="text" placeholder="Nickname (opzionale)" class="input input rounded-xl w-full" />
          <div class="modal-action">
            <button type="button" class="btn btn-ghost rounded-xl" onclick="document.getElementById('edit-modal').close()">ANNULLA</button>
            <button type="submit" class="btn btn-primary rounded-xl font-black tracking-widest">SALVA</button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>
