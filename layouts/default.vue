<script setup lang="ts">
const colorMode = useColorMode()
const themes = ['cupcake', 'dracula', 'emerald']

const { user, isLoggedIn, logout } = useAuth()
</script>

<template>
  <div class="min-h-screen bg-base-300 transition-all duration-700 ease-in-out">
    <!-- Ultra-Premium Sticky Navbar -->
    <header class="sticky top-0 z-[100] w-full px-6 py-4">
      <div class="navbar glass-card rounded-[2rem] px-8 py-3 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-primary rounded-2xl text-primary-content shadow-lg transform hover:rotate-6 transition-transform">
             <Icon name="lucide:trophy" class="w-7 h-7" />
          </div>
          <div class="flex flex-col">
            <NuxtLink :to="isLoggedIn ? '/' : '/tornei'" class="text-2xl font-black italic tracking-tighter leading-none bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent cursor-pointer">CALCETTO PUNTI</NuxtLink>
            <span class="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em] ml-1">The Tournament Management</span>
          </div>
        </div>

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

        <div class="flex items-center gap-4">
          <div class="dropdown dropdown-end">
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

          <!-- User & Logout -->
          <div v-if="isLoggedIn" class="flex items-center gap-3">
            <div class="badge badge-ghost font-bold text-[10px] uppercase tracking-widest gap-2 py-3 px-4 rounded-xl">
              <Icon name="lucide:user-circle" class="w-4 h-4" />
              {{ user?.username }}
            </div>
            <button
              @click="logout"
              class="btn btn-ghost btn-sm rounded-xl text-error hover:bg-error hover:text-error-content transition-all"
              title="Logout"
            >
              <Icon name="lucide:log-out" class="w-4 h-4" />
            </button>
          </div>
          <!-- Guest login button -->
          <NuxtLink v-else to="/login" class="btn btn-ghost btn-sm rounded-xl font-black tracking-widest text-[11px] gap-2 px-6 hover:bg-base-100">
            <Icon name="lucide:log-in" class="w-4 h-4" /> ACCEDI
          </NuxtLink>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto p-4 sm:p-10">
      <slot />
    </main>
    
    <footer class="p-10 text-center opacity-30 text-[10px] font-bold uppercase tracking-[0.5em]">
       Calcetto Punti © 2026 • Engineered for Champions
    </footer>
  </div>
</template>
