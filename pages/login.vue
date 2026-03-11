<script setup lang="ts">
definePageMeta({ layout: false })

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const { login } = useAuth()

const handleLogin = async () => {
  error.value = ''
  loading.value = true
  try {
    await login(username.value, password.value)
    navigateTo('/')
  } catch (e: any) {
    error.value = e.data?.message || e.statusMessage || 'Credenziali non valide'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-base-300 flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center gap-4 mb-6">
          <div class="p-4 bg-primary rounded-2xl text-primary-content shadow-xl">
            <Icon name="lucide:trophy" class="w-10 h-10" />
          </div>
        </div>
        <h1 class="text-3xl font-black italic tracking-tighter bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          CALCETTO PUNTI
        </h1>
        <p class="text-[11px] font-bold opacity-40 uppercase tracking-[0.2em] mt-2">
          The Tournament Management
        </p>
      </div>

      <!-- Login Card -->
      <div class="card bg-base-100 shadow-2xl border border-base-content border-opacity-5">
        <div class="card-body p-8 space-y-6">
          <h2 class="text-lg font-black tracking-widest uppercase text-center opacity-60">
            Accesso
          </h2>

          <!-- Error Alert -->
          <div v-if="error" class="alert alert-error text-sm rounded-xl">
            <Icon name="lucide:alert-circle" class="w-5 h-5" />
            <span>{{ error }}</span>
          </div>

          <form @submit.prevent="handleLogin" class="space-y-5">
            <div class="form-control">
              <label class="label">
                <span class="label-text font-bold text-xs uppercase tracking-widest opacity-50">Username</span>
              </label>
              <div class="relative">
                <Icon name="lucide:user" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                <input
                  v-model="username"
                  type="text"
                  placeholder="admin"
                  class="input input-bordered w-full pl-11 rounded-xl focus:input-primary"
                  autocomplete="username"
                  required
                />
              </div>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text font-bold text-xs uppercase tracking-widest opacity-50">Password</span>
              </label>
              <div class="relative">
                <Icon name="lucide:lock" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                <input
                  v-model="password"
                  type="password"
                  placeholder="••••••••"
                  class="input input-bordered w-full pl-11 rounded-xl focus:input-primary"
                  autocomplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              class="btn btn-primary w-full rounded-xl font-black tracking-widest text-sm shadow-lg hover:shadow-primary/50 transition-all"
              :class="{ 'loading': loading }"
              :disabled="loading"
            >
              <Icon v-if="!loading" name="lucide:log-in" class="w-5 h-5 mr-2" />
              {{ loading ? 'ACCESSO IN CORSO...' : 'ACCEDI' }}
            </button>
          </form>

          <p class="text-center text-[10px] opacity-30 font-bold uppercase tracking-widest">
            Primo accesso? Usa admin / admin
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
