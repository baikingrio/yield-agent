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
  variant?: 'default' | 'rail'
}>()

const isRail = computed(() => props.variant === 'rail')

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
  <section
    :class="isRail ? 'rounded-lg border border-hairline bg-surface px-4 py-3' : ''"
    aria-labelledby="strategies-heading"
  >
    <div class="flex items-center justify-between gap-3">
      <h2 id="strategies-heading" class="text-sm font-semibold text-on-dark">策略</h2>
      <NuxtLink
        v-if="isRail && strategies.length > 0"
        :to="DASHBOARD_CREATE_STRATEGY"
        class="text-xs font-semibold text-primary no-underline hover:text-primary-active"
      >
        新建
      </NuxtLink>
    </div>

    <div v-if="loading && strategies.length === 0" class="mt-3 space-y-2">
      <div v-for="i in 2" :key="i" class="h-12 animate-pulse rounded-md bg-surface-elevated" />
    </div>

    <div
      v-else-if="strategies.length === 0"
      class="mt-3 rounded-md border border-dashed border-hairline px-4 py-5 text-center"
    >
      <p class="text-xs text-muted">尚无策略</p>
      <NuxtLink
        :to="DASHBOARD_CREATE_STRATEGY"
        class="mt-3 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-xs font-semibold text-on-primary no-underline hover:bg-primary-active"
      >
        创建策略
      </NuxtLink>
    </div>

    <ul v-else class="mt-3 divide-y divide-hairline border-t border-hairline">
      <li v-for="s in strategies" :key="s.id">
        <button
          type="button"
          class="w-full py-2.5 text-left transition-colors hover:bg-surface-elevated/40"
          @click="goToPact(s.pactId)"
        >
          <div class="flex items-start justify-between gap-2">
            <span class="truncate text-sm font-medium text-on-dark">{{ s.name }}</span>
            <div class="flex shrink-0 flex-wrap items-center gap-1">
              <UiStatusChip
                v-if="pactForStrategy(s)?.status === 'awaiting-approval'"
                label="待审批"
                tone="pending"
              />
              <UiStatusChip :label="STATUS_LABELS[s.status]" :tone="STATUS_TONE[s.status]" />
            </div>
          </div>
          <p class="mt-1 font-mono text-xs text-muted">
            {{ NETWORK_LABELS[s.network] }} · {{ s.maxSpend }} {{ s.asset }}
          </p>
        </button>
      </li>
    </ul>
  </section>
</template>
