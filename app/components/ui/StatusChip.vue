<script setup lang="ts">
const props = defineProps<{
  label: string
  tone?: 'active' | 'pending' | 'paused' | 'error' | 'neutral'
}>()

const toneClass = computed(() => {
  switch (props.tone ?? 'neutral') {
    case 'active':
      return 'text-trading-up'
    case 'pending':
      return 'text-[var(--color-status-pending)]'
    case 'paused':
      return 'text-[var(--color-status-paused)]'
    case 'error':
      return 'text-trading-down'
    default:
      return 'text-muted-strong'
  }
})
</script>

<template>
  <span
    class="inline-flex shrink-0 rounded-sm bg-surface-elevated px-2.5 py-1 text-xs font-medium"
    :class="toneClass"
  >
    {{ label }}
  </span>
</template>
