<script setup lang="ts">
defineProps<{
  loading: boolean
}>()

const emit = defineEmits(['submit'])

const player = ref({
  name: '',
  surname: '',
  role: 'indifferente',
  nickname: ''
})

const handleSubmit = () => {
  if (!player.value.name || !player.value.surname) return
  emit('submit', { ...player.value })
  player.value = { name: '', surname: '', role: 'indifferente', nickname: '' }
}
</script>

<template>
  <div class="card bg-base-100 rounded-[2.5rem] shadow-2xl border-4 border-base-200 overflow-hidden group hover:border-primary transition-all duration-500">
     <div class="p-8 pb-0 flex items-center justify-between">
        <h2 class="text-2xl font-black tracking-tighter italic uppercase underline decoration-4 decoration-primary underline-offset-8">Draft Player</h2>
        <Icon name="lucide:user-plus-2" class="w-6 h-6 text-primary" />
     </div>
     <div class="card-body p-8 gap-8 mt-4">
       <form @submit.prevent="handleSubmit" class="space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div class="">
              <label class="label pb-1"><span class="label-text font-black text-[10px] uppercase tracking-widest opacity-40">Nome</span></label>
              <input v-model="player.name" type="text" class="input bg-base-200/50 rounded-2xl border-none font-bold" required />
            </div>
            <div class="">
              <label class="label pb-1"><span class="label-text font-black text-[10px] uppercase tracking-widest opacity-40">Cognome</span></label>
              <input v-model="player.surname" type="text" class="input bg-base-200/50 rounded-2xl border-none font-bold" required />
            </div>
          </div>
          <div class="">
            <label class="label pb-1"><span class="label-text font-black text-[10px] uppercase tracking-widest opacity-40">Pseudonimo</span></label>
            <input v-model="player.nickname" type="text" placeholder="@" class="input bg-base-200/50 rounded-2xl border-none font-bold italic" />
          </div>
          <div class="">
            <label class="label pb-1"><span class="label-text font-black text-[10px] uppercase tracking-widest opacity-40">Strategia Ruolo</span></label>
            <select v-model="player.role" class="select select-lg bg-base-200/50 rounded-2xl border-none font-black text-primary">
              <option value="attaccante">ATTACCANTE 🏹</option>
              <option value="portiere">PORTIERE 🧤</option>
              <option value="indifferente">INDIFFERENTE 🌓</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary btn-lg rounded-2xl w-full shadow-2xl shadow-primary/30 transform active:scale-95 transition-all text-xs font-black tracking-[0.2em] uppercase" :disabled="loading">
            <span v-if="loading" class="loading loading-spinner"></span>
            <span v-else>Iscrivi Atleta ⚽</span>
          </button>
       </form>
     </div>
  </div>
</template>
