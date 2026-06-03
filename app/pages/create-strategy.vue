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
  ['submitting', 'awaiting-approval', 'executing', 'success'].includes(pipeline.value),
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

    <section class="mb-8 grid gap-3 md:grid-cols-3" aria-label="策略模板">
      <button
        v-for="template in strategyTemplates"
        :key="template.key"
        type="button"
        class="rounded-lg border border-hairline bg-surface p-4 text-left transition-colors hover:border-primary/70 hover:bg-surface-elevated"
        @click="applyTemplate(template.key)"
      >
        <span class="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-primary">模板</span>
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
        :is-form-valid="isFormValid"
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
