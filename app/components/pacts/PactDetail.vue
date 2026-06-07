<script setup lang="ts">
import type {
  AgentGasStatus,
  LogEntry,
  NetworkId,
  Pact,
  Strategy,
  YieldPositionSnapshot,
} from '../../../shared/types/demo'

const props = defineProps<{
  pact: Pact | null
  strategy?: Strategy | null
  recentLogs?: LogEntry[]
  busy?: boolean
  executing?: boolean
  executeError?: string
  waitingSeconds?: number
  pairingReady?: boolean
  gasStatus?: AgentGasStatus | null
  fundingGas?: boolean
  eoaConnected?: boolean
  yieldPosition?: YieldPositionSnapshot | null
  redeeming?: boolean
  redeemError?: string
}>()

const emit = defineEmits<{
  refresh: []
  approveLocal: []
  execute: []
  fundGas: []
  redeem: []
  simulateDenial: []
  terminate: []
}>()

import { pactDisplayStatusLabel } from '~/utils/pact-filter'

const store = useDemoStore()

const isCoboPact = computed(() => props.pact?.submissionMode === 'cobo')
const isLocalDraft = computed(() => props.pact?.submissionMode === 'local-draft')
const network = computed((): NetworkId => props.strategy?.network ?? 'base-sepolia')
const agentAddress = computed(() => store.walletPreparation.agentWallet.address)
const gasFaucetUrl = computed(() =>
  network.value === 'arbitrum-sepolia'
    ? 'https://faucet.quicknode.com/arbitrum/sepolia'
    : 'https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet',
)

function copyAgentAddress() {
  if (!agentAddress.value) return
  navigator.clipboard.writeText(agentAddress.value)
}

const canRefresh = computed(() => isCoboPact.value && props.pact?.status === 'awaiting-approval')
const canApproveLocal = computed(
  () => isLocalDraft.value && props.pact && ['pending', 'awaiting-approval'].includes(props.pact.status),
)
const canExecute = computed(() => {
  if (!props.pact || props.pact.submissionMode !== 'cobo' || props.pact.status !== 'active') return false
  return !props.pact.firstExecutionCompleted || !props.pact.firstExecutionTxHash?.trim()
})
const gasReady = computed(() => props.gasStatus?.ready ?? true)
const needsGas = computed(() => canExecute.value && props.gasStatus && !props.gasStatus.ready)
const canSimulateDenial = computed(
  () => props.pact?.submissionMode === 'cobo' && props.pact?.status === 'active',
)
const canWithdrawCoboPact = computed(
  () =>
    isCoboPact.value
    && props.pact
    && ['pending', 'awaiting-approval'].includes(props.pact.status),
)
const hasDepositedFunds = computed(
  () => Boolean(props.pact?.firstExecutionCompleted && props.pact?.firstExecutionTxHash?.trim()),
)
const canRedeem = computed(() => {
  if (!isCoboPact.value || !hasDepositedFunds.value || props.pact?.redeemCompleted) return false
  if (!props.yieldPosition?.redeemable) return false
  return props.pact?.status === 'active' || props.pact?.status === 'terminated'
})
const showOwnerRevokeGuide = computed(
  () => isCoboPact.value && props.pact?.status === 'active',
)
const showTerminatedRedeemGuide = computed(
  () => isCoboPact.value && props.pact?.status === 'terminated' && hasDepositedFunds.value && !props.pact.redeemCompleted,
)
const canTerminate = computed(() => {
  if (!props.pact || ['terminated', 'completed'].includes(props.pact.status)) return false
  if (isCoboPact.value) return false
  return true
})

const detailLines = computed(() => {
  if (!props.pact) return []
  const p = props.pact
  return [
    ...(props.strategy ? [{ label: '关联策略', value: props.strategy.name }] : []),
    ...(props.strategy ? [{ label: '网络', value: props.strategy.network }] : []),
    { label: '意图', value: p.intent },
    { label: '支出上限', value: `${p.maxSpend} USDC` },
    { label: '允许 Recipe', value: p.whitelist.join('、') },
    { label: '期限', value: `${p.durationDays} 天（测试网）` },
    {
      label: '收益分账',
      value: `用户 ${p.userSplitPercent}% · Agent ${100 - p.userSplitPercent}%`,
    },
    { label: 'Agent 绩效费', value: `${p.agentFeePercent}%` },
    { label: '提交模式', value: p.submissionMode === 'cobo' ? 'Cobo Pact' : '本地 Draft' },
    ...(p.coboPactId ? [{ label: 'Cobo Pact ID', value: p.coboPactId }] : []),
    ...(p.coboStatus ? [{ label: 'Cobo 状态', value: p.coboStatus }] : []),
    ...(p.submissionMessage ? [{ label: '状态说明', value: p.submissionMessage }] : []),
    ...(p.status === 'active'
      ? [{ label: '执行凭证', value: p.executionCredentialStored ? '已缓存' : '待同步' }]
      : []),
  ]
})
</script>

<template>
  <div v-if="!pact" class="rounded-lg border border-dashed border-hairline px-5 py-12 text-center text-sm text-muted">
    选择左侧 Pact 查看详情
  </div>
  <article v-else class="rounded-lg border border-hairline bg-surface">
    <header class="border-b border-hairline px-5 py-4">
      <div class="flex items-start justify-between gap-3">
        <h2 class="text-base font-semibold text-on-dark">Pact 详情</h2>
        <UiStatusChip :label="pactDisplayStatusLabel(pact)" />
      </div>
      <p class="mt-1 font-mono text-xs text-muted">ID: {{ pact.id }}</p>
    </header>

    <div v-if="pact.status === 'awaiting-approval'" class="border-b border-hairline px-5 py-4">
      <PactsPactAppApprovalGuide
        :pact="pact"
        :submission-message="pact.submissionMessage"
        :waiting-seconds="waitingSeconds"
        :pairing-ready="pairingReady"
      />
    </div>

    <div
      v-else-if="pact.status === 'active'"
      class="space-y-3 border-b border-hairline px-5 py-4"
    >
      <div v-if="needsGas" class="space-y-2 rounded-md border border-trading-down/30 bg-canvas px-3 py-2 text-xs text-body">
        <p>
          Agent Wallet 需要 {{ gasStatus?.nativeTokenLabel ?? '测试 ETH' }} 支付 Gas（{{ gasStatus?.networkLabel }} 余额
          {{ gasStatus?.ethBalance ?? '0' }} ETH，至少 {{ gasStatus?.minEth }} ETH）。
        </p>
        <p v-if="gasStatus?.wrongChainHint" class="text-trading-down">
          {{ gasStatus.wrongChainHint.message }}
        </p>
        <div class="flex flex-wrap gap-2">
          <ClientOnly>
            <button
              type="button"
              class="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-semibold text-on-primary disabled:opacity-50"
              :disabled="busy || fundingGas || !eoaConnected"
              @click="emit('fundGas')"
            >
              {{ fundingGas ? '充值中…' : `从 EOA 充值 ${gasStatus?.recommendedFundEth ?? 0.001} ${gasStatus?.nativeTokenLabel ?? 'ETH'}` }}
            </button>
            <template #fallback>
              <span class="text-muted">加载钱包…</span>
            </template>
          </ClientOnly>
          <a
            :href="gasFaucetUrl"
            class="inline-flex h-8 items-center rounded-md border border-hairline px-3 text-xs text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            打开水龙头
          </a>
          <button
            type="button"
            class="inline-flex h-8 items-center rounded-md border border-hairline px-3 font-mono text-xs"
            @click="copyAgentAddress"
          >
            复制 Agent 地址
          </button>
        </div>
        <p v-if="!eoaConnected" class="text-trading-down">
          请先在
          <NuxtLink to="/wallet" class="text-primary underline">钱包准备</NuxtLink>
          页连接 EOA。
        </p>
      </div>
      <p v-if="executing" class="text-sm text-muted" role="status">
        正在执行首次 Recipe…
      </p>
      <p v-if="executeError" class="text-sm text-trading-down" role="alert">
        {{ executeError }}
      </p>
      <p
        v-if="pact.firstExecutionCompleted && pact.firstExecutionTxHash"
        class="text-sm text-trading-up"
      >
        首次 Recipe 已完成
      </p>
      <p
        v-else-if="pact.firstExecutionCompleted && !pact.firstExecutionTxHash"
        class="text-sm text-trading-down"
        role="alert"
      >
        上次执行未获得链上确认，请点击下方按钮重试
      </p>
      <UiTxLink
        v-if="pact.firstExecutionTxHash"
        :hash="pact.firstExecutionTxHash"
        :network="network"
        class="block break-all text-xs"
      />
      <p v-if="pact.redeemTxHash" class="text-sm text-trading-up">
        赎回已完成
        <UiTxLink
          :hash="pact.redeemTxHash"
          :network="network"
          class="ml-1 break-all text-xs"
        />
      </p>
      <p v-if="yieldPosition?.redeemable && !pact.redeemCompleted" class="text-xs text-muted">
        协议仓位：约 {{ yieldPosition.suppliedUsdc.toLocaleString('zh-CN') }} USDC（{{ yieldPosition.protocol }}）
      </p>
      <p v-if="redeemError" class="text-sm text-trading-down" role="alert">
        {{ redeemError }}
      </p>
    </div>

    <div
      v-else-if="pact.status === 'terminated' && hasDepositedFunds"
      class="space-y-3 border-b border-hairline px-5 py-4"
    >
      <p v-if="pact.redeemTxHash" class="text-sm text-trading-up">
        赎回已完成
        <UiTxLink :hash="pact.redeemTxHash" :network="network" class="ml-1 text-xs" />
      </p>
      <p v-else-if="showTerminatedRedeemGuide" class="text-sm text-body">
        此 Pact 已在 App 撤销。撤销不会自动取回 Compound 存款，请尝试下方「赎回至 Agent Wallet」。
      </p>
      <p v-if="yieldPosition?.redeemable && !pact.redeemCompleted" class="text-xs text-muted">
        协议仓位：约 {{ yieldPosition.suppliedUsdc.toLocaleString('zh-CN') }} USDC（{{ yieldPosition.protocol }}）
      </p>
      <p v-if="redeemError" class="text-sm text-trading-down" role="alert">
        {{ redeemError }}
      </p>
    </div>

    <dl class="divide-y divide-hairline px-5">
      <div v-for="line in detailLines" :key="line.label" class="grid gap-1 py-3 sm:grid-cols-[7rem_1fr]">
        <dt class="text-xs text-muted">{{ line.label }}</dt>
        <dd class="text-sm text-body">{{ line.value }}</dd>
      </div>
    </dl>

    <section v-if="recentLogs?.length" class="border-t border-hairline px-5 py-4">
      <h3 class="text-xs font-semibold text-muted">最近活动</h3>
      <ul class="mt-2 space-y-2">
        <li
          v-for="log in recentLogs"
          :key="log.id"
          class="text-xs text-body"
        >
          <span class="text-muted">{{ log.timestamp.slice(0, 19) }}</span>
          — {{ log.action }}
          <span class="text-muted">（{{ log.status }}）</span>
        </li>
      </ul>
      <NuxtLink
        :to="`/history?pactId=${pact.id}`"
        class="mt-3 inline-block text-xs font-medium text-primary hover:underline"
      >
        查看完整历史
      </NuxtLink>
    </section>

    <div
      v-if="showOwnerRevokeGuide"
      class="border-t border-hairline px-5 py-4 text-sm text-body"
      role="note"
    >
      <p class="font-medium text-on-dark">撤销生效中的 Pact</p>
      <p class="mt-2 text-muted">
        若已执行存入，请先点击「赎回至 Agent Wallet」，再在 App 撤销。
        Agent 无法代你 revoke。请打开 Cobo Agentic Wallet App → 本 Pact 详情 → 撤销；
        完成后回到此页点击「刷新状态」同步。
      </p>
      <button
        type="button"
        class="mt-3 h-10 rounded-md border border-hairline px-4 text-sm font-medium text-body transition-colors hover:bg-surface-elevated disabled:opacity-50"
        :disabled="busy"
        @click="emit('refresh')"
      >
        {{ busy ? '刷新中…' : '我已在 App 撤销，刷新状态' }}
      </button>
    </div>

    <div class="flex flex-wrap gap-3 border-t border-hairline px-5 py-4">
      <button
        v-if="canRefresh"
        type="button"
        class="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active disabled:opacity-50"
        :disabled="busy || executing"
        @click="emit('refresh')"
      >
        {{ busy ? '刷新中…' : '我已批准，刷新状态' }}
      </button>
      <button
        v-if="canApproveLocal"
        type="button"
        class="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active disabled:opacity-50"
        :disabled="busy"
        @click="emit('approveLocal')"
      >
        本地模拟批准
      </button>
      <button
        v-if="canExecute"
        type="button"
        class="h-10 rounded-md border border-primary/50 px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
        :disabled="busy || executing || !gasReady"
        @click="emit('execute')"
      >
        {{ executing ? '执行中…' : gasReady ? '执行首次 Recipe' : '需先充值 Gas' }}
      </button>
      <button
        v-if="canRedeem"
        type="button"
        class="h-10 rounded-md border border-trading-up/40 px-4 text-sm font-medium text-trading-up transition-colors hover:bg-trading-up/10 disabled:opacity-50"
        :disabled="busy || executing || redeeming"
        @click="emit('redeem')"
      >
        {{ redeeming ? '赎回中…' : '赎回至 Agent Wallet' }}
      </button>
      <button
        v-if="canSimulateDenial"
        type="button"
        class="h-10 rounded-md border border-hairline px-4 text-sm font-medium text-body transition-colors hover:bg-surface-elevated disabled:opacity-50"
        :disabled="busy || executing"
        @click="emit('simulateDenial')"
      >
        模拟越权请求
      </button>
      <button
        v-if="canWithdrawCoboPact"
        type="button"
        class="h-10 rounded-md border border-hairline px-4 text-sm font-medium text-body transition-colors hover:bg-surface-elevated disabled:opacity-50"
        :disabled="busy || executing"
        @click="emit('terminate')"
      >
        撤回待审批 Pact
      </button>
      <button
        v-if="canTerminate"
        type="button"
        class="h-10 rounded-md border border-hairline px-4 text-sm font-medium text-body transition-colors hover:bg-surface-elevated disabled:opacity-50"
        :disabled="busy || executing"
        @click="emit('terminate')"
      >
        终止 Pact
      </button>
    </div>
  </article>
</template>
