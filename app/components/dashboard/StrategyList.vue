<script setup lang="ts">
import {
  DASHBOARD_CREATE_STRATEGY,
  DASHBOARD_PACTS,
} from '#shared/constants/dashboard-routes'
import { NETWORK_LABELS } from '#shared/types/app'
import type { Pact, Strategy } from '#shared/types/app'

const props = defineProps<{
  strategies: Strategy[]
  pacts?: Pact[]
  loading?: boolean
}>()

function pactForStrategy(strategy: Strategy): Pact | undefined {
  return props.pacts?.find((p) => p.id === strategy.pactId || p.coboPactId === strategy.pactId)
}

const STATUS_LABELS: Record<Strategy['status'], string> = {
  active: '运行中',
  paused: '已暂停',
  completed: '已完成',
}

const STATUS_TONE: Record<Strategy['status'], 'active' | 'paused' | 'neutral'> = {
  active: 'active',
  paused: 'paused',
  completed: 'neutral',
}

function goToPact(pactId: string) {
  navigateTo(`${DASHBOARD_PACTS}?id=${pactId}`)
}
</script>

<template>
  <section aria-labelledby="strategies-heading">
    <h2 id="strategies-heading" class="text-base font-semibold text-on-dark">策略</h2>

    <div v-if="loading && strategies.length === 0" class="mt-4 space-y-3">
      <div v-for="i in 2" :key="i" class="h-20 animate-pulse rounded-lg bg-surface" />
    </div>

    <div
      v-else-if="strategies.length === 0"
      class="mt-4 rounded-lg border border-dashed border-hairline px-5 py-8 text-center"
    >
      <p class="text-sm text-muted">尚无策略。创建第一条受 Pact 约束的策略。</p>
      <NuxtLink
        :to="DASHBOARD_CREATE_STRATEGY"
        class="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-on-primary no-underline hover:bg-primary-active"
      >
        创建策略
      </NuxtLink>
    </div>

    <ul v-else class="mt-4 space-y-3">
      <li v-for="s in strategies" :key="s.id">
        <button
          type="button"
          class="w-full rounded-lg border border-hairline bg-surface px-4 py-3 text-left transition-colors hover:border-muted/50"
          @click="goToPact(s.pactId)"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <span class="text-sm font-medium text-on-dark">{{ s.name }}</span>
            <div class="flex flex-wrap items-center gap-2">
              <UiStatusChip
                v-if="pactForStrategy(s)?.status === 'awaiting-approval'"
                label="待 Cobo App 审批"
                tone="pending"
              />
              <UiStatusChip :label="STATUS_LABELS[s.status]" :tone="STATUS_TONE[s.status]" />
            </div>
          </div>
          <p class="mt-2 font-mono text-xs text-muted">
            {{ NETWORK_LABELS[s.network] }} · 上限 {{ s.maxSpend }} {{ s.asset }}
          </p>
        </button>
      </li>
    </ul>
  </section>
</template>
