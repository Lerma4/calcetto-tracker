<script setup lang="ts">
const { public: { appVersion } } = useRuntimeConfig()
</script>

<template>
  <footer class="flex p-6 sm:p-10 items-center justify-center gap-3 sm:gap-4 opacity-30 text-[10px] font-bold uppercase tracking-[0.4em] sm:tracking-[0.5em]">
    <span>Calcetto Punti © 2026</span>
    <span>•</span>
    <span>v{{ appVersion }}</span>
    <span>•</span>
    <a href="https://github.com/Lerma4/calcetto-tracker" target="_blank" rel="noopener noreferrer" class="hover:opacity-70 transition-opacity">
      <Icon name="lucide:github" class="w-4 h-4" />
    </a>
  </footer>
</template>
