<script setup lang="ts">
import type { LogEntry } from '../../../shared/types/app'

defineProps<{
  logs: LogEntry[]
  loading?: boolean
}>()

const TYPE_LABELS: Record<LogEntry['type'], string> = {
  swap: 'Swap',
  supply: 'Supply',
  revenue: 'Revenue Share',
  pact: 'Pact / Policy',
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div v-if="loading && logs.length === 0" class="space-y-4">
    <div v-for="i in 4" :key="i" class="h-16 animate-pulse rounded-lg bg-surface" />
  </div>

  <p v-else-if="logs.length === 0" class="text-sm text-muted">该筛选条件下暂无记录。</p>

  <ol v-else class="space-y-0">
    <li
      v-for="log in logs"
      :key="log.id"
      class="grid gap-4 border-b border-hairline py-4 sm:grid-cols-[10rem_minmax(0,1fr)]"
    >
      <time class="font-mono text-xs text-muted" :datetime="log.timestamp">
        {{ formatTime(log.timestamp) }}
      </time>
      <div>
        <p class="text-sm text-on-dark">{{ log.action }}</p>
        <p class="mt-1 text-xs text-muted">
          {{ TYPE_LABELS[log.type] }} · {{ log.status }}
        </p>
        <p class="mt-2">
          <UiTxLink :hash="log.txHash" network="base-sepolia" />
        </p>
      </div>
    </li>
  </ol>
</template>
