<script setup lang="ts">
import { DASHBOARD_HISTORY } from '#shared/constants/dashboard-routes'
import type { LogEntry } from '../../../shared/types/app'

const props = defineProps<{
  logs: LogEntry[]
  loading?: boolean
  variant?: 'default' | 'ledger'
}>()

const isLedger = computed(() => props.variant === 'ledger')

const TYPE_LABELS: Record<LogEntry['type'], string> = {
  swap: 'Swap',
  supply: 'Supply',
  revenue: 'Revenue Share',
  pact: 'Pact / Policy',
  withdraw: 'Withdraw',
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusClass(status: string) {
  if (/拒绝|失败|denied|failed/i.test(status)) return 'text-trading-down'
  if (/成功|success|approved/i.test(status)) return 'text-trading-up'
  return 'text-muted-strong'
}
</script>

<template>
  <section
    :class="isLedger ? 'overflow-hidden rounded-lg border border-hairline bg-surface' : ''"
    aria-labelledby="recent-logs-heading"
  >
    <div
      class="flex items-center justify-between gap-4"
      :class="isLedger ? 'border-b border-hairline px-5 py-4' : ''"
    >
      <div>
        <h2 id="recent-logs-heading" class="text-base font-semibold text-on-dark">
          {{ isLedger ? '审计轨迹' : '近期执行' }}
        </h2>
        <p v-if="isLedger" class="mt-0.5 text-xs text-muted">
          Agent 动作、tx hash 与 Pact 拒绝记录
        </p>
      </div>
      <NuxtLink
        :to="DASHBOARD_HISTORY"
        class="shrink-0 text-xs font-semibold text-primary no-underline hover:text-primary-active"
      >
        查看全部
      </NuxtLink>
    </div>

    <div v-if="loading && logs.length === 0" class="mt-4 h-32 animate-pulse rounded-lg bg-surface-elevated" :class="isLedger ? 'mx-5 mb-5' : ''" />

    <p v-else-if="logs.length === 0" class="mt-4 text-sm text-muted" :class="isLedger ? 'px-5 pb-5' : ''">
      暂无执行记录。Pact 生效后的 Agent 动作与拒绝将出现在此。
    </p>

    <div
      v-else
      class="overflow-x-auto"
      :class="isLedger ? '' : 'mt-4 rounded-lg border border-hairline'"
    >
      <table class="w-full min-w-[540px] text-left text-sm">
        <thead>
          <tr
            class="border-b border-hairline text-xs text-muted-strong"
            :class="isLedger ? 'bg-canvas' : 'bg-surface text-muted'"
          >
            <th class="px-5 py-2.5 font-medium" scope="col">时间</th>
            <th class="px-5 py-2.5 font-medium" scope="col">动作</th>
            <th class="px-5 py-2.5 font-medium" scope="col">类型</th>
            <th class="px-5 py-2.5 font-medium" scope="col">Tx</th>
            <th class="px-5 py-2.5 font-medium" scope="col">状态</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="log in logs"
            :key="log.id"
            class="border-b border-hairline last:border-0 transition-colors hover:bg-surface-elevated/40"
          >
            <td class="whitespace-nowrap px-5 py-2.5 font-mono text-xs text-muted">
              {{ formatTime(log.timestamp) }}
            </td>
            <td class="max-w-[220px] truncate px-5 py-2.5 text-body" :title="log.action">
              {{ log.action }}
            </td>
            <td class="px-5 py-2.5 font-mono text-xs text-muted-strong">{{ TYPE_LABELS[log.type] }}</td>
            <td class="px-5 py-2.5">
              <UiTxLink v-if="log.txHash" :hash="log.txHash" />
              <span v-else class="text-xs text-muted">—</span>
            </td>
            <td class="px-5 py-2.5 text-xs font-medium" :class="statusClass(log.status)">
              {{ log.status }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
