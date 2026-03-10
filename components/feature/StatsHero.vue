<script setup lang="ts">
defineProps<{
  playersCount: number
  competitionsCount: number
}>()
</script>

<template>
  <section class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
    <div class="group relative overflow-hidden p-10 rounded-[3rem] bg-gradient-to-br from-primary via-primary to-primary-focus text-primary-content shadow-2xl">
       <div class="absolute top-0 right-0 p-10 transform translate-x-4 -translate-y-4">
         <Icon name="lucide:user-plus" class="w-48 h-48 opacity-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700" />
       </div>
       <div class="relative z-10 flex flex-col gap-2">
          <h3 class="text-sm font-black uppercase tracking-[0.4em] opacity-60">Database Atleti</h3>
          <div class="flex items-baseline gap-4 mt-2">
             <span class="text-8xl font-black font-heading tracking-tighter leading-none">{{ playersCount }}</span>
             <span class="text-xl font-bold italic opacity-80 uppercase tracking-widest">Convocati</span>
          </div>
          <p class="text-xs font-bold opacity-50 mt-4 max-w-[200px]">Roster ufficiale sincronizzato con la Federazione Calcetto.</p>
       </div>
    </div>

    <div class="group relative overflow-hidden p-10 rounded-[3rem] bg-gradient-to-br from-secondary via-secondary to-secondary-focus text-secondary-content shadow-2xl">
       <div class="absolute top-0 right-0 p-10 transform translate-x-4 -translate-y-4">
         <Icon name="lucide:calendar-check" class="w-48 h-48 opacity-10 group-hover:-scale-110 group-hover:-rotate-12 transition-all duration-700" />
       </div>
       <div class="relative z-10 flex flex-col gap-2">
          <h3 class="text-sm font-black uppercase tracking-[0.4em] opacity-60">Circuiti Attivi</h3>
          <div class="flex items-baseline gap-4 mt-2">
             <span class="text-8xl font-black font-heading tracking-tighter leading-none">{{ competitionsCount }}</span>
             <span class="text-xl font-bold italic opacity-80 uppercase tracking-widest">Tornei</span>
          </div>
           <p class="text-xs font-bold opacity-50 mt-4 max-w-[200px]">Competizioni in corso gestite dal sistema Round-Robin.</p>
       </div>
    </div>
  </section>
</template>
