<script setup lang="ts">
import { DASHBOARD_SETTINGS } from '#shared/constants/dashboard-routes'
import type { WalletPreparation } from '../../../shared/types/app'

const props = defineProps<{
  prep: WalletPreparation | null
  locked: boolean
  busy: boolean
  depositLabel: string
  networkLabel: string
  depositAmount: string
  coboConfigured: boolean
}>()

const emit = defineEmits<{
  deposit: []
  'update:depositAmount': [string]
}>()

const amount = computed({
  get: () => props.depositAmount,
  set: (v: string) => emit('update:depositAmount', v),
})

const copied = ref(false)

async function copyAddress(addr: string) {
  try {
    await navigator.clipboard.writeText(addr)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch { /* ignore */ }
}
</script>

<template>
  <section
    class="rounded-lg border border-hairline bg-surface p-5"
    :class="locked ? 'opacity-60' : ''"
    aria-labelledby="step-fund-heading"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="font-mono text-xs text-primary">步骤 3</p>
        <h2 id="step-fund-heading" class="mt-2 text-base font-semibold text-on-dark">注入测试网 USDC</h2>
        <p class="mt-2 max-w-prose text-sm leading-6 text-body">
          从 EOA 向 Agent Wallet 发起链上 USDC 转账。服务端将校验交易回执，并通过 Cobo 同步余额。
        </p>
      </div>
      <UiStatusChip
        v-if="prep"
        :label="prep.funding.status === 'ready' ? '已注资' : prep.steps.funding === 'in_progress' ? '转入中' : '待完成'"
        :tone="prep.funding.status === 'ready' ? 'active' : prep.steps.funding === 'in_progress' ? 'pending' : 'neutral'"
      />
    </div>

    <p
      v-if="!coboConfigured"
      class="mt-4 rounded-md border border-trading-down/30 bg-canvas px-3 py-2 text-xs text-trading-down"
    >
      需要 Cobo API Key 才能校验余额。
      <NuxtLink :to="DASHBOARD_SETTINGS" class="font-medium text-primary hover:underline">前往设置</NuxtLink>
    </p>

    <div v-if="prep?.funding.status === 'ready'" class="mt-4 space-y-2 text-sm">
      <p class="font-mono text-on-dark">
        已注入 {{ prep.funding.depositedUsdc.toLocaleString('zh-CN') }} USDC
      </p>
      <p v-if="prep.funding.lastTxHash" class="text-xs text-muted">
        Tx：
        <UiTxLink :hash="prep.funding.lastTxHash" :network="prep.network" />
      </p>
      <p class="text-xs text-muted">
        后续可在控制台「资金管理」中补充或提取 idle USDC。
      </p>
    </div>

    <form v-else class="mt-4 space-y-4" @submit.prevent="emit('deposit')">
      <div v-if="prep?.agentWallet.address" class="rounded-md bg-canvas px-3 py-2 text-xs">
        <span class="text-muted">收款地址（Agent Wallet）</span>
        <div class="mt-1 flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="font-mono text-body hover:text-primary"
            @click="copyAddress(prep.agentWallet.address)"
          >
            {{ prep.agentWallet.address.slice(0, 10) }}…{{ prep.agentWallet.address.slice(-6) }}
          </button>
          <span v-if="copied" class="text-trading-up">已复制</span>
        </div>
      </div>

      <div>
        <label for="deposit-amount" class="mb-1.5 block text-xs text-muted-strong">金额 (USDC)</label>
        <input
          id="deposit-amount"
          v-model="amount"
          type="number"
          min="10"
          max="10000"
          step="1"
          class="h-10 w-full max-w-xs rounded-md border border-hairline bg-canvas px-3 font-mono text-sm text-on-dark"
          :disabled="locked || busy"
        />
      </div>
      <div>
        <span class="text-xs text-muted-strong">网络</span>
        <p class="mt-1 text-sm text-body">{{ networkLabel }}</p>
      </div>

      <ClientOnly>
        <button
          type="submit"
          class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary transition-colors duration-150 hover:bg-primary-active disabled:opacity-50"
          :disabled="locked || busy || !coboConfigured || !prep?.agentWallet.address"
        >
          {{ busy && prep?.funding.status === 'processing' ? '确认到账中…' : depositLabel }}
        </button>
        <template #fallback>
          <p class="text-sm text-muted">加载钱包转账…</p>
        </template>
      </ClientOnly>
    </form>
  </section>
</template>
