<script setup lang="ts">
const colorMode = useColorMode()
const themes = ['cupcake', 'dracula', 'emerald', 'cyberpunk', 'lofi', 'caramellatte']
const themeModalOpen = ref(false)

const { user, isLoggedIn, logout } = useAuth()

function selectTheme(theme: string) {
  colorMode.preference = theme
  themeModalOpen.value = false
}
</script>

<template>
  <div class="min-h-screen bg-base-300 transition-all duration-700 ease-in-out">
    <!-- Sticky Navbar -->
    <header class="sticky top-0 z-[100] w-full px-3 sm:px-6 py-3 sm:py-4">
      <div class="navbar glass-card rounded-[2rem] px-4 sm:px-8 py-2 sm:py-3 flex items-center justify-between">
        <!-- Logo -->
        <div class="flex items-center gap-2 sm:gap-4">
          <div class="p-1 sm:p-1.5 bg-primary rounded-xl sm:rounded-2xl shadow-lg transform hover:rotate-6 transition-transform">
            <div class="w-7 h-7 sm:w-10 sm:h-10 bg-primary-content" style="-webkit-mask-image: url('/logo.svg'); mask-image: url('/logo.svg'); -webkit-mask-size: contain; mask-size: contain; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; -webkit-mask-position: center; mask-position: center;" role="img" aria-label="Logo"></div>
          </div>
          <div class="hidden sm:flex flex-col">
            <NuxtLink :to="isLoggedIn ? '/' : '/tornei'" class="text-2xl font-black italic tracking-tighter leading-none bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent cursor-pointer">CALCETTO PUNTI</NuxtLink>
            <span class="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em] ml-1">The Tournament Management</span>
          </div>
          <NuxtLink :to="isLoggedIn ? '/' : '/tornei'" class="sm:hidden text-base font-black italic tracking-tighter leading-none bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent cursor-pointer">CALCETTO</NuxtLink>
        </div>

        <!-- Desktop nav -->
        <nav v-if="isLoggedIn" class="hidden lg:flex items-center gap-2 bg-base-200 bg-opacity-50 p-1.5 rounded-2xl border border-base-content border-opacity-5">
          <NuxtLink to="/" class="btn btn-ghost btn-sm rounded-xl font-black tracking-widest text-[11px] gap-2 px-6 hover:bg-base-100">
            <Icon name="lucide:layout-dashboard" /> DASHBOARD
          </NuxtLink>
          <NuxtLink to="/atleti" class="btn btn-ghost btn-sm rounded-xl font-black tracking-widest text-[11px] gap-2 px-6 hover:bg-base-100">
            <Icon name="lucide:users" /> ATLETI
          </NuxtLink>
          <NuxtLink to="/tornei" class="btn btn-ghost btn-sm rounded-xl font-black tracking-widest text-[11px] gap-2 px-6 hover:bg-base-100">
            <Icon name="lucide:swords" /> TORNEI
          </NuxtLink>
        </nav>

        <div class="flex items-center gap-2 sm:gap-4">
          <!-- Theme button -->
          <!-- Desktop: dropdown -->
          <div class="hidden sm:block dropdown dropdown-end">
            <div tabindex="0" role="button" class="btn btn-outline border-2 border-primary border-opacity-20 btn-sm rounded-2xl gap-2 font-black tracking-widest text-[10px] px-6 hover:bg-primary hover:border-primary transition-all shadow-lg hover:shadow-primary">
              <Icon name="lucide:palette" class="w-4 h-4" /> {{ colorMode.preference.toUpperCase() }}
            </div>
            <ul tabindex="0" class="dropdown-content z-[101] menu p-4 shadow-2xl bg-base-100 rounded-[1.5rem] w-64 mt-6 border-4 border-base-200 animate-in fade-in slide-in-from-top-4 duration-300">
              <li class="menu-title uppercase text-[10px] font-black opacity-30 tracking-[0.3em] mb-4 text-center">Style Engine</li>
              <li v-for="theme in themes" :key="theme" class="mb-1">
                <button
                  @click="colorMode.preference = theme"
                  class="flex items-center justify-between py-3 px-4 rounded-xl transition-all w-full"
                  :class="{ 'bg-primary text-primary-content shadow-xl scale-105 font-bold': colorMode.preference === theme, 'hover:bg-base-200 opacity-60': colorMode.preference !== theme }"
                >
                   <span class="uppercase tracking-widest text-xs">{{ theme }}</span>
                   <Icon v-if="colorMode.preference === theme" name="lucide:check-circle-2" class="w-4 h-4" />
                   <div v-else class="w-3 h-3 rounded-full border-2 border-base-content border-opacity-20"></div>
                </button>
              </li>
            </ul>
          </div>
          <!-- Mobile: icon-only button that opens centered modal -->
          <button
            @click="themeModalOpen = true"
            class="sm:hidden btn btn-ghost btn-sm btn-square rounded-xl"
            title="Tema"
          >
            <Icon name="lucide:palette" class="w-5 h-5" />
          </button>

          <!-- User & Logout -->
          <div v-if="isLoggedIn" class="flex items-center gap-1 sm:gap-3">
            <!-- Desktop: badge with username -->
            <div class="hidden sm:flex badge badge-ghost font-bold text-[10px] uppercase tracking-widest gap-2 py-3 px-4 rounded-xl">
              <Icon name="lucide:user-circle" class="w-4 h-4" />
              {{ user?.username }}
            </div>
            <!-- Mobile: icon only -->
            <div class="sm:hidden btn btn-ghost btn-sm btn-square rounded-xl pointer-events-none">
              <Icon name="lucide:user-circle" class="w-5 h-5" />
            </div>
            <button
              @click="logout"
              class="btn btn-ghost btn-sm rounded-xl font-black tracking-widest text-[11px] gap-2 px-3 sm:px-6 text-error hover:bg-error hover:text-error-content transition-all"
              title="Logout"
            >
              <Icon name="lucide:log-out" class="w-4 h-4" />
              <span class="hidden sm:inline">LOGOUT</span>
            </button>
          </div>
          <!-- Guest login button -->
          <NuxtLink v-else to="/login" class="btn btn-ghost btn-sm rounded-xl font-black tracking-widest text-[11px] gap-2 px-3 sm:px-6 hover:bg-base-100">
            <Icon name="lucide:log-in" class="w-4 h-4" /> <span class="hidden sm:inline">ACCEDI</span>
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- Mobile bottom navigation bar -->
    <nav v-if="isLoggedIn" class="lg:hidden fixed bottom-0 left-0 right-0 z-[100] px-3 pb-3 pt-1">
      <div class="glass-card rounded-2xl flex items-center justify-around py-2 border border-base-content border-opacity-5">
        <NuxtLink to="/" class="flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all hover:bg-base-200">
          <Icon name="lucide:layout-dashboard" class="w-5 h-5" />
          <span class="text-[9px] font-bold uppercase tracking-widest opacity-70">Home</span>
        </NuxtLink>
        <NuxtLink to="/atleti" class="flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all hover:bg-base-200">
          <Icon name="lucide:users" class="w-5 h-5" />
          <span class="text-[9px] font-bold uppercase tracking-widest opacity-70">Atleti</span>
        </NuxtLink>
        <NuxtLink to="/tornei" class="flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all hover:bg-base-200">
          <Icon name="lucide:swords" class="w-5 h-5" />
          <span class="text-[9px] font-bold uppercase tracking-widest opacity-70">Tornei</span>
        </NuxtLink>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto p-4 sm:p-10 pb-24 lg:pb-10">
      <slot />
    </main>

    <BaseAppFooter />

    <!-- Theme modal (mobile centered) -->
    <Teleport to="body">
      <Transition name="theme-modal">
        <div v-if="themeModalOpen" class="fixed inset-0 z-[200] flex items-center justify-center p-6" @click.self="themeModalOpen = false">
          <div class="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" @click="themeModalOpen = false" />
          <div class="relative glass-card rounded-[2rem] p-6 w-full max-w-xs border-4 border-base-200 shadow-2xl">
            <div class="flex items-center justify-between mb-5">
              <h3 class="uppercase text-[10px] font-black opacity-40 tracking-[0.3em]">Scegli Tema</h3>
              <button @click="themeModalOpen = false" class="btn btn-ghost btn-sm btn-square rounded-xl">
                <Icon name="lucide:x" class="w-4 h-4" />
              </button>
            </div>
            <div class="flex flex-col gap-2">
              <button
                v-for="theme in themes" :key="theme"
                @click="selectTheme(theme)"
                class="flex items-center justify-between py-4 px-5 rounded-2xl transition-all w-full"
                :class="{ 'bg-primary text-primary-content shadow-xl scale-[1.02] font-bold': colorMode.preference === theme, 'hover:bg-base-200 opacity-60 bg-base-100': colorMode.preference !== theme }"
              >
                <span class="uppercase tracking-widest text-sm font-bold">{{ theme }}</span>
                <Icon v-if="colorMode.preference === theme" name="lucide:check-circle-2" class="w-5 h-5" />
                <div v-else class="w-4 h-4 rounded-full border-2 border-base-content border-opacity-20"></div>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.theme-modal-enter-active,
.theme-modal-leave-active {
  transition: opacity 0.25s ease;
}
.theme-modal-enter-active .relative,
.theme-modal-leave-active .relative {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.theme-modal-enter-from,
.theme-modal-leave-to {
  opacity: 0;
}
.theme-modal-enter-from .relative {
  transform: scale(0.9);
  opacity: 0;
}
.theme-modal-leave-to .relative {
  transform: scale(0.9);
  opacity: 0;
}
</style>
