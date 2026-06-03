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
  isFormValid,
  stepIndex,
  executionSteps,
  parseNlIntoForm,
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
        在 Agent 动用资金前，先定义 CAW Pact 边界。提交前请对照右侧策略摘要。
      </p>
      <CreateStrategyStepIndicator :active-index="stepIndex" />
    </header>

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
        :execution-step="executionStep"
        :execution-steps="executionSteps"
        @submit="submitPact()"
        @reset="resetToEdit()"
        @simulate-fail="simulateFailure()"
      />
    </div>
  </main>
</template>
