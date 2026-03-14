<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
@reference "~/assets/css/main.css";

/* Smooth typography and layout base */
body {
  margin: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Custom Scrollbar for Premium Feel */
::-webkit-scrollbar {
  width: 10px;
}
::-webkit-scrollbar-track {
  @apply bg-base-300;
}
::-webkit-scrollbar-thumb {
  @apply bg-primary/20 rounded-full border-2 border-base-300 hover:bg-primary/40 transition-colors;
}

/* Page Transitions */
.page-enter-active, .page-leave-active { transition: all 0.4s; }
.page-enter-from, .page-leave-to { opacity: 0; filter: blur(1rem); }

/* Globals for transitions */
button, a, input, select, .card, .btn, .badge, .navbar {
  transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform;
  transition-duration: 300ms;
}
</style>
