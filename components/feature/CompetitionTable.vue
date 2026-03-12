<script setup lang="ts">
import type { Competition } from '~/types'

defineProps<{
  competitions: Competition[] | null
}>()
</script>

<template>
  <div class="card bg-base-100 rounded-[3rem] shadow-2xl border-2 border-base-200 overflow-hidden">
     <div class="p-5 sm:p-8 md:p-10 pb-6 flex items-end justify-between border-b border-base-200 bg-base-100 bg-opacity-50">
       <div>
          <h2 class="text-2xl sm:text-3xl md:text-4xl font-black font-heading tracking-tighter uppercase leading-none">Hall of Arenas</h2>
          <p class="text-[10px] font-black opacity-30 uppercase tracking-[0.4em] mt-3">Sincronizzazione Tornei Real-Time</p>
       </div>
       <div class="badge badge-lg bg-secondary/10 text-secondary border-none font-black text-xs px-4">{{ competitions?.length }} TOTALI</div>
     </div>
     <div class="card-body p-0">
        <div v-if="competitions && competitions.length > 0" class="overflow-x-auto">
            <table class="table table-lg w-full">
              <thead>
                <tr class="bg-base-200 bg-opacity-40 text-[10px] uppercase font-black tracking-[0.2em] opacity-40">
                  <th class="py-6 px-10">Dettagli Arena</th>
                  <th class="text-center">Params</th>
                  <th class="text-center">Data</th>
                  <th class="text-right pr-10"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="comp in competitions" :key="comp.id" class="hover:bg-base-200 hover:bg-opacity-20 transition-all group">
                   <td class="px-10 py-6">
                      <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-2xl bg-secondary bg-opacity-10 text-secondary flex items-center justify-center font-black">
                           {{ comp.name.charAt(0) }}
                        </div>
                        <div>
                           <div class="text-xl font-black tracking-tight text-secondary">{{ comp.name }}</div>
                           <div class="text-[10px] opacity-40 font-bold uppercase tracking-widest">ID Arena #{{ comp.id }}</div>
                        </div>
                      </div>
                   </td>
                   <td class="text-center">
                      <div class="badge badge-outline border-secondary/30 text-secondary font-black text-[10px] tracking-tight py-3 px-4">
                         {{ comp.winPoints }} PTS WIN
                      </div>
                   </td>
                   <td class="text-center opacity-40 text-xs font-black">
                      {{ new Date(comp.createdAt).toLocaleDateString() }}
                   </td>
                   <td class="text-right pr-10">
                      <button class="btn btn-square btn-ghost hover:bg-secondary hover:text-secondary-content transition-all rounded-2xl group-hover:scale-110">
                         <Icon name="lucide:move-right" />
                      </button>
                   </td>
                </tr>
              </tbody>
            </table>
        </div>
        <div v-else class="py-32 flex flex-col items-center gap-6 opacity-20 transform scale-110">
           <Icon name="lucide:ferris-wheel" class="w-24 h-24 stroke-[1.5]" />
           <p class="font-heading text-2xl font-black uppercase tracking-tighter">Nessun Torneo Generato</p>
        </div>
     </div>
  </div>
</template>
