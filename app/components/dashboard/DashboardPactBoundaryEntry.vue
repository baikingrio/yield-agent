<script setup lang="ts">
import { DASHBOARD_PACTS } from '#shared/constants/dashboard-routes'
import { NETWORK_LABELS } from '#shared/types/app'
import type { ActivePactView } from '~/utils/active-pact'
import { pactStatusLabel, pactStatusTone } from '~/utils/active-pact'

const props = defineProps<{
  view: ActivePactView
  compactHeader?: boolean
}>()

const networkLabel = computed(() => {
  const net = props.view.strategy?.network
  return net ? (NETWORK_LABELS[net] ?? net) : '—'
})

const title = computed(() => {
  const { strategy, pact } = props.view
  return strategy?.name || pact.intent || '未命名策略'
})
</script>

<template>
  <article class="border-b border-hairline last:border-b-0">
    <div
      class="flex flex-wrap items-center justify-between gap-3"
      :class="compactHeader ? 'px-5 py-3.5' : 'border-b border-hairline px-5 py-3.5'"
    >
      <div class="min-w-0">
        <h3 class="truncate text-sm font-semibold text-on-dark">{{ title }}</h3>
        <p v-if="view.pact.intent && view.strategy" class="mt-0.5 truncate text-xs text-muted">
          {{ view.pact.intent }}
        </p>
      </div>
      <UiStatusChip
        :label="pactStatusLabel(view.pact.status)"
        :tone="pactStatusTone(view.pact.status)"
      />
    </div>

    <dl class="divide-y divide-hairline">
      <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3">
        <dt class="text-xs text-muted-strong">最大支出</dt>
        <dd class="font-mono text-sm font-medium text-on-dark">{{ view.pact.maxSpend }} USDC</dd>
      </div>
      <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3">
        <dt class="text-xs text-muted-strong">运行网络</dt>
        <dd class="text-sm text-on-dark">{{ networkLabel }}</dd>
      </div>
      <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3">
        <dt class="text-xs text-muted-strong">运行期限</dt>
        <dd class="font-mono text-sm text-on-dark">{{ view.pact.durationDays }} 天</dd>
      </div>
      <div class="px-5 py-3">
        <dt class="text-xs text-muted-strong">允许 Recipes</dt>
        <dd class="mt-2 flex flex-wrap gap-1.5">
          <span
            v-for="recipe in view.pact.whitelist"
            :key="recipe"
            class="rounded-sm bg-surface-elevated px-2 py-0.5 font-mono text-xs text-body"
          >
            {{ recipe }}
          </span>
          <span v-if="!view.pact.whitelist.length" class="text-sm text-muted">—</span>
        </dd>
      </div>
      <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3">
        <dt class="text-xs text-muted-strong">收益分账</dt>
        <dd class="font-mono text-sm text-on-dark">
          用户 {{ view.pact.userSplitPercent }}% · Agent {{ view.pact.agentFeePercent }}%
        </dd>
      </div>
    </dl>

    <div class="border-t border-hairline px-5 py-2.5">
      <NuxtLink
        :to="`${DASHBOARD_PACTS}?id=${view.pact.id}`"
        class="text-xs font-semibold text-primary no-underline hover:text-primary-active"
      >
        查看详情与执行 →
      </NuxtLink>
    </div>
  </article>
</template>
