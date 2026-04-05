<script setup lang="ts">
type SearchSelectOption = {
  value: number | string | null
  label: string
  searchText?: string
}

const props = withDefaults(defineProps<{
  modelValue: number | string | null
  options: SearchSelectOption[]
  placeholder?: string
  filterPlaceholder?: string
  disabled?: boolean
  required?: boolean
  selectClass?: string
  inputClass?: string
  emptyOptionLabel?: string
}>(), {
  placeholder: 'Seleziona',
  filterPlaceholder: 'Cerca...',
  disabled: false,
  required: false,
  selectClass: '',
  inputClass: '',
  emptyOptionLabel: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | string | null]
}>()

const rootRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const query = ref('')
const highlightedIndex = ref(-1)
const dropdownStyle = ref({
  top: '0px',
  left: '0px',
  width: '0px',
})

const buildOptionSearchText = (option: SearchSelectOption) => {
  return `${option.label} ${option.searchText || ''}`.toLowerCase()
}

const hasSelectedValue = computed(() => props.modelValue !== null && props.modelValue !== '' && props.modelValue !== 0)
const selectedOption = computed(() => props.options.find((option) => option.value === props.modelValue) || null)

const filteredOptions = computed(() => {
  const normalizedQuery = query.value.trim().toLowerCase()

  if (!normalizedQuery) {
    return props.options
  }

  return props.options.filter((option) => buildOptionSearchText(option).includes(normalizedQuery))
})

const displayValue = computed(() => {
  if (isOpen.value) {
    return query.value
  }

  return selectedOption.value?.label || ''
})

const updateDropdownPosition = () => {
  if (!rootRef.value) {
    return
  }

  const rect = rootRef.value.getBoundingClientRect()

  dropdownStyle.value = {
    top: `${rect.bottom + 8}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
  }
}

const openDropdown = () => {
  if (props.disabled) {
    return
  }

  isOpen.value = true
  query.value = ''
  highlightedIndex.value = filteredOptions.value.length ? 0 : -1

  nextTick(() => {
    updateDropdownPosition()
    inputRef.value?.focus()
    inputRef.value?.select()
  })
}

const closeDropdown = () => {
  isOpen.value = false
  query.value = ''
  highlightedIndex.value = -1
}

const handleBlur = () => {
  setTimeout(() => {
    const activeElement = document.activeElement

    if (
      activeElement instanceof Node &&
      (rootRef.value?.contains(activeElement) || dropdownRef.value?.contains(activeElement))
    ) {
      return
    }

    closeDropdown()
  }, 0)
}

const selectOption = (option: SearchSelectOption) => {
  emit('update:modelValue', option.value)
  closeDropdown()
}

const selectEmptyOption = () => {
  emit('update:modelValue', null)
  closeDropdown()
}

const handleInput = (event: Event) => {
  query.value = (event.target as HTMLInputElement).value
  highlightedIndex.value = filteredOptions.value.length ? 0 : -1
  if (!isOpen.value) {
    isOpen.value = true
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (props.disabled) {
    return
  }

  if (!isOpen.value && ['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) {
    event.preventDefault()
    openDropdown()
    return
  }

  if (!isOpen.value) {
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (!filteredOptions.value.length) {
      highlightedIndex.value = -1
      return
    }
    highlightedIndex.value = Math.min(highlightedIndex.value + 1, filteredOptions.value.length - 1)
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    if (!filteredOptions.value.length) {
      highlightedIndex.value = -1
      return
    }
    highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    const highlightedOption = filteredOptions.value[highlightedIndex.value]
    if (highlightedOption) {
      selectOption(highlightedOption)
    }
    return
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    closeDropdown()
    return
  }

  if (event.key === 'Tab') {
    closeDropdown()
  }
}

const handleClickOutside = (event: MouseEvent) => {
  if (!rootRef.value) {
    return
  }

  const target = event.target as Node | null
  if (target && !rootRef.value.contains(target) && !dropdownRef.value?.contains(target)) {
    closeDropdown()
  }
}

watch(filteredOptions, (options) => {
  if (!options.length) {
    highlightedIndex.value = -1
    return
  }

  if (highlightedIndex.value >= options.length || highlightedIndex.value < 0) {
    highlightedIndex.value = 0
  }
})

watch(isOpen, (open) => {
  if (!import.meta.client) {
    return
  }

  if (open) {
    updateDropdownPosition()
    window.addEventListener('resize', updateDropdownPosition)
    window.addEventListener('scroll', updateDropdownPosition, true)
    return
  }

  window.removeEventListener('resize', updateDropdownPosition)
  window.removeEventListener('scroll', updateDropdownPosition, true)
})

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  window.removeEventListener('resize', updateDropdownPosition)
  window.removeEventListener('scroll', updateDropdownPosition, true)
})
</script>

<template>
  <div ref="rootRef" class="relative">
    <label class="input w-full rounded-xl" :class="[selectClass, inputClass, { 'input-disabled': disabled }]">
      <Icon name="lucide:search" class="w-4 h-4 opacity-40 shrink-0" />
      <input
        ref="inputRef"
        :value="displayValue"
        type="text"
        class="grow"
        :placeholder="isOpen ? filterPlaceholder : (selectedOption ? '' : placeholder)"
        :disabled="disabled"
        :required="required && !hasSelectedValue"
        autocomplete="off"
        @focus="openDropdown"
        @blur="handleBlur"
        @input="handleInput"
        @keydown="handleKeydown"
      />
      <Icon
        name="lucide:chevron-down"
        class="w-4 h-4 opacity-40 shrink-0 transition-transform"
        :class="{ 'rotate-180': isOpen }"
      />
    </label>
  </div>

  <Teleport to="body">
    <div
      v-if="isOpen"
      ref="dropdownRef"
      class="fixed z-[200] rounded-2xl border border-base-300 bg-base-100 p-2 shadow-xl"
      :style="dropdownStyle"
    >
      <div class="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
        {{ filterPlaceholder }}
      </div>

      <button
        v-if="emptyOptionLabel"
        type="button"
        class="mb-2 flex w-full items-center rounded-xl px-3 py-2 text-left transition-colors"
        :class="{ 'bg-base-200 font-black text-primary': modelValue === null }"
        @mousedown.prevent="selectEmptyOption"
      >
        {{ emptyOptionLabel }}
      </button>

      <div v-if="filteredOptions.length" class="max-h-64 overflow-y-auto">
        <button
          v-for="(option, index) in filteredOptions"
          :key="`${option.value}`"
          type="button"
          class="flex w-full items-center rounded-xl px-3 py-2 text-left transition-colors"
          :class="{
            'bg-base-200': index === highlightedIndex,
            'font-black text-primary': option.value === modelValue,
          }"
          @mouseenter="highlightedIndex = index"
          @mousedown.prevent="selectOption(option)"
        >
          {{ option.label }}
        </button>
      </div>

      <div v-else class="rounded-xl px-3 py-2 text-sm font-medium opacity-50">
        Nessun risultato trovato
      </div>
    </div>
  </Teleport>
</template>
