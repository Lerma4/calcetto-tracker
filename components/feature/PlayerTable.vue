<script setup lang="ts">
import type { Player } from '~/types'

defineProps<{
  players: Player[] | null
}>()
</script>

<template>
  <div class="card bg-base-100 rounded-[3rem] shadow-2xl border-2 border-base-200 overflow-hidden">
     <div class="p-5 sm:p-8 md:p-10 pb-6 flex items-end justify-between border-b border-base-200 bg-base-100 bg-opacity-50">
       <div>
          <h2 class="text-2xl sm:text-3xl md:text-4xl font-black font-heading tracking-tighter uppercase leading-none">Roster Ufficiale</h2>
          <p class="text-[10px] font-black opacity-30 uppercase tracking-[0.4em] mt-3">Anagrafica Atleti Verificati</p>
       </div>
       <div class="badge badge-lg bg-primary/10 text-primary border-none font-black text-xs px-4">{{ players?.length }} ATLETI</div>
     </div>
     <div class="card-body p-0">
        <div v-if="players && players.length > 0" class="overflow-x-auto">
            <table class="table table-lg w-full">
              <thead>
                <tr class="bg-base-200 bg-opacity-40 text-[10px] uppercase font-black tracking-[0.2em] opacity-40">
                  <th class="py-6 px-10">Profilo Atleta</th>
                  <th>Social handle</th>
                  <th class="text-right pr-10">Role Bias</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="player in players" :key="player.id" class="hover:bg-base-200 hover:bg-opacity-20 transition-all border-base-200">
                   <td class="px-10 py-6">
                      <div class="flex items-center gap-5">
                         <div class="avatar placeholder">
                           <div class="bg-neutral text-neutral-content rounded-2xl w-14 shadow-xl">
                             <span class="text-base font-black">{{ player.name[0] }}{{ player.surname[0] }}</span>
                           </div>
                         </div>
                         <div>
                           <div class="text-xl font-black tracking-tight">{{ player.name }} <span class="text-primary">{{ player.surname }}</span></div>
                           <div class="text-[10px] font-bold opacity-30 uppercase tracking-widest">Certificato ⚽</div>
                         </div>
                      </div>
                   </td>
                   <td>
                      <div v-if="player.nickname" class="flex items-center gap-2 text-sm font-bold opacity-60">
                         <Icon name="lucide:at-sign" class="w-3 h-3 text-primary" /> {{ player.nickname }}
                      </div>
                      <span v-else class="opacity-10">—</span>
                   </td>
                   <td class="text-right pr-10">
                      <div class="badge badge-lg h-auto py-2 px-6 rounded-xl border-none font-black text-[10px] tracking-[0.2em] uppercase" :class="{
                         'bg-primary text-primary-content shadow-lg shadow-primary/20': player.role === 'attaccante',
                         'bg-info text-info-content shadow-lg shadow-info/20': player.role === 'portiere',
                         'bg-base-300 text-base-content opacity-40': player.role === 'indifferente'
                      }">
                         {{ player.role }}
                      </div>
                   </td>
                </tr>
              </tbody>
            </table>
        </div>
        <div v-else class="py-32 flex flex-col items-center gap-6 opacity-20 transform scale-110">
           <Icon name="lucide:user-x" class="w-24 h-24 stroke-[1.5]" />
           <p class="font-heading text-2xl font-black uppercase tracking-tighter">Database Atleti Vuoto</p>
        </div>
     </div>
  </div>
</template>
