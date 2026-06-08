<script setup lang="ts">
import type { LogType } from '../../../shared/types/app'

export type LogFilter = LogType | 'all'

const props = defineProps<{
  modelValue: LogFilter
}>()

const emit = defineEmits<{
  'update:modelValue': [LogFilter]
}>()

const options: { value: LogFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'swap', label: 'Swap' },
  { value: 'supply', label: 'Supply' },
  { value: 'revenue', label: 'Revenue Share' },
  { value: 'pact', label: 'Pact / Policy' },
]
</script>

<template>
  <div class="flex flex-wrap gap-2" role="group" aria-label="日志类型筛选">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
      :class="
        modelValue === opt.value
          ? 'border-primary/50 bg-surface-elevated text-on-dark'
          : 'border-hairline text-muted hover:text-body'
      "
      @click="emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>
