<script setup lang="ts">
import type { WalletPreparation } from '../../../shared/types/demo'

defineProps<{
  prep: WalletPreparation | null
  locked: boolean
  busy: boolean
  createLabel: string
  coboConfigured: boolean
}>()

const emit = defineEmits<{
  create: []
}>()

const copied = ref(false)

function shortId(id: string) {
  return `${id.slice(0, 8)}…${id.slice(-4)}`
}

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
    aria-labelledby="step-agent-heading"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="font-mono text-xs text-primary">步骤 2</p>
        <h2 id="step-agent-heading" class="mt-2 text-base font-semibold text-on-dark">创建 CAW Agent Wallet</h2>
        <p class="mt-2 max-w-prose text-sm leading-6 text-body">
          YieldAgent 会自动向 CAW provision 初始 API Key 并创建 Agent Wallet。创建后请在 CAW App 输入配对码完成激活。
        </p>
      </div>
      <UiStatusChip
        v-if="prep"
        :label="prep.steps.agent_wallet === 'completed' ? '已完成' : '待完成'"
        :tone="prep.steps.agent_wallet === 'completed' ? 'active' : 'neutral'"
      />
    </div>

    <div v-if="prep?.agentWallet.created && prep.agentWallet.address" class="mt-4 space-y-2">
      <div class="flex flex-wrap items-center gap-3">
        <button
          type="button"
          class="font-mono text-sm text-primary hover:text-primary-active"
          :title="prep.agentWallet.address"
          @click="copyAddress(prep.agentWallet.address)"
        >
          {{ prep.agentWallet.address.slice(0, 10) }}…{{ prep.agentWallet.address.slice(-6) }}
        </button>
        <span v-if="copied" class="text-xs text-trading-up">已复制</span>
      </div>
      <p v-if="prep.agentWallet.coboWalletId" class="font-mono text-xs text-muted">
        CAW Wallet ID：{{ shortId(prep.agentWallet.coboWalletId) }}
      </p>
      <div
        v-if="prep.agentWallet.pairing?.status === 'pairing'"
        class="rounded-md border border-primary/30 bg-canvas px-3 py-2 text-xs text-body"
      >
        <p class="font-semibold text-on-dark">请到 CAW App 输入配对码完成激活</p>
        <p v-if="prep.agentWallet.pairing.code" class="mt-2 font-mono text-lg text-primary">
          {{ prep.agentWallet.pairing.code }}
        </p>
        <p v-if="prep.agentWallet.pairing.expiresAt" class="mt-1 text-muted">
          过期时间：{{ prep.agentWallet.pairing.expiresAt }}
        </p>
      </div>
    </div>
    <button
      v-else
      type="button"
      class="mt-4 inline-flex h-10 items-center justify-center rounded-md border border-hairline px-4 text-sm font-semibold text-on-dark transition-colors duration-150 hover:bg-surface-elevated disabled:opacity-50"
      :disabled="locked || busy"
      @click="emit('create')"
    >
      {{ createLabel }}
    </button>
  </section>
</template>
