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

<template>
  <div class="space-y-10">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <div class="p-3 bg-secondary rounded-2xl text-secondary-content shadow-lg">
        <Icon name="lucide:sword" class="w-7 h-7" />
      </div>
      <div>
        <h1 class="text-4xl font-black italic tracking-tighter">ARENE</h1>
        <p class="text-xs font-bold opacity-40 uppercase tracking-[0.3em]">Gestione competizioni round-robin</p>
      </div>
    </div>

    <!-- Add Competition Card -->
    <div class="glass-card rounded-[2rem] p-8">
      <h2 class="text-lg font-black uppercase tracking-widest opacity-60 mb-6">
        <Icon name="lucide:plus-circle" class="inline w-5 h-5 mr-2" />Nuova Arena
      </h2>
      <form @submit.prevent="handleAdd" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <input v-model="newComp.name" type="text" placeholder="Nome competizione" class="input input-bordered rounded-xl" required />
        <div class="form-control">
          <label class="label">
            <span class="label-text text-xs font-bold uppercase tracking-widest opacity-50">Punti vittoria</span>
          </label>
          <input v-model.number="newComp.winPoints" type="number" min="1" class="input input-bordered rounded-xl" />
        </div>
        <button type="submit" class="btn btn-secondary rounded-xl font-black tracking-widest self-end" :disabled="isAdding">
          <span v-if="isAdding" class="loading loading-spinner loading-sm"></span>
          CREA ARENA
        </button>
      </form>
    </div>

    <!-- Competitions List -->
    <div class="glass-card rounded-[2rem] p-8">
      <h2 class="text-lg font-black uppercase tracking-widest opacity-60 mb-6">
        <Icon name="lucide:trophy" class="inline w-5 h-5 mr-2" />Competizioni ({{ competitions?.length || 0 }})
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <NuxtLink
          v-for="comp in competitions"
          :key="comp.id"
          :to="`/arene/${comp.id}`"
          class="card bg-base-200 hover:bg-base-300 transition-all rounded-2xl p-6 cursor-pointer group"
        >
          <h3 class="text-xl font-black tracking-tight group-hover:text-primary transition-colors">{{ comp.name }}</h3>
          <div class="flex items-center gap-3 mt-3">
            <span class="badge badge-primary badge-sm font-bold">{{ comp.winPoints }} PV</span>
          </div>
          <div class="text-right mt-4">
            <Icon name="lucide:arrow-right" class="w-5 h-5 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
        </NuxtLink>
      </div>
      <div v-if="!competitions?.length" class="text-center opacity-40 py-8 font-bold">
        Nessuna arena creata
      </div>
    </div>
  </div>
</template>
