<script setup lang="ts">
import { DASHBOARD_CREATE_STRATEGY, DASHBOARD_PACTS } from '#shared/constants/dashboard-routes'
import type { Pact, Strategy } from '../../../shared/types/app'
import { formatLivePactSummary, listLivePacts } from '~/utils/active-pact'

const props = defineProps<{
  pacts: Pact[]
  strategies: Strategy[]
  loading?: boolean
}>()

const livePacts = computed(() => listLivePacts(props.pacts, props.strategies))
const summaryLabel = computed(() => formatLivePactSummary(props.pacts))
</script>

<template>
  <section
    class="overflow-hidden rounded-lg border border-hairline bg-surface"
    aria-labelledby="active-pact-heading"
  >
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-4">
      <div>
        <h2 id="active-pact-heading" class="text-base font-semibold text-on-dark">Pact 边界</h2>
        <p v-if="livePacts.length" class="mt-0.5 text-xs text-muted">{{ summaryLabel }}</p>
      </div>
      <NuxtLink
        v-if="livePacts.length > 1"
        :to="DASHBOARD_PACTS"
        class="text-xs font-semibold text-primary no-underline hover:text-primary-active"
      >
        全部 Pact
      </NuxtLink>
    </div>

    <div v-if="loading" class="px-5 py-6">
      <div class="h-24 animate-pulse rounded-md bg-surface-elevated" />
    </div>

    <div v-else-if="!livePacts.length" class="space-y-4 px-5 py-6">
      <p class="text-sm text-body">
        尚无生效中或待审批的 Pact。创建策略后，各策略的支出上限、Recipe 白名单与期限将列在此处。
      </p>
      <NuxtLink
        :to="`${DASHBOARD_CREATE_STRATEGY}?template=conservative-usdc`"
        class="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary no-underline transition-colors hover:bg-primary-active"
      >
        创建首个策略
      </NuxtLink>
    </div>

    <div v-else>
      <DashboardPactBoundaryEntry
        v-for="view in livePacts"
        :key="view.pact.id"
        :view="view"
        :compact-header="livePacts.length > 1"
      />
    </div>
  </section>
</template>
