<script setup lang="ts">
import { DASHBOARD_HOME, DASHBOARD_PACTS } from '#shared/constants/dashboard-routes'
import type { NetworkId, Pact } from '../../../shared/types/app'
import type { PipelineStage } from '~/composables/strategy-templates'

const props = defineProps<{
  lines: { label: string; value: string }[]
  pipeline: PipelineStage
  formValid: boolean
  preparationReady: boolean
  canSubmit: boolean
  blockedReason?: string
  network: NetworkId
  submitting: boolean
  previewTxHash: string
  pipelineError: string
  pactSubmissionMessage: string
  coboPactId: string
  approvalId: string
  approvalRefreshing: boolean
  intentText: string
  maxSpend: string
  pairingReady?: boolean
  allowedActions: string[]
  deniedActions: string[]
  executionStep: number
  executionSteps: readonly string[]
}>()

const emit = defineEmits<{
  submit: []
  reset: []
  refreshApproval: []
  simulateFail: []
}>()

const showPipelinePanel = computed(() =>
  ['submitting', 'awaiting-approval', 'executing', 'success', 'failed'].includes(props.pipeline),
)

const statusChip = computed(() => {
  if (!props.preparationReady && !showPipelinePanel.value) {
    return { label: '待 Agent 设置', class: 'text-[var(--color-status-pending)]' }
  }

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

const pipelineLiveMode = computed(() =>
  props.pipeline === 'failed' ? 'assertive' : 'polite',
)

const failureHeading = computed(() => {
  const err = String(props.pipelineError ?? '').toLowerCase()
  if (err.includes('api key') || err.includes('invalid_api_key')) {
    return '创建失败：Cobo 凭证无效'
  }
  if (err.includes('recipe slug') || err.includes('recipe_slugs')) {
    return '创建失败：Recipe 配置无效'
  }
  if (err.includes('denied') || err.includes('拒绝') || err.includes('越权') || err.includes('not allowed')) {
    return '已拒绝：超出 Pact 权限边界'
  }
  if (err.includes('超时') || err.includes('timeout')) {
    return '等待审批超时'
  }
  if (err.includes('local draft') || err.includes('本地 draft') || err.includes('未接 cobo')) {
    return '创建失败：未连接 Cobo'
  }
  return '创建策略失败'
})

const approvalGuidePact = computed((): Pact => ({
  id: props.coboPactId || 'pending',
  strategyId: '',
  intent: props.intentText,
  status: 'awaiting-approval',
  maxSpend: Number(props.maxSpend) || 0,
  whitelist: props.allowedActions,
  durationDays: 7,
  agentFeePercent: 0,
  userSplitPercent: 0,
  submissionMode: 'cobo',
  coboPactId: props.coboPactId || undefined,
  approvalId: props.approvalId || undefined,
}))
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
      <p
        v-if="props.formValid && !props.preparationReady && !showPipelinePanel"
        class="mt-2 text-xs text-body"
      >
        表单已填写，但需先完成
        <NuxtLink :to="DASHBOARD_HOME" class="text-primary no-underline hover:underline">控制台 Agent 设置</NuxtLink>
        后才能提交 Pact。
      </p>
    </div>

    <div class="flex-1 space-y-4 overflow-y-auto px-5 py-4">
      <template v-if="!props.formValid && !showPipelinePanel">
        <p class="text-sm text-muted">
          {{ props.blockedReason ?? '请填写必填项以生成 Pact 边界。' }}
        </p>
      </template>

      <template v-if="props.formValid || showPipelinePanel">
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

      <section
        v-if="props.formValid"
        class="space-y-3 border-t border-hairline pt-4"
        aria-labelledby="allowed-heading"
      >
        <h3 id="allowed-heading" class="text-xs font-semibold text-trading-up">
          允许 Agent
        </h3>
        <ul class="space-y-2 text-sm text-body">
          <li v-for="item in props.allowedActions" :key="item" class="flex gap-2">
            <span aria-hidden="true">✅</span><span>{{ item }}</span>
          </li>
        </ul>
      </section>

      <section
        v-if="props.formValid"
        class="space-y-3 border-t border-hairline pt-4"
        aria-labelledby="denied-heading"
      >
        <h3 id="denied-heading" class="text-xs font-semibold text-trading-down">
          不允许 Agent
        </h3>
        <ul class="space-y-2 text-sm text-body">
          <li v-for="item in props.deniedActions" :key="item" class="flex gap-2">
            <span aria-hidden="true">❌</span><span>{{ item }}</span>
          </li>
        </ul>
      </section>
      </template>
    </div>

    <div
      v-if="showPipelinePanel"
      class="border-t border-hairline px-5 py-4"
      :aria-live="pipelineLiveMode"
      aria-atomic="true"
    >
      <div v-if="props.pipeline === 'submitting'" class="text-sm text-muted" role="status">
        正在提交 Pact…
      </div>
      <PactsPactAppApprovalGuide
        v-else-if="props.pipeline === 'awaiting-approval'"
        :pact="approvalGuidePact"
        :submission-message="props.pactSubmissionMessage"
        :pairing-ready="props.pairingReady"
      />
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
        <p class="text-xs text-muted">首次 Recipe 已记入测试网审计日志。</p>
        <UiTxLink
          v-if="props.previewTxHash"
          :hash="props.previewTxHash"
          :network="props.network"
          class="block break-all text-xs"
        />
      </div>
      <div v-else-if="props.pipeline === 'failed'" class="space-y-2" role="alert">
        <p class="text-sm font-medium text-trading-down">{{ failureHeading }}</p>
        <p class="text-xs text-body">{{ props.pipelineError }}</p>
      </div>
    </div>

    <div class="mt-auto space-y-2 border-t border-hairline p-5">
      <template v-if="!showPipelinePanel">
        <button
          type="button"
          class="flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active disabled:cursor-not-allowed disabled:bg-[var(--color-primary-disabled)] disabled:text-muted"
          :disabled="!props.canSubmit || props.submitting"
          @click="emit('submit')"
        >
          创建 Pact
        </button>
        <button
          type="button"
          class="flex h-11 w-full items-center justify-center rounded-md border border-hairline bg-transparent text-sm font-semibold text-body hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!props.formValid"
          @click="emit('simulateFail')"
        >
          模拟越权请求
        </button>
      </template>
      <template v-else-if="props.pipeline === 'success'">
        <NuxtLink
          :to="DASHBOARD_HOME"
          class="flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-semibold text-on-primary no-underline hover:bg-primary-active"
        >
          返回控制台
        </NuxtLink>
        <button
          type="button"
          class="flex h-11 w-full items-center justify-center rounded-md border border-hairline bg-transparent text-sm font-semibold text-body hover:bg-surface-elevated"
          @click="emit('reset')"
        >
          再建一条策略
        </button>
      </template>
      <template v-else-if="props.pipeline === 'failed'">
        <button
          type="button"
          class="flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-semibold text-on-primary hover:bg-primary-active"
          @click="emit('reset')"
        >
          修改策略
        </button>
      </template>
      <template v-else-if="props.pipeline === 'awaiting-approval'">
        <button
          type="button"
          class="flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="props.approvalRefreshing"
          @click="emit('refreshApproval')"
        >
          {{ props.approvalRefreshing ? '刷新中…' : '我已批准，刷新状态' }}
        </button>
        <NuxtLink
          :to="props.coboPactId ? `${DASHBOARD_PACTS}?id=${props.coboPactId}` : DASHBOARD_PACTS"
          class="flex h-11 w-full items-center justify-center rounded-md border border-hairline text-sm font-medium text-body no-underline hover:bg-surface-elevated"
        >
          在 Pact 管理页查看
        </NuxtLink>
      </template>
    </div>
  </aside>
</template>
