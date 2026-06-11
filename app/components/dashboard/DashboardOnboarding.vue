<script setup lang="ts">
const {
  prep,
  busy,
  depositAmount,
  pageError,
  resetNotice,
  createAgentLabel,
  depositLabel,
  bootstrap,
  bootstrapPhaseLabel,
  bootstrapMessage,
  bootstrapUserCopy,
  agentPolling,
  agentPollAttempt,
  maxAgentPollAttempts,
  coboConfigured,
  networkLabel,
  stepLocked,
  init,
  runCreateAgent,
  runDeposit,
  runReset,
  continueUrl,
  store,
} = useWalletPreparation()
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div class="space-y-3">
        <p class="font-mono text-xs text-muted-strong">测试网 · Agent Wallet 设置</p>
        <h1 class="text-balance text-[clamp(1.5rem,3vw,2rem)] font-semibold leading-tight tracking-[-0.03em] text-on-dark">
          完成 Agent Wallet 设置
        </h1>
        <p class="max-w-[65ch] text-sm leading-6 text-body">
          EOA 已连接。请创建 Agent Wallet 并注入测试网 USDC，完成后即可创建受 Pact 约束的策略。
        </p>
        <WalletPrepStepIndicator
          v-if="prep"
          :steps="prep.steps"
          variant="agent-only"
        />
      </div>
      <button
        type="button"
        class="h-9 shrink-0 rounded-md border border-hairline px-3 text-xs font-medium text-muted hover:bg-surface-elevated disabled:opacity-50"
        :disabled="busy"
        @click="runReset"
      >
        重置设置
      </button>
    </header>

    <UiPageAlert
      v-if="pageError || store.error"
      :message="pageError || store.error || ''"
      @retry="init"
    />

    <p
      v-if="resetNotice"
      class="rounded-lg border border-primary/30 bg-canvas px-4 py-3 text-sm leading-6 text-body"
    >
      {{ resetNotice }}
    </p>

    <div v-if="!prep && busy" class="h-48 animate-pulse rounded-lg bg-surface" />

    <div v-else class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] lg:items-start">
      <div class="space-y-5">
        <WalletPrepStepAgent
          :prep="prep"
          :bootstrap="bootstrap"
          :locked="stepLocked('agent_wallet')"
          :busy="busy"
          :agent-polling="agentPolling"
          :create-label="createAgentLabel"
          :bootstrap-phase-label="bootstrapPhaseLabel"
          :bootstrap-message="bootstrapMessage"
          :bootstrap-user-copy="bootstrapUserCopy"
          :agent-poll-attempt="agentPollAttempt"
          :max-agent-poll-attempts="maxAgentPollAttempts"
          :cobo-configured="coboConfigured"
          @create="runCreateAgent"
        />
        <WalletPrepStepFund
          :prep="prep"
          :locked="stepLocked('funding')"
          :busy="busy"
          :deposit-label="depositLabel"
          :network-label="networkLabel"
          :deposit-amount="depositAmount"
          :cobo-configured="coboConfigured"
          @update:deposit-amount="depositAmount = $event"
          @deposit="runDeposit"
        />

        <footer class="rounded-lg border border-hairline bg-surface px-5 py-4">
          <p v-if="!prep?.ready" class="text-sm text-muted">
            完成上方两步后，控制台将展示策略与执行数据。
          </p>
          <p v-else class="text-sm text-trading-up">
            Agent Wallet 已就绪。下一步：选择模板并确认 Pact 边界。
          </p>
          <NuxtLink
            :to="continueUrl"
            class="mt-4 inline-flex h-10 items-center justify-center rounded-md px-5 text-sm font-semibold no-underline transition-colors duration-150"
            :class="
              prep?.ready
                ? 'bg-primary text-on-primary hover:bg-primary-active'
                : 'pointer-events-none bg-[var(--color-primary-disabled)] text-muted'
            "
            :aria-disabled="!prep?.ready"
            @click="(e: Event) => { if (!prep?.ready) e.preventDefault() }"
          >
            创建策略
          </NuxtLink>
        </footer>
      </div>

      <WalletPrepSummary :prep="prep" :network-label="networkLabel" />
    </div>
  </div>
</template>
