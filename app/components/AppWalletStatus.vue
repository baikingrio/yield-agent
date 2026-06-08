<script setup lang="ts">
const {
  isConnected,
  connectedNetworkLabel,
  expectedNetwork,
  networkMismatch,
  busy,
  displayAddress,
  displayLabel,
  connectWallet,
  disconnectWallet,
  NETWORK_LABELS,
} = useWalletConnect()
</script>

<template>
  <ClientOnly>
    <div class="flex shrink-0 items-center gap-2">
      <button
        v-if="!isConnected"
        type="button"
        class="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-semibold text-on-primary transition-colors duration-150 hover:bg-primary-active disabled:opacity-50 md:px-4"
        :disabled="busy"
        @click="connectWallet()"
      >
        {{ busy ? '连接中…' : '连接钱包' }}
      </button>

      <div
        v-else
        class="flex max-w-[min(100%,20rem)] flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-hairline bg-surface px-2 py-1.5 text-xs md:max-w-none"
      >
        <span class="font-mono text-on-dark" :title="displayAddress ?? undefined">
          {{ displayAddress }}
        </span>
        <span class="text-muted-strong">{{ displayLabel }}</span>
        <span
          v-if="connectedNetworkLabel"
          class="rounded-sm bg-surface-elevated px-1.5 py-0.5 font-mono text-[0.65rem] text-muted-strong"
          :class="networkMismatch ? 'text-trading-down' : ''"
          :title="networkMismatch ? `请切换到 ${NETWORK_LABELS[expectedNetwork]}` : '当前网络'"
        >
          {{ connectedNetworkLabel }}
        </span>
        <button
          type="button"
          class="text-muted hover:text-body"
          :disabled="busy"
          @click="disconnectWallet"
        >
          断开
        </button>
      </div>
    </div>

    <template #fallback>
      <span class="inline-block h-9 w-20 animate-pulse rounded-md bg-surface" />
    </template>
  </ClientOnly>
</template>
