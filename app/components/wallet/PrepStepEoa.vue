<script setup lang="ts">
import { NETWORK_LABELS } from '#shared/types/app'
import type { WalletPreparation } from '#shared/types/app'

defineProps<{
  prep: WalletPreparation | null
  locked: boolean
  busy: boolean
}>()

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

const {
  address,
  isConnected,
  connectedNetworkLabel,
  expectedNetwork,
  networkMismatch,
  busy: walletBusy,
  pageError: walletError,
  connectWallet,
  disconnectWallet,
} = useWalletConnect()

const actionBusy = computed(() => walletBusy.value)
</script>

<template>
  <section class="rounded-lg border border-hairline bg-surface p-5" aria-labelledby="step-eoa-heading">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="font-mono text-xs text-primary">步骤 1</p>
        <h2 id="step-eoa-heading" class="mt-2 text-base font-semibold text-on-dark">连接用户 EOA 钱包</h2>
        <p class="mt-2 max-w-prose text-sm leading-6 text-body">
          EOA 是授权方：用于创建 Agent Wallet、注资和 Pact 签名。Agent 不会获得 EOA 的无限权限。
        </p>
      </div>
      <UiStatusChip
        v-if="prep"
        :label="prep.steps.eoa === 'completed' ? '已完成' : '待完成'"
        :tone="prep.steps.eoa === 'completed' ? 'active' : 'neutral'"
      />
    </div>

    <ClientOnly>
      <div v-if="prep?.eoa.connected && prep.eoa.address" class="mt-4 space-y-3">
        <div class="flex flex-wrap items-center gap-3">
          <span class="font-mono text-sm text-on-dark" :title="prep.eoa.address">
            {{ shortAddr(prep.eoa.address) }}
          </span>
          <span class="text-xs text-muted-strong">{{ prep.eoa.label }}</span>
          <button
            type="button"
            class="text-xs font-medium text-muted hover:text-body"
            :disabled="busy || actionBusy"
            @click="disconnectWallet"
          >
            断开连接
          </button>
        </div>
        <p v-if="isConnected && connectedNetworkLabel" class="text-xs text-muted">
          钱包网络：{{ connectedNetworkLabel }}
        </p>
      </div>
      <div v-else class="mt-4 space-y-3">
        <button
          type="button"
          class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary transition-colors duration-150 hover:bg-primary-active disabled:opacity-50"
          :disabled="locked || busy || actionBusy"
          @click="connectWallet"
        >
          {{ actionBusy ? '连接中…' : '连接钱包' }}
        </button>
        <p v-if="isConnected && address && !prep?.eoa.connected" class="text-xs text-muted">
          正在登记钱包地址…
        </p>
      </div>

      <p
        v-if="networkMismatch"
        class="mt-3 rounded-md border border-trading-down/30 bg-canvas px-3 py-2 text-xs text-trading-down"
        role="alert"
      >
        请在钱包中切换到 {{ NETWORK_LABELS[expectedNetwork] }}，与当前产品网络一致（设置页可查看）。
      </p>
      <p v-if="walletError" class="mt-2 text-xs text-trading-down">{{ walletError }}</p>

      <template #fallback>
        <p class="mt-4 text-sm text-muted">加载钱包连接…</p>
      </template>
    </ClientOnly>
  </section>
</template>
