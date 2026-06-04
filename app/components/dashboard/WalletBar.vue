<script setup lang="ts">
import type { WalletSummary } from '../../../shared/types/demo'

const props = defineProps<{
  wallet: WalletSummary | null
  loading?: boolean
}>()

const copied = ref(false)

async function copyAddress() {
  if (!props.wallet?.address) return
  try {
    await navigator.clipboard.writeText(props.wallet.address)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    /* ignore */
  }
}

const shortAddress = computed(() => {
  const a = props.wallet?.address
  if (!a) return '—'
  return `${a.slice(0, 6)}…${a.slice(-4)}`
})
</script>

<template>
  <section
    class="rounded-lg border border-hairline bg-surface px-5 py-4"
    aria-label="Agent 钱包"
  >
    <div v-if="loading && !wallet" class="animate-pulse space-y-3">
      <div class="h-4 w-48 rounded bg-surface-elevated" />
      <div class="grid grid-cols-3 gap-4">
        <div v-for="i in 3" :key="i" class="h-10 rounded bg-surface-elevated" />
      </div>
    </div>
    <template v-else-if="wallet">
      <div class="flex flex-wrap items-center gap-3">
        <span class="text-xs text-muted">CAW Agent Wallet</span>
        <button
          type="button"
          class="font-mono text-sm text-on-dark transition-colors hover:text-primary"
          :title="wallet.address"
          @click="copyAddress"
        >
          {{ shortAddress }}
        </button>
        <span v-if="copied" class="text-xs text-trading-up">已复制</span>
        <span class="rounded-sm bg-surface-elevated px-2 py-1 font-mono text-[0.65rem] text-muted-strong">测试网 USDC</span>
      </div>
      <p class="mt-3 text-xs leading-5 text-muted">
        资金由 EOA 转入 Agent Wallet（测试网）。Agent 只能在 Active Pact 的 maxSpend 与白名单 Recipe 内操作。
      </p>
      <dl class="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <dt class="text-xs text-muted">Agent Wallet 余额 (USDC)</dt>
          <dd class="mt-1 font-mono text-sm text-on-dark">
            {{ wallet.totalAssetsUsdc.toLocaleString('zh-CN', { maximumFractionDigits: 2 }) }}
          </dd>
        </div>
        <div>
          <dt class="text-xs text-muted">当前 APY</dt>
          <dd class="mt-1 font-mono text-sm text-on-dark">{{ wallet.currentApy }}%</dd>
        </div>
        <div>
          <dt class="text-xs text-muted">累计收益 (USDC)</dt>
          <dd class="mt-1 font-mono text-sm text-trading-up">
            {{ wallet.cumulativeYieldUsdc.toLocaleString('zh-CN', { maximumFractionDigits: 2 }) }}
          </dd>
        </div>
      </dl>
    </template>
  </section>
</template>
