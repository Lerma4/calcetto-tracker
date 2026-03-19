<script setup lang="ts">
const VARIANT_CLASSES = {
  info: 'alert-info border border-info/20 bg-info text-info-content',
  success: 'alert-success border border-success/20 bg-success text-success-content',
  warning: 'alert-warning border border-warning/20 bg-warning text-warning-content',
  error: 'alert-error border border-error/20 bg-error text-error-content',
} as const

interface Props {
  variant?: 'info' | 'success' | 'warning' | 'error'
  icon?: string
  dismissible?: boolean
  ariaLabel?: string
  alertClass?: string
  iconClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: undefined,
  icon: undefined,
  dismissible: true,
  ariaLabel: 'Chiudi notifica',
  alertClass: '',
  iconClass: 'w-5 h-5 shrink-0',
})

defineEmits<{
  close: []
}>()
</script>

<template>
  <div
    role="alert"
    :class="[
      'alert gap-3',
      props.variant && VARIANT_CLASSES[props.variant],
      props.alertClass,
    ]"
  >
    <Icon v-if="props.icon" :name="props.icon" :class="props.iconClass" />
    <div class="min-w-0 flex-1">
      <slot />
    </div>
    <button
      v-if="props.dismissible"
      type="button"
      class="btn btn-ghost btn-xs btn-circle shrink-0"
      :aria-label="props.ariaLabel"
      @click="$emit('close')"
    >
      <Icon name="lucide:x" class="w-4 h-4" />
    </button>
  </div>
</template>
