<script setup lang="ts">
import type { Player } from '~/types'

const props = withDefaults(defineProps<{
  modelValue: number
  players: Player[]
  placeholder?: string
  filterPlaceholder?: string
  disabled?: boolean
  required?: boolean
  selectClass?: string
  inputClass?: string
  getLabel?: (player: Player) => string
}>(), {
  placeholder: 'Seleziona giocatore',
  filterPlaceholder: 'Cerca giocatore...',
  disabled: false,
  required: false,
  selectClass: '',
  inputClass: '',
  getLabel: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const getPlayerLabel = (player: Player) => {
  if (props.getLabel) {
    return props.getLabel(player)
  }

  const nickname = player.nickname ? ` (${player.nickname})` : ''
  return `${player.name} ${player.surname}${nickname}`
}


const playerOptions = computed(() => {
  return props.players.map((player) => ({
    value: player.id,
    label: getPlayerLabel(player),
    searchText: [
      player.name,
      player.surname,
      player.nickname || '',
      getPlayerLabel(player),
    ].join(' '),
  }))
})
</script>

<template>
  <BaseSearchSelect
    :model-value="modelValue"
    :options="playerOptions"
    :placeholder="placeholder"
    :filter-placeholder="filterPlaceholder"
    :disabled="disabled"
    :required="required"
    :select-class="selectClass"
    :input-class="inputClass"
    @update:model-value="emit('update:modelValue', Number($event))"
  />
</template>
