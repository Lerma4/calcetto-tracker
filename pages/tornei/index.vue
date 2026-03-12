<script setup lang="ts">
import type { Competition } from '~/types'

const { data: competitions, refresh } = await useFetch<Competition[]>('/api/competitions')

const { canCreate, canEdit } = usePermissions()

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
    <BasePageHeader title="Hall of Champions" />

    <!-- Add Competition Card -->
    <BaseSectionCard v-if="canCreate" title="Nuovo Torneo" icon="lucide:plus-circle">
      <form @submit.prevent="handleAdd" class="grid grid-cols-1 md:grid-cols-[1fr_120px_auto] gap-4 items-end">
        <div class="form-control w-full">
          <label class="label">
            <span class="label-text text-xs font-bold uppercase tracking-widest opacity-50">Nome torneo</span>
          </label>
          <input v-model="newComp.name" type="text" placeholder="Es. Serie A 2024" class="input input-bordered w-full rounded-xl focus:border-secondary transition-colors" required />
        </div>
        <div class="form-control w-full">
          <label class="label">
            <span class="label-text text-xs font-bold uppercase tracking-widest opacity-50">Punti vittoria</span>
          </label>
          <input v-model.number="newComp.winPoints" type="number" min="1" class="input input-bordered w-full rounded-xl focus:border-secondary transition-colors" required />
        </div>
        <button type="submit" class="btn btn-secondary rounded-xl font-black tracking-widest w-full md:w-auto h-12" :disabled="isAdding">
          <span v-if="isAdding" class="loading loading-spinner loading-sm"></span>
          CREA TORNEO
        </button>
      </form>
    </BaseSectionCard>

    <!-- Active Tournaments -->
    <div class="card bg-base-100 rounded-[3rem] shadow-2xl border-2 border-base-200 overflow-hidden">
         <div class="p-10 border-b border-base-200 bg-base-100 flex items-center justify-between">
            <h2 class="text-3xl font-black uppercase tracking-tighter italic">I Tornei Attivi</h2>
            <div class="badge badge-lg bg-secondary/10 text-secondary border-none font-black text-xs px-6">SCANSIONE LIVE</div>
         </div>
         <div class="card-body p-0">
             <div v-if="competitions && competitions.length > 0" class="overflow-x-auto">
                 <table class="table table-lg w-full">
                    <thead>
                      <tr class="bg-base-200 text-[10px] font-black uppercase tracking-widest opacity-40 border-b border-base-200">
                        <th class="py-6 px-10">Dettagli Torneo</th>
                        <th class="text-center">Regolamento</th>
                        <th class="text-center">Creazione</th>
                        <th class="text-right pr-10">Azione</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="comp in competitions" :key="comp.id" class="hover:bg-base-200 transition-all group">
                         <td class="px-10 py-8">
                            <div class="flex items-center gap-6">
                               <div class="w-16 h-16 rounded-3xl bg-primary bg-opacity-10 text-primary flex items-center justify-center font-black text-2xl shadow-inner transform group-hover:rotate-12 transition-all">
                                  {{ comp.name.charAt(0) }}
                               </div>
                               <div>
                                  <div class="text-2xl font-black tracking-tight group-hover:text-primary transition-all">{{ comp.name }}</div>
                                  <div class="text-[10px] opacity-40 font-bold uppercase tracking-widest">Digital Asset #{{ comp.id }}</div>
                               </div>
                            </div>
                         </td>
                         <td class="text-center">
                            <div class="badge badge-lg border-2 border-secondary/30 text-secondary font-black text-xs py-5 px-6 rounded-2xl">
                               {{ comp.winPoints }} PUNTI / VITTORIA
                            </div>
                         </td>
                         <td class="text-center opacity-40 text-xs font-black uppercase tracking-widest">
                            {{ new Date(comp.createdAt).toLocaleDateString() }}
                         </td>
                         <td class="text-right pr-10">
                            <NuxtLink :to="`/tornei/${comp.id}`" class="btn btn-secondary btn-lg rounded-3xl font-black text-xs tracking-widest px-8 shadow-xl hover:shadow-secondary transition-all transform active:scale-95 uppercase">
                               {{ canEdit ? 'Gestisci ⚡' : 'Visualizza' }}
                            </NuxtLink>
                         </td>
                      </tr>
                    </tbody>
                 </table>
             </div>
             <div v-else class="p-10 text-center opacity-40 font-bold">
                Nessun torneo creato.
             </div>
         </div>
      </div>
  </div>
</template>
