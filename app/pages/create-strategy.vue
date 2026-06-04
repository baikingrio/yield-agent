<script setup lang="ts">
useHead({ title: '创建策略 · YieldAgent' })

const {
  form,
  nlOpen,
  nlText,
  nlFilled,
  errors,
  pipeline,
  executionStep,
  demoTxHash,
  pipelineError,
  previewLines,
  allowedActions,
  deniedActions,
  strategyTemplates,
  preparationReady,
  availableBalanceLabel,
  fundingSourceLabel,
  isFormValid,
  stepIndex,
  executionSteps,
  parseNlIntoForm,
  applyTemplate,
  clearNlFill,
  submitPact,
  simulateFailure,
  resetToEdit,
} = useCreateStrategy()

const formDisabled = computed(() =>
  ['submitting', 'awaiting-approval', 'executing', 'success'].includes(pipeline.value)
  || !preparationReady.value,
)
</script>

<template>
  <main class="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
    <header class="mb-6 space-y-4 md:mb-8">
      <h1 class="text-balance text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-tight tracking-tight text-on-dark">
        创建策略
      </h1>
      <p class="max-w-2xl text-sm text-body">
        在 Agent 动用资金前，先定义 CAW Pact 边界。你可以从模板开始，再确认右侧允许 / 禁止动作。
      </p>
      <CreateStrategyStepIndicator :active-index="stepIndex" />
    </header>

    <section
      v-if="!preparationReady"
      class="mb-8 rounded-lg border border-trading-down/40 bg-surface px-5 py-4"
      role="alert"
    >
      <h2 class="text-sm font-semibold text-on-dark">需要先完成资金准备</h2>
      <p class="mt-2 text-sm text-body">
        创建 Pact 前，请连接 EOA、创建 Agent Wallet 并向其中注入测试网 USDC。
      </p>
      <div class="mt-4">
        <NuxtLink
          to="/wallet"
          class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary no-underline hover:bg-primary-active"
        >
          前往资金准备
        </NuxtLink>
      </div>
    </section>

    <section
      v-else
      class="mb-8 rounded-lg border border-hairline bg-surface p-5"
      aria-label="资金准备状态"
    >
      <div class="grid gap-5 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
        <div>
          <p class="font-mono text-xs text-muted-strong">资金已就绪</p>
          <h2 class="mt-2 text-base font-semibold text-on-dark">Agent Wallet 已注入测试资金</h2>
          <p class="mt-2 text-sm leading-6 text-body">
            Pact maxSpend 不能超过 Agent Wallet 当前可用余额。超出部分将在提交时被拒绝。
          </p>
        </div>
        <dl class="grid gap-3 sm:grid-cols-3">
          <div class="rounded-lg bg-canvas p-4">
            <dt class="text-xs text-muted">资金来源</dt>
            <dd class="mt-1 text-sm font-semibold text-on-dark">{{ fundingSourceLabel }}</dd>
          </div>
          <div class="rounded-lg bg-canvas p-4">
            <dt class="text-xs text-muted">可用余额</dt>
            <dd class="mt-1 font-mono text-sm text-on-dark">{{ availableBalanceLabel }}</dd>
          </div>
          <div class="rounded-lg bg-canvas p-4">
            <dt class="text-xs text-muted">Pact 将限制</dt>
            <dd class="mt-1 text-sm font-semibold text-on-dark">预算 + Recipe + 期限</dd>
          </div>
        </dl>
      </div>
    </section>

    <section class="mb-8 grid gap-3 md:grid-cols-3" aria-label="策略模板">
      <button
        v-for="template in strategyTemplates"
        :key="template.key"
        type="button"
        class="rounded-lg border border-hairline bg-surface p-4 text-left transition-colors hover:border-primary/70 hover:bg-surface-elevated disabled:opacity-50"
        :disabled="!preparationReady"
        @click="applyTemplate(template.key)"
      >
        <span class="font-mono text-[0.65rem] text-primary">模板</span>
        <h2 class="mt-2 text-sm font-semibold text-on-dark">{{ template.title }}</h2>
        <p class="mt-1 text-xs leading-5 text-muted">{{ template.description }}</p>
      </button>
    </section>

    <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:items-start">
      <CreateStrategyForm
        :form="form"
        :errors="errors"
        :disabled="formDisabled"
        :nl-open="nlOpen"
        :nl-text="nlText"
        :nl-filled="nlFilled"
        @update:nl-open="nlOpen = $event"
        @update:nl-text="nlText = $event"
        @parse-nl="parseNlIntoForm()"
        @clear-nl="clearNlFill()"
      />
      <CreateStrategyPactPreview
        :lines="previewLines"
        :pipeline="pipeline"
        :is-form-valid="isFormValid && preparationReady"
        :submitting="pipeline === 'submitting'"
        :demo-tx-hash="demoTxHash"
        :pipeline-error="pipelineError"
        :allowed-actions="allowedActions"
        :denied-actions="deniedActions"
        :execution-step="executionStep"
        :execution-steps="executionSteps"
        @submit="submitPact()"
        @reset="resetToEdit()"
        @simulate-fail="simulateFailure()"
      />
    </div>
  </main>
</template>
