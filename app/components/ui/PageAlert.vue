<script setup lang="ts">
defineProps<{
  message: string
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div
    class="flex flex-wrap items-center justify-between gap-3 rounded-md border border-trading-down/40 bg-surface px-4 py-3 text-sm text-body"
    role="alert"
  >
    <span>{{ message }}</span>
    <button
      type="button"
      class="shrink-0 rounded-md border border-hairline px-3 py-1.5 text-xs font-medium text-on-dark transition-colors hover:bg-surface-elevated"
      @click="emit('retry')"
    >
      重试
    </button>
  </div>
</template>
