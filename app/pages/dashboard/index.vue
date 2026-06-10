<script setup lang="ts">
import type { YieldRange } from '#shared/types/app'

useHead({ title: '控制台 · YieldAgent' })

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const showCreated = ref(false)
const initialLoading = ref(true)

async function loadDashboard() {
  store.clearError()
  store.loading = true
  try {
    await Promise.all([
      store.fetchWallet(),
      store.fetchStrategies(),
      store.fetchPacts(),
      store.fetchLogs({ limit: 10 }),
      store.fetchYieldSeries(undefined, { sync: true }),
    ])
  } finally {
    store.loading = false
    initialLoading.value = false
  }
}

async function onRangeChange(range: YieldRange) {
  await store.fetchYieldSeries(range)
}

onMounted(async () => {
  await loadDashboard()
  if (route.query.created === '1') {
    showCreated.value = true
    router.replace({ query: {} })
  }
})
</script>

<template>
  <div class="mx-auto max-w-7xl">
    <DashboardOpsStrip
      :wallet="store.wallet"
      :pacts="store.pacts"
      :loading="initialLoading"
      @refresh="loadDashboard"
    />

    <div
      v-if="showCreated"
      class="mt-4 rounded-md border border-trading-up/30 bg-surface px-4 py-3 text-sm text-trading-up"
      role="status"
    >
      策略已创建。可在下方审计轨迹或 Pact 管理中查看执行状态。
    </div>

    <UiPageAlert
      v-if="store.error"
      class="mt-4"
      :message="store.error"
      @retry="loadDashboard"
    />

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_min(100%,320px)] lg:items-start">
      <div class="min-w-0 space-y-6">
        <DashboardActivePactCard
          :pacts="store.pacts"
          :strategies="store.strategies"
          :loading="initialLoading"
        />

        <DashboardDenialDemoCard :pacts="store.pacts" />

        <DashboardRecentLogsTable
          :logs="store.logs"
          :loading="initialLoading"
          variant="ledger"
        />
      </div>

      <aside class="space-y-6 lg:sticky lg:top-[calc(3.5rem+1.5rem)]">
        <DashboardWalletBar
          :wallet="store.wallet"
          :loading="initialLoading"
          layout="rail"
        />

        <DashboardStrategyList
          :strategies="store.strategies"
          :pacts="store.pacts"
          :loading="initialLoading"
          variant="rail"
        />
      </aside>
    </div>

    <div class="mt-8 border-t border-hairline pt-8">
      <DashboardYieldChart
        :series="store.yieldSeries"
        :loading="initialLoading"
        :range="store.yieldRange"
        variant="secondary"
        @update:range="onRangeChange"
      />
    </div>
  </div>
</template>
