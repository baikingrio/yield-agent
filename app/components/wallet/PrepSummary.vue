<script setup lang="ts">
import type { WalletPreparation } from '../../../shared/types/app'

defineProps<{
  prep: WalletPreparation | null
  networkLabel: string
}>()

function shortAddr(addr: string | null) {
  if (!addr) return '—'
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function shortId(id: string | null | undefined) {
  if (!id) return '—'
  return `${id.slice(0, 8)}…${id.slice(-4)}`
}
</script>

<template>
  <aside
    class="rounded-lg border border-hairline bg-surface lg:sticky lg:top-[calc(3.5rem+1.5rem)]"
    aria-labelledby="prep-summary-heading"
  >
    <div class="border-b border-hairline px-5 py-4">
      <h2 id="prep-summary-heading" class="text-base font-semibold text-on-dark">准备摘要</h2>
      <p class="mt-1 text-xs text-muted-strong">Agent Wallet 余额不等于 Pact 可花上限。</p>
    </div>
    <dl class="space-y-4 px-5 py-4 text-sm">
      <div>
        <dt class="text-xs text-muted">网络</dt>
        <dd class="mt-1 text-body">{{ networkLabel }}</dd>
      </div>
      <div>
        <dt class="text-xs text-muted">用户 EOA</dt>
        <dd class="mt-1 font-mono text-xs text-on-dark">{{ shortAddr(prep?.eoa.address ?? null) }}</dd>
      </div>
      <div>
        <dt class="text-xs text-muted">Agent Wallet</dt>
        <dd class="mt-1 font-mono text-xs text-on-dark">
          {{ prep?.agentWallet.created ? shortAddr(prep.agentWallet.address) : '未创建' }}
        </dd>
      </div>
      <div v-if="prep?.agentWallet.coboWalletId">
        <dt class="text-xs text-muted">CAW Wallet ID</dt>
        <dd class="mt-1 font-mono text-xs text-muted">{{ shortId(prep.agentWallet.coboWalletId) }}</dd>
      </div>
      <div>
        <dt class="text-xs text-muted">可用余额</dt>
        <dd class="mt-1 font-mono text-sm text-trading-up">
          {{ prep?.funding.availableUsdc?.toLocaleString('zh-CN') ?? '0' }} USDC
        </dd>
      </div>
      <div v-if="prep?.ready" class="rounded-md border border-trading-up/30 bg-canvas px-3 py-2 text-xs text-trading-up">
        Agent Wallet 已就绪，可继续创建 Pact 策略。
      </div>
    </dl>
    <div class="border-t border-hairline px-5 py-4">
      <WalletPrepStepIndicator :steps="prep?.steps" />
    </div>
  </aside>
</template>
