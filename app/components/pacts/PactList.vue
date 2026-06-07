<script setup lang="ts">
import type { Pact } from '../../../shared/types/demo'

const props = defineProps<{
  pacts: Pact[]
  selectedId: string | null
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const STATUS_LABELS: Record<Pact['status'], string> = {
  pending: '待处理',
  active: '生效中',
  completed: '已完成',
  terminated: '已终止',
  'awaiting-approval': '待审批',
}

const STATUS_TONE: Record<Pact['status'], 'active' | 'pending' | 'paused' | 'error' | 'neutral'> = {
  pending: 'pending',
  active: 'active',
  completed: 'neutral',
  terminated: 'error',
  'awaiting-approval': 'paused',
}
</script>

<template>
  <ul class="space-y-2" role="listbox" aria-label="Pact 列表">
    <li v-for="p in pacts" :key="p.id">
      <button
        type="button"
        role="option"
        :aria-selected="p.id === selectedId"
        class="w-full rounded-lg border px-3 py-3 text-left transition-colors"
        :class="
          p.id === selectedId
            ? 'border-primary/50 bg-surface-elevated'
            : 'border-hairline bg-surface hover:border-muted/50'
        "
        @click="emit('select', p.id)"
      >
        <p class="line-clamp-2 text-sm text-on-dark">{{ p.intent }}</p>
        <div class="mt-2 flex flex-wrap items-center justify-between gap-2">
          <UiStatusChip :label="STATUS_LABELS[p.status]" :tone="STATUS_TONE[p.status]" />
          <span class="font-mono text-xs text-muted">≤ {{ p.maxSpend }} USDC</span>
        </div>
        <p class="mt-1 text-[0.65rem] text-muted">
          {{ p.submissionMode === 'cobo' ? 'Cobo' : '本地 Draft' }}
          <span
            v-if="p.status === 'awaiting-approval'"
            class="text-[var(--color-status-pending)]"
          >
            · → 去 Cobo App 批准
          </span>
        </p>
      </button>
    </li>
  </ul>
</template>
