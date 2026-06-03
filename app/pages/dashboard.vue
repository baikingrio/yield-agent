<script setup lang="ts">
import type { YieldRange } from '../../shared/types/demo'

useHead({ title: 'Demo 控制台 · YieldAgent' })

const route = useRoute()
const router = useRouter()
const store = useDemoStore()

const showCreated = ref(false)
const initialLoading = ref(true)

useDashboardPoll()

async function loadDashboard() {
  store.clearError()
  store.loading = true
  try {
    await Promise.all([
      store.fetchWallet(),
      store.fetchStrategies(),
      store.fetchLogs({ limit: 10 }),
      store.fetchYieldSeries(),
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
  <main class="mx-auto max-w-5xl space-y-8 px-4 py-6 md:px-6 md:py-8">
    <header>
      <h1 class="text-2xl font-semibold text-on-dark">控制台</h1>
      <p class="mt-2 max-w-prose text-sm text-muted">
        Agent 钱包、策略与可审计执行记录。收益图为辅助信息，Pact 边界优先。
      </p>
    </header>

    <div
      v-if="showCreated"
      class="rounded-md border border-trading-up/30 bg-surface px-4 py-3 text-sm text-trading-up"
      role="status"
    >
      策略已创建，可在下方列表或 Pact 管理中查看。
    </div>

    <UiPageAlert
      v-if="store.error"
      :message="store.error"
      @retry="loadDashboard"
    />

    <DashboardWalletBar :wallet="store.wallet" :loading="initialLoading" />

    <DashboardYieldChart
      :series="store.yieldSeries"
      :loading="initialLoading"
      :range="store.yieldRange"
      @update:range="onRangeChange"
    />

    <DashboardStrategyList :strategies="store.strategies" :loading="initialLoading" />

    <DashboardRecentLogsTable :logs="store.logs" :loading="initialLoading" />
  </main>
</template>
