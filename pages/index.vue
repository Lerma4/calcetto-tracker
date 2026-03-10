<script setup lang="ts">
import type { Player, Competition } from '~/types/index'

const [
  { data: players, refresh: refreshPlayers },
  { data: competitions, refresh: refreshCompetitions }
] = await Promise.all([
  useFetch<Player[]>('/api/players'),
  useFetch<Competition[]>('/api/competitions')
])

const isAddingPlayer = ref(false)
const isAddingComp = ref(false)

const handleAddPlayer = async (playerData: Omit<Player, 'id'>) => {
  isAddingPlayer.value = true
  try {
    await $fetch('/api/players', {
      method: 'POST',
      body: playerData
    })
    await refreshPlayers()
  } finally {
    isAddingPlayer.value = false
  }
}

const handleAddCompetition = async (compData: Omit<Competition, 'id' | 'createdAt'>) => {
  isAddingComp.value = true
  try {
    await $fetch('/api/competitions', {
      method: 'POST',
      body: compData
    })
    await refreshCompetitions()
  } finally {
    isAddingComp.value = false
  }
}
</script>

<template>
  <div class="space-y-16">
    <!-- Hero: Data Matrix -->
    <FeatureStatsHero 
      :players-count="players?.length || 0" 
      :competitions-count="competitions?.length || 0" 
    />

    <section class="grid grid-cols-1 lg:grid-cols-12 gap-12">
      <!-- Sidebar: Control Panel -->
      <aside class="lg:col-span-4 space-y-12">
        <FeatureCompetitionForm 
          :loading="isAddingComp" 
          @submit="handleAddCompetition" 
        />
        <FeaturePlayerForm 
          :loading="isAddingPlayer" 
          @submit="handleAddPlayer" 
        />
      </aside>

      <!-- Main View: Roster & Hall -->
      <div class="lg:col-span-8 space-y-16">
        <FeatureCompetitionTable :competitions="competitions" />
        <FeaturePlayerTable :players="players" />
      </div>
    </section>
  </div>
</template>
