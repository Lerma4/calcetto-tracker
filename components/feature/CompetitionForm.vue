<script setup lang="ts">
defineProps<{
  loading: boolean
}>()

const emit = defineEmits(['submit'])

const comp = ref({
  name: '',
  winPoints: 3
})

const handleSubmit = () => {
  if (!comp.value.name) return
  emit('submit', { ...comp.value })
  comp.value = { name: '', winPoints: 3 }
}
</script>

<template>
  <div class="card bg-base-100 rounded-[2.5rem] shadow-2xl border-4 border-base-200 overflow-hidden group hover:border-secondary transition-all duration-500">
     <div class="p-8 pb-0 flex items-center justify-between">
        <h2 class="text-2xl font-black tracking-tighter italic uppercase underline decoration-4 decoration-secondary underline-offset-8">Nuova Arena</h2>
        <Icon name="lucide:plus-circle" class="w-6 h-6 text-secondary" />
     </div>
     <div class="card-body p-8 gap-8 mt-4">
       <form @submit.prevent="handleSubmit" class="space-y-6">
          <div class="form-control group">
            <label class="label pb-1"><span class="label-text font-black text-[10px] uppercase tracking-widest opacity-40 group-focus-within:opacity-100 group-focus-within:text-secondary transition-all">Nome Torneo</span></label>
            <input v-model="comp.name" type="text" placeholder="..." class="input input-lg bg-base-200 bg-opacity-50 rounded-2xl border-none font-bold" required />
          </div>
          <div class="form-control">
            <label class="label pb-1"><span class="label-text font-black text-[10px] uppercase tracking-widest opacity-40">Punti / Vittoria</span></label>
            <input v-model.number="comp.winPoints" type="number" class="input input-lg bg-base-200 bg-opacity-50 rounded-2xl border-none font-black text-secondary" required />
          </div>

          <button type="submit" class="btn btn-secondary btn-lg rounded-2xl w-full shadow-2xl transform active:scale-95 transition-all text-xs font-black tracking-[0.2em] uppercase" :disabled="loading">
            <span v-if="loading" class="loading loading-spinner"></span>
            <span v-else>Crea Competizione ⚡</span>
          </button>
       </form>
     </div>
  </div>
</template>
