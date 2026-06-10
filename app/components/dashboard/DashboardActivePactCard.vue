<script setup lang="ts">
import { DASHBOARD_CREATE_STRATEGY, DASHBOARD_PACTS } from '#shared/constants/dashboard-routes'
import type { Pact, Strategy } from '../../../shared/types/app'
import { pickActivePact } from '~/utils/active-pact'

const props = defineProps<{
  pacts: Pact[]
  strategies: Strategy[]
  loading?: boolean
}>()

const view = computed(() => pickActivePact(props.pacts, props.strategies))

const statusLabel = computed(() => {
  const status = view.value?.pact.status
  if (status === 'active') return '生效中'
  if (status === 'awaiting-approval') return '待 Cobo App 审批'
  if (status === 'pending') return '待审批'
  return status ?? '—'
})
</script>

<template>
  <section class="rounded-lg border border-hairline bg-surface p-5">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="font-mono text-xs text-muted-strong">Pact 边界</p>
        <h2 class="mt-1 text-lg font-semibold text-on-dark">当前 Active Pact</h2>
      </div>
      <UiStatusChip
        v-if="view"
        :label="statusLabel"
        :tone="view.pact.status === 'active' ? 'active' : 'pending'"
      />
    </div>

    <div v-if="loading" class="mt-4 h-20 animate-pulse rounded-md bg-surface-elevated" />

    <div v-else-if="!view" class="mt-4 space-y-3 text-sm text-muted">
      <p>暂无生效中的 Pact。创建策略后将在此展示支出上限与白名单。</p>
      <NuxtLink
        :to="`${DASHBOARD_CREATE_STRATEGY}?template=conservative-usdc`"
        class="inline-flex text-sm font-medium text-primary no-underline hover:text-primary-active"
      >
        创建首个策略 →
      </NuxtLink>
    </div>

    <dl v-else class="mt-4 grid gap-3 sm:grid-cols-2">
      <div class="rounded-md border border-hairline bg-surface-elevated p-3">
        <dt class="text-xs text-muted">最大支出</dt>
        <dd class="mt-1 font-mono text-sm text-on-dark">{{ view.pact.maxSpend }} USDC</dd>
      </div>
      <div class="rounded-md border border-hairline bg-surface-elevated p-3">
        <dt class="text-xs text-muted">运行期限</dt>
        <dd class="mt-1 text-sm text-on-dark">{{ view.pact.durationDays }} 天</dd>
      </div>
      <div class="rounded-md border border-hairline bg-surface-elevated p-3 sm:col-span-2">
        <dt class="text-xs text-muted">允许 Recipes</dt>
        <dd class="mt-2 flex flex-wrap gap-2">
          <span
            v-for="recipe in view.pact.whitelist"
            :key="recipe"
            class="rounded-full border border-hairline px-2 py-0.5 font-mono text-xs text-body"
          >
            {{ recipe }}
          </span>
          <span v-if="!view.pact.whitelist.length" class="text-sm text-muted">—</span>
        </dd>
      </div>
    </dl>

    <NuxtLink
      v-if="view"
      :to="`${DASHBOARD_PACTS}?id=${view.pact.id}`"
      class="mt-4 inline-flex text-xs font-medium text-primary no-underline hover:text-primary-active"
    >
      查看 Pact 详情 →
    </NuxtLink>
  </section>
</template>
