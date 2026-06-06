<script setup lang="ts">
useHead({ title: '准备 Agent Wallet · YieldAgent' })

const {
  prep,
  busy,
  depositAmount,
  pageError,
  createAgentLabel,
  depositLabel,
  bootstrap,
  bootstrapPhaseLabel,
  bootstrapMessage,
  agentPolling,
  coboConfigured,
  networkLabel,
  stepLocked,
  init,
  runCreateAgent,
  runImportAgent,
  runDeposit,
  runReset,
  continueUrl,
  store,
} = useWalletPreparation()

onMounted(() => init())
</script>

<template>
  <main class="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
    <header class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div class="space-y-3">
        <p class="font-mono text-xs text-muted-strong">测试网 · 资金准备</p>
        <h1 class="text-balance text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-tight tracking-[-0.03em] text-on-dark">
          准备 Agent 可操作的资金
        </h1>
        <p class="max-w-[65ch] text-sm leading-6 text-body">
          完成以下三步后，才能创建受 Pact 约束的策略。资金在 Agent Wallet 中，单次策略仍受 maxSpend 限制。
        </p>
      </div>
      <button
        type="button"
        class="h-9 shrink-0 rounded-md border border-hairline px-3 text-xs font-medium text-muted hover:bg-surface-elevated disabled:opacity-50"
        :disabled="busy"
        @click="runReset"
      >
        重置资金准备
      </button>
    </header>

    <UiPageAlert
      v-if="pageError || store.error"
      :message="pageError || store.error || ''"
      @retry="init"
    />

    <div v-if="!prep && busy" class="h-48 animate-pulse rounded-lg bg-surface" />

    <div v-else class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] lg:items-start">
      <div class="space-y-5">
        <WalletPrepStepEoa
          :prep="prep"
          :locked="false"
          :busy="busy"
        />
        <WalletPrepStepAgent
          :prep="prep"
          :bootstrap="bootstrap"
          :locked="stepLocked('agent_wallet')"
          :busy="busy"
          :agent-polling="agentPolling"
          :create-label="createAgentLabel"
          :bootstrap-phase-label="bootstrapPhaseLabel"
          :bootstrap-message="bootstrapMessage"
          :cobo-configured="coboConfigured"
          @create="runCreateAgent"
          @import="runImportAgent"
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
            请先完成上方三步，再创建策略。
          </p>
          <p v-else class="text-sm text-trading-up">
            资金准备已完成。下一步：选择模板并确认 Pact 边界。
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
            继续创建策略
          </NuxtLink>
        </footer>
      </div>

      <WalletPrepSummary :prep="prep" :network-label="networkLabel" />
    </div>
  </main>
</template>
