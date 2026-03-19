<script setup lang="ts">
definePageMeta({ layout: false })

const { user, fetchUser } = useAuth()

const newPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

const handleChangePassword = async () => {
  error.value = ''

  if (newPassword.value.length < 4) {
    error.value = 'La password deve avere almeno 4 caratteri'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Le password non coincidono'
    return
  }

  loading.value = true
  try {
    await $fetch('/api/auth/change-password', {
      method: 'POST',
      body: { newPassword: newPassword.value },
    })
    await fetchUser()
    navigateTo('/')
  } catch (e: any) {
    error.value = e.data?.message || e.statusMessage || 'Errore durante il cambio password'
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
            <Icon name="lucide:shield" class="w-10 h-10" />
          </div>
        </div>
        <h1 class="text-3xl font-black italic tracking-tighter bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          CALCETTO PUNTI
        </h1>
        <p class="text-[11px] font-bold opacity-40 uppercase tracking-[0.2em] mt-2">
          The Tournament Management
        </p>
      </div>

      <!-- Change Password Card -->
      <div class="card bg-base-100 shadow-2xl border border-base-content/5">
        <div class="card-body p-8 space-y-6">
          <div class="text-center space-y-2">
            <h2 class="text-lg font-black tracking-widest uppercase opacity-60">
              Cambio Password
            </h2>
            <p class="text-xs opacity-40">
              Benvenuto <span class="font-bold">{{ user?.username }}</span>! Per sicurezza, imposta una nuova password.
            </p>
          </div>

          <!-- Error Alert -->
          <BaseAlert
            v-if="error"
            variant="error"
            icon="lucide:alert-circle"
            alert-class="text-sm rounded-xl"
            @close="error = ''"
          >
            <span>{{ error }}</span>
          </BaseAlert>

          <form @submit.prevent="handleChangePassword" class="space-y-5">
            <div class="">
              <label class="label">
                <span class="label-text font-bold text-xs uppercase tracking-widest opacity-50">Nuova Password</span>
              </label>
              <div class="relative">
                <Icon name="lucide:lock" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50 z-10" />
                <input
                  v-model="newPassword"
                  type="password"
                  placeholder="••••••••"
                  class="input input w-full pl-11 rounded-xl focus:input-primary"
                  autocomplete="new-password"
                  required
                />
              </div>
            </div>

            <div class="">
              <label class="label">
                <span class="label-text font-bold text-xs uppercase tracking-widest opacity-50">Conferma Password</span>
              </label>
              <div class="relative">
                <Icon name="lucide:lock-keyhole" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50 z-10" />
                <input
                  v-model="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  class="input input w-full pl-11 rounded-xl focus:input-primary"
                  autocomplete="new-password"
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
              <Icon v-if="!loading" name="lucide:check" class="w-5 h-5 mr-2" />
              {{ loading ? 'SALVATAGGIO...' : 'SALVA NUOVA PASSWORD' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
