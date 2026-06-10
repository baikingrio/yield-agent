<script setup lang="ts">
import { DASHBOARD_PACTS } from '#shared/constants/dashboard-routes'
import type { WalletSummary } from '../../../shared/types/app'

const props = defineProps<{
  wallet: WalletSummary | null
  loading?: boolean
}>()

const copiedAgent = ref(false)
const copiedEoa = ref(false)
const fundsExpanded = ref(false)

const {
  prep,
  coboConfigured,
  fundsUnlocked,
  topUpAmount,
  withdrawAmount,
  topUpLabel,
  withdrawLabel,
  gasFundLabel,
  pageError,
  withdrawInfo,
  withdrawInfoLoading,
  gasStatus,
  gasStatusLoading,
  fundingGas,
  eoaConnected,
  busy,
  isWriting,
  loadFundsPanel,
  topUp,
  withdraw,
  fundGas,
  settingsPath,
} = useWalletFunds()

const shortAddress = computed(() => {
  const a = props.wallet?.address
  if (!a) return '—'
  return `${a.slice(0, 6)}…${a.slice(-4)}`
})

const shortEoa = computed(() => {
  const a = prep.value?.eoa.address
  if (!a) return '—'
  return `${a.slice(0, 6)}…${a.slice(-4)}`
})

async function copyText(text: string, target: 'agent' | 'eoa') {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    if (target === 'agent') {
      copiedAgent.value = true
      setTimeout(() => { copiedAgent.value = false }, 2000)
    } else {
      copiedEoa.value = true
      setTimeout(() => { copiedEoa.value = false }, 2000)
    }
  } catch {
    /* ignore */
  }
}

watch(fundsExpanded, (open) => {
  if (open && fundsUnlocked.value) {
    void loadFundsPanel()
  }
})

watch(fundsUnlocked, (ready) => {
  if (ready && fundsExpanded.value) {
    void loadFundsPanel()
  }
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
          @click="copyText(wallet.address, 'agent')"
        >
          {{ shortAddress }}
        </button>
        <span v-if="copiedAgent" class="text-xs text-trading-up">已复制</span>
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

      <div v-if="fundsUnlocked" class="mt-5 border-t border-hairline pt-4">
        <button
          type="button"
          class="flex w-full items-center justify-between text-left text-sm font-medium text-on-dark"
          :aria-expanded="fundsExpanded"
          @click="fundsExpanded = !fundsExpanded"
        >
          资金管理
          <span class="text-xs text-muted">{{ fundsExpanded ? '收起' : '展开' }}</span>
        </button>

        <div v-if="fundsExpanded" class="mt-4 space-y-4">
          <p
            v-if="!coboConfigured"
            class="rounded-md border border-trading-down/30 bg-canvas px-3 py-2 text-xs text-trading-down"
          >
            需要 Cobo API Key 才能充提与校验余额。
            <NuxtLink :to="settingsPath" class="font-medium text-primary hover:underline">前往设置</NuxtLink>
          </p>

          <p
            v-if="pageError"
            class="rounded-md border border-trading-down/30 bg-canvas px-3 py-2 text-xs text-trading-down"
            role="alert"
          >
            {{ pageError }}
          </p>

          <div class="rounded-md border border-hairline bg-canvas p-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 class="text-sm font-medium text-on-dark">Gas 余额</h3>
                <p class="mt-1 text-xs text-muted">
                  Recipe 执行与 USDC 提取需要 {{ gasStatus?.nativeTokenLabel ?? '测试网 ETH' }} 支付链上 Gas。
                </p>
              </div>
              <UiStatusChip
                v-if="gasStatus && !gasStatusLoading"
                :label="gasStatus.ready ? 'Gas 就绪' : 'Gas 不足'"
                :tone="gasStatus.ready ? 'active' : 'pending'"
              />
            </div>

            <div v-if="gasStatusLoading" class="mt-3 animate-pulse space-y-2">
              <div class="h-4 w-40 rounded bg-surface-elevated" />
              <div class="h-4 w-56 rounded bg-surface-elevated" />
            </div>
            <template v-else-if="gasStatus">
              <dl class="mt-3 space-y-2 text-xs">
                <div class="flex justify-between gap-3">
                  <dt class="text-muted">{{ gasStatus.networkLabel }} 余额</dt>
                  <dd class="font-mono text-on-dark">{{ gasStatus.ethBalance }} ETH</dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="text-muted">最低要求</dt>
                  <dd class="font-mono text-on-dark">{{ gasStatus.minEth }} ETH</dd>
                </div>
              </dl>

              <p
                v-if="gasStatus.wrongChainHint"
                class="mt-3 rounded-md border border-trading-down/30 bg-surface px-3 py-2 text-xs text-trading-down"
              >
                {{ gasStatus.wrongChainHint.message }}
              </p>

              <p
                v-else-if="!gasStatus.ready"
                class="mt-3 text-xs text-muted"
              >
                请从 EOA 向 Agent Wallet 转入至少 {{ gasStatus.minEth }} {{ gasStatus.nativeTokenLabel }}，或使用测试网水龙头领取。
              </p>

              <div class="mt-3 flex flex-wrap gap-2">
                <ClientOnly>
                  <button
                    type="button"
                    class="inline-flex h-9 items-center rounded-md bg-primary px-3 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-active disabled:opacity-50"
                    :disabled="busy || fundingGas || !eoaConnected"
                    @click="fundGas"
                  >
                    {{ gasFundLabel }}
                  </button>
                  <template #fallback>
                    <span class="text-xs text-muted">加载钱包…</span>
                  </template>
                </ClientOnly>
                <a
                  v-if="gasStatus.faucetUrl"
                  :href="gasStatus.faucetUrl"
                  class="inline-flex h-9 items-center rounded-md border border-hairline bg-surface px-3 text-xs text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  打开水龙头
                </a>
              </div>
            </template>
          </div>

          <div class="grid gap-4 lg:grid-cols-2">
            <div class="rounded-md border border-hairline bg-canvas p-4">
              <h3 class="text-sm font-medium text-on-dark">补充资金</h3>
              <p class="mt-1 text-xs text-muted">从 EOA 向 Agent Wallet 转入 USDC，服务端校验交易后以 Cobo 余额为准刷新。</p>

              <div v-if="wallet.address" class="mt-3 rounded-md bg-surface px-3 py-2 text-xs">
                <span class="text-muted">Agent 收款地址</span>
                <div class="mt-1 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    class="font-mono text-body hover:text-primary"
                    @click="copyText(wallet.address, 'agent')"
                  >
                    {{ wallet.address.slice(0, 10) }}…{{ wallet.address.slice(-6) }}
                  </button>
                  <span v-if="copiedAgent" class="text-trading-up">已复制</span>
                </div>
              </div>

              <form class="mt-3 space-y-3" @submit.prevent="topUp">
                <div>
                  <label for="topup-amount" class="mb-1 block text-xs text-muted-strong">金额 (USDC)</label>
                  <input
                    id="topup-amount"
                    v-model="topUpAmount"
                    type="number"
                    min="10"
                    max="10000"
                    step="1"
                    class="h-10 w-full rounded-md border border-hairline bg-surface px-3 font-mono text-sm text-on-dark"
                    :disabled="busy || isWriting"
                  />
                </div>
                <ClientOnly>
                  <button
                    type="submit"
                    class="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active disabled:opacity-50"
                    :disabled="busy || isWriting || !coboConfigured"
                  >
                    {{ topUpLabel }}
                  </button>
                  <template #fallback>
                    <p class="text-xs text-muted">加载钱包转账…</p>
                  </template>
                </ClientOnly>
              </form>
            </div>

            <div class="rounded-md border border-hairline bg-canvas p-4">
              <h3 class="text-sm font-medium text-on-dark">提取资金</h3>
              <p class="mt-1 text-xs text-muted">仅可提取 Agent Wallet 内 idle USDC；协议内仓位需先赎回。</p>

              <div v-if="withdrawInfoLoading" class="mt-3 animate-pulse space-y-2">
                <div class="h-4 w-32 rounded bg-surface-elevated" />
                <div class="h-4 w-40 rounded bg-surface-elevated" />
              </div>
              <dl v-else-if="withdrawInfo" class="mt-3 space-y-2 text-xs">
                <div class="flex justify-between gap-3">
                  <dt class="text-muted">可提 USDC</dt>
                  <dd class="font-mono text-on-dark">
                    {{ withdrawInfo.liquidUsdc.toLocaleString('zh-CN', { maximumFractionDigits: 2 }) }}
                  </dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="text-muted">协议内 USDC</dt>
                  <dd class="font-mono text-on-dark">
                    {{ withdrawInfo.suppliedUsdc.toLocaleString('zh-CN', { maximumFractionDigits: 2 }) }}
                  </dd>
                </div>
                <div class="flex justify-between gap-3">
                  <dt class="text-muted">提取至 EOA</dt>
                  <dd class="font-mono text-on-dark">{{ shortEoa }}</dd>
                </div>
              </dl>

              <p
                v-if="withdrawInfo && withdrawInfo.suppliedUsdc > 0"
                class="mt-3 rounded-md border border-hairline bg-surface px-3 py-2 text-xs text-muted"
              >
                协议内 USDC 无法直接提取。请先在
                <NuxtLink :to="DASHBOARD_PACTS" class="font-medium text-primary hover:underline">Pact 管理</NuxtLink>
                赎回后再提取 idle 余额。
              </p>

              <form class="mt-3 space-y-3" @submit.prevent="withdraw">
                <div>
                  <label for="withdraw-amount" class="mb-1 block text-xs text-muted-strong">金额 (USDC)</label>
                  <input
                    id="withdraw-amount"
                    v-model="withdrawAmount"
                    type="number"
                    min="10"
                    max="10000"
                    step="1"
                    class="h-10 w-full rounded-md border border-hairline bg-surface px-3 font-mono text-sm text-on-dark"
                    :disabled="busy || withdrawInfoLoading"
                  />
                </div>
                <button
                  type="submit"
                  class="inline-flex h-10 w-full items-center justify-center rounded-md border border-hairline bg-surface px-4 text-sm font-semibold text-on-dark transition-colors hover:border-primary disabled:opacity-50"
                  :disabled="busy || withdrawInfoLoading || !coboConfigured || !withdrawInfo"
                >
                  {{ withdrawLabel }}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>
