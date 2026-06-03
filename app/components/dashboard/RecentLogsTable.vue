<script setup lang="ts">
import type { LogEntry } from '../../../shared/types/demo'

defineProps<{
  logs: LogEntry[]
  loading?: boolean
}>()

const TYPE_LABELS: Record<LogEntry['type'], string> = {
  swap: 'Swap',
  supply: 'Supply',
  revenue: 'Revenue Share',
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <section aria-labelledby="recent-logs-heading">
    <div class="flex items-center justify-between gap-4">
      <h2 id="recent-logs-heading" class="text-base font-semibold text-on-dark">近期执行</h2>
      <NuxtLink to="/history" class="text-xs font-medium text-primary no-underline hover:underline">
        查看全部
      </NuxtLink>
    </div>

    <div v-if="loading && logs.length === 0" class="mt-4 h-32 animate-pulse rounded-lg bg-surface" />

    <p v-else-if="logs.length === 0" class="mt-4 text-sm text-muted">暂无执行记录。</p>

    <div v-else class="mt-4 overflow-x-auto rounded-lg border border-hairline">
      <table class="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr class="border-b border-hairline bg-surface text-xs text-muted">
            <th class="px-4 py-2.5 font-medium" scope="col">时间</th>
            <th class="px-4 py-2.5 font-medium" scope="col">动作</th>
            <th class="px-4 py-2.5 font-medium" scope="col">类型</th>
            <th class="px-4 py-2.5 font-medium" scope="col">Tx</th>
            <th class="px-4 py-2.5 font-medium" scope="col">状态</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="log in logs"
            :key="log.id"
            class="border-b border-hairline last:border-0"
          >
            <td class="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-muted">
              {{ formatTime(log.timestamp) }}
            </td>
            <td class="px-4 py-2.5 text-body">{{ log.action }}</td>
            <td class="px-4 py-2.5 text-xs text-muted-strong">{{ TYPE_LABELS[log.type] }}</td>
            <td class="px-4 py-2.5">
              <UiTxLink :hash="log.txHash" network="base-sepolia" />
            </td>
            <td class="px-4 py-2.5 text-xs">{{ log.status }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
