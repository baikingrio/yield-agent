<script setup lang="ts">
import type { AgentBootstrapState, WalletPreparation } from '../../../shared/types/demo'

const props = defineProps<{
  prep: WalletPreparation | null
  bootstrap: AgentBootstrapState | null
  locked: boolean
  busy: boolean
  agentPolling: boolean
  createLabel: string
  bootstrapPhaseLabel: string
  bootstrapMessage: string | null
  coboConfigured: boolean
}>()

const emit = defineEmits<{
  create: []
  import: []
}>()

const copied = ref(false)

function shortId(id: string) {
  return `${id.slice(0, 8)}…${id.slice(-4)}`
}

function checklistDone(key: 'tss' | 'bootstrap' | 'address' | 'pairing'): boolean {
  const prep = props.prep
  const boot = props.bootstrap
  if (!prep) return false
  switch (key) {
    case 'tss':
      return boot?.tssOnline === true
    case 'bootstrap':
      return boot?.phase === 'active' || boot?.phase === 'pairing' || boot?.phase === 'paired' || prep.steps.agent_wallet === 'completed'
    case 'address':
      return Boolean(prep.agentWallet.created && prep.agentWallet.address)
    case 'pairing':
      return prep.agentWallet.pairing?.status === 'paired'
    default:
      return false
  }
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
          按 Cobo 官方流程：TSS Node 在线 → onboard/bootstrap → vault active → 生成配对码 → CAW App 配对。
        </p>
      </div>
      <UiStatusChip
        v-if="prep"
        :label="prep.agentWallet.pairing?.status === 'paired' ? '已完成' : prep.steps.agent_wallet === 'in_progress' || agentPolling || prep.agentWallet.created ? '进行中' : '待完成'"
        :tone="prep.agentWallet.pairing?.status === 'paired' ? 'active' : prep.steps.agent_wallet === 'in_progress' || agentPolling || prep.agentWallet.created ? 'pending' : 'neutral'"
      />
    </div>

    <ol class="mt-4 space-y-2 text-xs text-body">
      <li class="flex items-start gap-2">
        <span :class="checklistDone('tss') ? 'text-trading-up' : 'text-muted'">{{ checklistDone('tss') ? '✓' : '○' }}</span>
        <span>TSS Node 在线（本机 <code>caw node start</code> 或远程 Hermes 主机）</span>
      </li>
      <li class="flex items-start gap-2">
        <span :class="checklistDone('bootstrap') ? 'text-trading-up' : 'text-muted'">{{ checklistDone('bootstrap') ? '✓' : '○' }}</span>
        <span>Vault bootstrap 完成（{{ bootstrapPhaseLabel }}<template v-if="bootstrap?.mode"> · {{ bootstrap.mode }}</template>）</span>
      </li>
      <li class="flex items-start gap-2">
        <span :class="checklistDone('address') ? 'text-trading-up' : 'text-muted'">{{ checklistDone('address') ? '✓' : '○' }}</span>
        <span>生成链上地址</span>
      </li>
      <li class="flex items-start gap-2">
        <span :class="checklistDone('pairing') ? 'text-trading-up' : 'text-muted'">{{ checklistDone('pairing') ? '✓' : '○' }}</span>
        <span>CAW App 配对（仅 vault active 后输入配对码）</span>
      </li>
    </ol>

    <p
      v-if="bootstrapMessage && (busy || agentPolling || prep?.steps.agent_wallet === 'in_progress' || prep?.agentWallet.pairing?.status === 'pairing')"
      class="mt-3 rounded-md border border-primary/20 bg-canvas px-3 py-2 text-xs text-body"
    >
      {{ bootstrapMessage }}
    </p>

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
        <p class="font-semibold text-on-dark">请到 CAW App 输入配对码</p>
        <p v-if="prep.agentWallet.pairing.code" class="mt-2 font-mono text-lg text-primary">
          {{ prep.agentWallet.pairing.code }}
        </p>
        <p v-if="prep.agentWallet.pairing.expiresAt" class="mt-1 text-muted">
          过期时间：{{ prep.agentWallet.pairing.expiresAt }}
        </p>
      </div>
      <p
        v-if="prep.agentWallet.pairing?.status === 'paired'"
        class="text-xs text-trading-up"
      >
        已完成 CAW App 配对
      </p>
      <button
        v-if="prep.agentWallet.pairing?.status !== 'paired'"
        type="button"
        class="inline-flex h-9 items-center justify-center rounded-md border border-hairline px-3 text-xs font-semibold text-on-dark transition-colors duration-150 hover:bg-surface-elevated disabled:opacity-50"
        :disabled="locked || busy || agentPolling"
        @click="emit('create')"
      >
        {{ createLabel }}
      </button>
    </div>
    <div v-else class="mt-4 flex flex-wrap gap-3">
      <button
        type="button"
        class="inline-flex h-10 items-center justify-center rounded-md border border-hairline px-4 text-sm font-semibold text-on-dark transition-colors duration-150 hover:bg-surface-elevated disabled:opacity-50"
        :disabled="locked || busy || agentPolling"
        @click="emit('create')"
      >
        {{ createLabel }}
      </button>
      <button
        type="button"
        class="inline-flex h-10 items-center justify-center rounded-md border border-hairline px-4 text-sm font-semibold text-muted transition-colors duration-150 hover:bg-surface-elevated hover:text-on-dark disabled:opacity-50"
        :disabled="locked || busy || agentPolling"
        @click="emit('import')"
      >
        导入已 onboard 钱包
      </button>
    </div>
  </section>
</template>
