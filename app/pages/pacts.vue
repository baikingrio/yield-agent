<script setup lang="ts">
import type { PactFilterTab } from '~/composables/usePactManagement'

useHead({ title: 'Pact 管理 · YieldAgent' })

const {
  store,
  busy,
  loading,
  actionBanner,
  executeError,
  executing,
  waitingSeconds,
  statusFilter,
  filteredPacts,
  awaitingCount,
  selectedId,
  selectedPact,
  selectedStrategy,
  setStatusFilter,
  load,
  refreshStatus,
  approveLocalDraft,
  retryExecute,
  runFundAgentGas,
  runRedeemFunds,
  simulateDenial,
  terminateSelected,
  selectPact,
  gasStatus,
  fundingGas,
  eoaConnected,
  yieldPosition,
  redeeming,
  redeemError,
} = usePactManagement()

const pactLogs = ref<import('../../shared/types/demo').LogEntry[]>([])

const pairingReady = computed(
  () => store.preparation?.agentWallet.pairing?.status === 'paired',
)

const filterTabs: { key: PactFilterTab; label: string }[] = [
  { key: 'active', label: '执行中' },
  { key: 'awaiting-approval', label: '待审批' },
  { key: 'completed', label: '已完成' },
  { key: 'rejected', label: '已拒绝' },
  { key: 'expired', label: '已过期' },
  { key: 'all', label: '全部' },
]

async function loadPactLogs(pactId: string | null) {
  if (!pactId) {
    pactLogs.value = []
    return
  }
  try {
    pactLogs.value = await $fetch<import('../../shared/types/demo').LogEntry[]>('/api/logs', {
      query: { pactId, limit: 5 },
    })
  } catch {
    pactLogs.value = []
  }
}

watch(selectedId, (id) => {
  void loadPactLogs(id)
}, { immediate: true })

watch(actionBanner, () => {
  if (selectedId.value) void loadPactLogs(selectedId.value)
})
</script>

<template>
  <main class="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
    <header class="mb-6">
      <h1 class="text-2xl font-semibold text-on-dark">Pact 管理</h1>
      <p class="mt-2 text-sm text-muted">
        管理 CAW Pact 生命周期；待审批项需在 Cobo App 由主人批准。
      </p>
    </header>

    <div
      v-if="awaitingCount > 0 && statusFilter !== 'awaiting-approval'"
      class="mb-4 rounded-lg border border-[var(--color-status-pending)]/40 bg-surface px-4 py-3 text-sm text-body"
      role="status"
    >
      有 {{ awaitingCount }} 条 Pact 等待 Cobo App 审批。
      <button
        type="button"
        class="ml-1 font-medium text-primary hover:underline"
        @click="setStatusFilter('awaiting-approval')"
      >
        查看待审批
      </button>
    </div>

    <div
      v-if="actionBanner"
      class="mb-4 rounded-lg border px-4 py-3 text-sm"
      :class="{
        'border-trading-up/40 text-trading-up': actionBanner.tone === 'success',
        'border-trading-down/40 text-trading-down': actionBanner.tone === 'error',
        'border-hairline text-body': actionBanner.tone === 'info',
      }"
      role="status"
    >
      {{ actionBanner.message }}
    </div>

    <UiPageAlert v-if="store.error" :message="store.error" @retry="load()" />

    <div class="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Pact 状态筛选">
      <button
        v-for="tab in filterTabs"
        :key="tab.key"
        type="button"
        role="tab"
        class="rounded-full border px-3 py-1.5 text-sm transition-colors"
        :class="
          statusFilter === tab.key
            ? 'border-primary bg-primary/10 text-on-dark'
            : 'border-hairline text-muted hover:text-body'
        "
        :aria-selected="statusFilter === tab.key"
        @click="setStatusFilter(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="loading" class="h-64 animate-pulse rounded-lg bg-surface" />

    <div v-else-if="filteredPacts.length === 0" class="rounded-lg border border-dashed border-hairline px-5 py-12 text-center">
      <p class="text-sm text-muted">
        {{
          store.pacts.length === 0
            ? '尚无 Pact。完成钱包准备后创建策略，并在 Cobo App 审批通过后即可在此管理。'
            : '暂无符合筛选条件的 Pact。'
        }}
      </p>
      <NuxtLink to="/create-strategy" class="mt-4 inline-block text-sm font-medium text-primary hover:underline">
        创建策略
      </NuxtLink>
    </div>

    <div v-else class="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <PactsPactList
        :pacts="filteredPacts"
        :selected-id="selectedId"
        @select="selectPact"
      />
      <PactsPactDetail
        :pact="selectedPact"
        :strategy="selectedStrategy"
        :recent-logs="pactLogs"
        :busy="busy"
        :executing="executing"
        :execute-error="executeError"
        :waiting-seconds="waitingSeconds"
        :pairing-ready="pairingReady"
        :gas-status="gasStatus"
        :funding-gas="fundingGas"
        :eoa-connected="eoaConnected"
        :yield-position="yieldPosition"
        :redeeming="redeeming"
        :redeem-error="redeemError"
        @refresh="refreshStatus"
        @approve-local="approveLocalDraft"
        @execute="retryExecute"
        @fund-gas="runFundAgentGas"
        @redeem="runRedeemFunds"
        @simulate-denial="simulateDenial"
        @terminate="terminateSelected"
      />
    </div>
  </main>
</template>
