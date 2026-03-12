<script setup lang="ts">
interface Props {
  title: string
  backLabel?: string
  backTo?: string
}

withDefaults(defineProps<Props>(), {
  backLabel: 'DASHBOARD',
  backTo: '/',
})
</script>

<template>
  <div class="flex items-center gap-4">
    <NuxtLink :to="backTo" class="btn btn-ghost btn-sm rounded-xl font-black text-[10px] opacity-40 hover:opacity-100 uppercase tracking-widest gap-2">
      <Icon name="lucide:arrow-left" class="w-4 h-4" /> {{ backLabel }}
    </NuxtLink>
    <h1 class="text-3xl sm:text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">{{ title }}</h1>
    <div class="h-2 w-32 bg-secondary rounded-full mt-4"></div>
  </div>
</template>
