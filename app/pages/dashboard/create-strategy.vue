<script setup lang="ts">
import { DASHBOARD_HOME } from '#shared/constants/dashboard-routes'

useHead({ title: '创建策略 · YieldAgent' })

const {
  form,
  nlOpen,
  nlText,
  nlFilled,
  errors,
  pipeline,
  executionStep,
  previewTxHash,
  pipelineError,
  pactSubmissionMessage,
  coboPactId,
  approvalId,
  approvalRefreshing,
  intentSummary,
  previewLines,
  allowedActions,
  deniedActions,
  strategyTemplates,
  selectedTemplateKey,
  preparationReady,
  availableBalanceLabel,
  preparationNetworkLabel,
  networkMismatch,
  agentSplit,
  fundingSourceLabel,
  isFormValid,
  stepIndex,
  executionSteps,
  parseNlIntoForm,
  applyTemplate,
  clearNlFill,
  submitPact,
  refreshApprovalStatus,
  simulateFailure,
  resetToEdit,
  nlParsing,
} = useCreateStrategy()

const store = useAppStore()
const pairingReady = computed(
  () => store.preparation?.agentWallet.pairing?.status === 'paired',
)

const formDisabled = computed(() =>
  ['submitting', 'awaiting-approval', 'executing', 'success'].includes(pipeline.value)
  || !preparationReady.value,
)
</script>

<template>
  <div class="mx-auto max-w-7xl">
    <header class="mb-6 space-y-4 md:mb-8">
      <h1 class="text-balance text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-tight tracking-[-0.03em] text-on-dark">
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
      <h2 class="text-sm font-semibold text-on-dark">需要先完成 Agent Wallet 设置</h2>
      <p class="mt-2 text-sm text-body">
        创建 Pact 前，请连接 EOA，并在控制台创建 Agent Wallet 并注入测试网 USDC。
      </p>
      <div class="mt-4">
        <NuxtLink
          :to="DASHBOARD_HOME"
          class="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary no-underline hover:bg-primary-active"
        >
          前往控制台
        </NuxtLink>
      </div>
    </section>

    <section
      v-else
      class="mb-8 rounded-lg border border-hairline bg-surface p-5"
      aria-label="Agent Wallet 状态"
    >
      <div class="grid gap-5 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
        <div>
          <p class="font-mono text-xs text-muted-strong">资金已就绪</p>
          <h2 class="mt-2 text-base font-semibold text-on-dark">Agent Wallet 已注入测试资金</h2>
          <p class="mt-2 text-sm leading-6 text-body">
            Pact maxSpend 不能超过 Agent Wallet 当前可用余额。超出部分将在提交时被拒绝。
          </p>
        </div>
        <dl class="grid gap-4 border-t border-hairline pt-4 sm:grid-cols-3 sm:border-t-0 sm:pt-0 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <div>
            <dt class="text-xs text-muted">资金来源</dt>
            <dd class="mt-1 text-sm font-semibold text-on-dark">{{ fundingSourceLabel }}</dd>
          </div>
          <div>
            <dt class="text-xs text-muted">可用余额</dt>
            <dd class="mt-1 font-mono text-sm text-on-dark">{{ availableBalanceLabel }}</dd>
          </div>
          <div>
            <dt class="text-xs text-muted">Pact 将限制</dt>
            <dd class="mt-1 text-sm font-semibold text-on-dark">预算 + Recipe + 期限</dd>
          </div>
        </dl>
      </div>
    </section>

    <template v-if="preparationReady">
      <section class="mb-8 grid gap-3 md:grid-cols-3" aria-label="策略模板">
        <button
          v-for="template in strategyTemplates"
          :key="template.key"
          type="button"
          class="rounded-lg border bg-surface p-4 text-left transition-colors hover:border-primary/70 hover:bg-surface-elevated"
          :class="selectedTemplateKey === template.key ? 'border-primary' : 'border-hairline'"
          :aria-pressed="selectedTemplateKey === template.key"
          @click="applyTemplate(template.key)"
        >
          <span class="font-mono text-[0.65rem] text-primary">模板</span>
          <p class="mt-2 text-sm font-semibold text-on-dark">{{ template.title }}</p>
          <p class="mt-1 text-xs leading-5 text-muted">{{ template.description }}</p>
        </button>
      </section>
    </template>

    <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:items-start">
      <CreateStrategyForm
        v-if="preparationReady"
        :form="form"
        :errors="errors"
        :disabled="formDisabled"
        :nl-open="nlOpen"
        :nl-text="nlText"
        :nl-filled="nlFilled"
        :nl-parsing="nlParsing"
        :available-balance-label="availableBalanceLabel"
        :preparation-network-label="preparationNetworkLabel"
        :network-mismatch="networkMismatch"
        :agent-split="agentSplit"
        @update:nl-open="nlOpen = $event"
        @update:nl-text="nlText = $event"
        @parse-nl="parseNlIntoForm()"
        @clear-nl="clearNlFill()"
      />
      <section
        v-else
        class="rounded-lg border border-hairline bg-surface px-5 py-6"
        aria-labelledby="strategy-form-locked-heading"
      >
        <h2 id="strategy-form-locked-heading" class="text-base font-semibold text-on-dark">
          策略配置已锁定
        </h2>
        <p class="mt-2 text-sm leading-6 text-body">
          在控制台完成 Agent Wallet 设置后，可在此选择模板并填写 Pact 参数。右侧预览区可先查看当前流程说明。
        </p>
        <NuxtLink
          :to="DASHBOARD_HOME"
          class="mt-4 inline-flex h-11 items-center justify-center rounded-md border border-hairline px-4 text-sm font-semibold text-on-dark no-underline hover:bg-surface-elevated"
        >
          前往控制台
        </NuxtLink>
      </section>

      <CreateStrategyPactPreview
        :lines="previewLines"
        :pipeline="pipeline"
        :form-valid="isFormValid"
        :preparation-ready="preparationReady"
        :can-submit="isFormValid && preparationReady"
        :network="form.network"
        :submitting="pipeline === 'submitting'"
        :preview-tx-hash="previewTxHash"
        :pipeline-error="pipelineError"
        :pact-submission-message="pactSubmissionMessage"
        :cobo-pact-id="coboPactId"
        :approval-id="approvalId"
        :approval-refreshing="approvalRefreshing"
        :intent-text="intentSummary"
        :max-spend="form.maxSpend"
        :pairing-ready="pairingReady"
        :allowed-actions="allowedActions"
        :denied-actions="deniedActions"
        :execution-step="executionStep"
        :execution-steps="executionSteps"
        @submit="submitPact()"
        @reset="resetToEdit()"
        @refresh-approval="refreshApprovalStatus()"
        @simulate-fail="simulateFailure()"
      />
    </div>
  </div>
</template>
