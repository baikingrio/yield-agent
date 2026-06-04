<script setup lang="ts">
import type { PipelineStage } from '~/composables/useCreateStrategy'

const props = defineProps<{
  lines: { label: string; value: string }[]
  pipeline: PipelineStage
  isFormValid: boolean
  submitting: boolean
  demoTxHash: string
  pipelineError: string
  allowedActions: string[]
  deniedActions: string[]
  executionStep: number
  executionSteps: readonly string[]
}>()

const emit = defineEmits<{
  submit: []
  reset: []
  simulateFail: []
}>()

const statusChip = computed(() => {
  switch (props.pipeline) {
    case 'awaiting-approval':
      return { label: '等待审批', class: 'text-[var(--color-status-pending)]' }
    case 'executing':
      return { label: '执行中', class: 'text-[var(--color-status-paused)]' }
    case 'success':
      return { label: 'Pact 已生效', class: 'text-trading-up' }
    case 'failed':
      return { label: '已拒绝', class: 'text-trading-down' }
    case 'preview-ready':
      return { label: '可提交', class: 'text-trading-up' }
    default:
      return { label: '未完成', class: 'text-muted-strong' }
  }
})

const showPipelinePanel = computed(() =>
  ['submitting', 'awaiting-approval', 'executing', 'success', 'failed'].includes(props.pipeline),
)
</script>

<template>
  <aside
    class="flex flex-col rounded-lg bg-surface lg:sticky lg:top-[calc(3.5rem+1.5rem)] lg:max-h-[calc(100dvh-5rem)] lg:self-start"
    aria-labelledby="pact-preview-heading"
  >
    <div class="border-b border-hairline px-5 py-4">
      <div class="flex items-start justify-between gap-3">
        <h2 id="pact-preview-heading" class="text-base font-semibold text-on-dark">Pact 预览</h2>
        <span
          class="shrink-0 rounded-sm bg-surface-elevated px-2.5 py-1 text-xs font-medium"
          :class="statusChip.class"
        >
          {{ statusChip.label }}
        </span>
      </div>
      <p class="mt-1 text-xs text-muted">批准前先确认资金来源、Pact 预算，以及 Agent 能做什么 / 不能做什么。</p>
    </div>

    <div class="flex-1 space-y-4 overflow-y-auto px-5 py-4">
      <template v-if="!props.isFormValid && !showPipelinePanel">
        <p class="text-sm text-muted">请填写必填项以生成 Pact 边界。</p>
      </template>

      <dl class="space-y-3">
        <div v-for="line in props.lines" :key="line.label" class="grid gap-0.5">
          <dt class="text-xs font-medium text-muted-strong">{{ line.label }}</dt>
          <dd
            class="text-sm text-body"
            :class="line.label === '意图' ? '' : 'font-mono text-[0.8125rem]'"
          >
            {{ line.value }}
          </dd>
        </div>
      </dl>

      <section v-if="props.isFormValid" class="rounded-md bg-canvas p-4" aria-labelledby="allowed-heading">
        <h3 id="allowed-heading" class="text-xs font-semibold uppercase tracking-[0.18em] text-trading-up">
          允许 Agent
        </h3>
        <ul class="mt-3 space-y-2 text-sm text-body">
          <li v-for="item in props.allowedActions" :key="item" class="flex gap-2">
            <span aria-hidden="true">✅</span><span>{{ item }}</span>
          </li>
        </ul>
      </section>

      <section v-if="props.isFormValid" class="rounded-md bg-canvas p-4" aria-labelledby="denied-heading">
        <h3 id="denied-heading" class="text-xs font-semibold uppercase tracking-[0.18em] text-trading-down">
          不允许 Agent
        </h3>
        <ul class="mt-3 space-y-2 text-sm text-body">
          <li v-for="item in props.deniedActions" :key="item" class="flex gap-2">
            <span aria-hidden="true">❌</span><span>{{ item }}</span>
          </li>
        </ul>
      </section>
    </div>

    <div v-if="showPipelinePanel" class="border-t border-hairline px-5 py-4">
      <div v-if="props.pipeline === 'submitting'" class="text-sm text-muted" role="status">
        正在提交 Pact…
      </div>
      <div v-else-if="props.pipeline === 'awaiting-approval'" class="space-y-2" role="status">
        <p class="text-sm font-medium text-on-dark">等待 Cobo 审批</p>
        <p class="text-xs text-muted">演示环境：审批为模拟流程。正式环境请在 Cobo 中签名。</p>
      </div>
      <div v-else-if="props.pipeline === 'executing'" class="space-y-2" role="status">
        <p class="text-sm font-medium text-on-dark">正在执行 Recipe</p>
        <ul class="space-y-1 text-xs text-muted">
          <li
            v-for="(label, i) in props.executionSteps"
            :key="label"
            :class="i <= props.executionStep ? 'text-body' : ''"
          >
            {{ i < props.executionStep ? '✓' : i === props.executionStep ? '→' : '○' }} {{ label }}
          </li>
        </ul>
      </div>
      <div v-else-if="props.pipeline === 'success'" class="space-y-2" role="status">
        <p class="text-sm font-medium text-trading-up">执行完成</p>
        <p class="text-xs text-muted">首次 Recipe 已记入测试网日志（演示）。</p>
        <a
          v-if="props.demoTxHash"
          :href="`https://sepolia.basescan.org/tx/${props.demoTxHash}`"
          target="_blank"
          rel="noopener noreferrer"
          class="block break-all font-mono text-xs text-primary hover:underline"
        >
          查看交易 {{ props.demoTxHash.slice(0, 10) }}…{{ props.demoTxHash.slice(-8) }}
        </a>
      </div>
      <div v-else-if="props.pipeline === 'failed'" class="space-y-2" role="alert">
        <p class="text-sm font-medium text-trading-down">已拒绝：超出 Pact 权限边界</p>
        <p class="text-xs text-body">{{ props.pipelineError }}</p>
      </div>
    </div>

    <div class="mt-auto space-y-2 border-t border-hairline p-5">
      <template v-if="!showPipelinePanel">
        <button
          type="button"
          class="flex h-10 w-full items-center justify-center rounded-md bg-primary text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active disabled:cursor-not-allowed disabled:bg-[var(--color-primary-disabled)] disabled:text-muted"
          :disabled="!props.isFormValid || props.submitting"
          @click="emit('submit')"
        >
          创建 Pact
        </button>
        <button
          type="button"
          class="flex h-10 w-full items-center justify-center rounded-md border border-hairline bg-transparent text-sm font-semibold text-body hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!props.isFormValid"
          @click="emit('simulateFail')"
        >
          模拟越权请求
        </button>
      </template>
      <template v-else-if="props.pipeline === 'success'">
        <NuxtLink
          to="/dashboard"
          class="flex h-10 w-full items-center justify-center rounded-md bg-primary text-sm font-semibold text-on-primary no-underline hover:bg-primary-active"
        >
          返回控制台
        </NuxtLink>
        <button
          type="button"
          class="flex h-10 w-full items-center justify-center rounded-md border border-hairline bg-transparent text-sm font-semibold text-body hover:bg-surface-elevated"
          @click="emit('reset')"
        >
          再建一条策略
        </button>
      </template>
      <template v-else-if="props.pipeline === 'failed'">
        <button
          type="button"
          class="flex h-10 w-full items-center justify-center rounded-md bg-primary text-sm font-semibold text-on-primary hover:bg-primary-active"
          @click="emit('reset')"
        >
          修改策略
        </button>
      </template>
      <template v-else-if="props.pipeline === 'awaiting-approval'">
        <button
          type="button"
          class="flex h-10 w-full items-center justify-center rounded-md border border-hairline text-sm font-medium text-muted hover:text-body"
          @click="emit('simulateFail')"
        >
          模拟越权请求
        </button>
      </template>
    </div>
  </aside>
</template>
