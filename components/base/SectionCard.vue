<script setup lang="ts">
interface Props {
  title: string
  icon: string
}

defineProps<Props>()
</script>

<template>
  <div class="glass-card rounded-[2rem] p-8">
    <h2 class="text-lg font-black uppercase tracking-widest opacity-60 mb-6 flex items-center gap-2">
      <Icon :name="icon" class="w-5 h-5" />{{ title }}
    </h2>
    <slot />
  </div>
</template>
