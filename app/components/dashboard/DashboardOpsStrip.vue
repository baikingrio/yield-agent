<script setup lang="ts">
import { DASHBOARD_CREATE_STRATEGY, DASHBOARD_PACTS } from '#shared/constants/dashboard-routes'
import { NETWORK_LABELS } from '#shared/types/app'
import type { Pact, WalletSummary } from '../../../shared/types/app'
import { formatLivePactSummary, listLivePacts } from '~/utils/active-pact'

const props = defineProps<{
  wallet: WalletSummary | null
  pacts: Pact[]
  loading?: boolean
}>()

const emit = defineEmits<{
  refresh: []
}>()

const store = useAppStore()
const network = computed(() => store.settings?.network ?? store.preparation?.network ?? 'base-sepolia')
const networkLabel = computed(() => NETWORK_LABELS[network.value] ?? network.value)

const livePacts = computed(() => listLivePacts(props.pacts, store.strategies))

const pactStatusLabel = computed(() => formatLivePactSummary(props.pacts))

const hasActivePact = computed(() => livePacts.value.some((v) => v.pact.status === 'active'))

const shortAgent = computed(() => {
  const a = props.wallet?.address
  if (!a) return '—'
  return `${a.slice(0, 6)}…${a.slice(-4)}`
})

const refreshedAt = ref<string>('')

function markRefreshed() {
  refreshedAt.value = new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

watch(() => props.loading, (isLoading, wasLoading) => {
  if (wasLoading && !isLoading) markRefreshed()
})

onMounted(() => {
  if (!props.loading) markRefreshed()
})
</script>

<template>
  <header class="space-y-4">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0 space-y-1">
        <h1 class="text-balance text-[clamp(1.375rem,2.5vw,1.75rem)] font-semibold leading-tight tracking-[-0.02em] text-on-dark">
          控制台
        </h1>
        <p class="max-w-[52ch] text-sm text-body">
          Pact 边界与 Agent 执行记录优先；收益曲线仅作辅助参考。
        </p>
      </div>
      <button
        type="button"
        class="inline-flex h-9 shrink-0 items-center rounded-md border border-hairline bg-surface px-3 text-xs font-semibold text-on-dark transition-colors hover:bg-surface-elevated disabled:opacity-50"
        :disabled="loading"
        @click="emit('refresh')"
      >
        {{ loading ? '同步中…' : '刷新数据' }}
      </button>
    </div>

    <div
      class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-hairline bg-surface px-4 py-3 font-mono text-xs"
      role="status"
      aria-live="polite"
    >
      <span class="text-muted-strong">{{ networkLabel }} · 测试网</span>
      <span class="hidden text-hairline sm:inline" aria-hidden="true">|</span>
      <span class="text-muted">
        Agent
        <span class="text-on-dark">{{ shortAgent }}</span>
      </span>
      <span class="hidden text-hairline sm:inline" aria-hidden="true">|</span>
      <span
        class="text-muted-strong"
        :class="hasActivePact ? 'text-trading-up' : undefined"
      >
        {{ livePacts.length ? pactStatusLabel : '无 Live Pact' }}
      </span>
      <span v-if="refreshedAt" class="ml-auto text-muted">
        更新 {{ refreshedAt }}
      </span>
    </div>

    <div v-if="!livePacts.length && !loading" class="flex flex-wrap gap-2">
      <NuxtLink
        :to="`${DASHBOARD_CREATE_STRATEGY}?template=conservative-usdc`"
        class="inline-flex h-9 items-center rounded-md bg-primary px-4 text-xs font-semibold text-on-primary no-underline transition-colors hover:bg-primary-active"
      >
        创建首个策略
      </NuxtLink>
      <NuxtLink
        :to="DASHBOARD_PACTS"
        class="inline-flex h-9 items-center rounded-md border border-hairline bg-surface px-4 text-xs font-semibold text-on-dark no-underline transition-colors hover:bg-surface-elevated"
      >
        打开 Pact 管理
      </NuxtLink>
    </div>
  </header>
</template>
