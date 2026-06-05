<script setup lang="ts">
import type { Pact } from '../../../shared/types/demo'

const props = defineProps<{
  pact: Pact | null
  busy?: boolean
}>()

const emit = defineEmits<{
  approve: []
  terminate: []
  sync: []
}>()

const STATUS_LABELS: Record<Pact['status'], string> = {
  pending: '待处理',
  active: '生效中',
  completed: '已完成',
  terminated: '已终止',
  'awaiting-approval': '待审批',
}

const canApprove = computed(
  () =>
    props.pact
    && ['pending', 'awaiting-approval'].includes(props.pact.status),
)

const canTerminate = computed(
  () => props.pact && !['terminated', 'completed'].includes(props.pact.status),
)

const canSync = computed(
  () => props.pact?.submissionMode === 'cobo',
)

const detailLines = computed(() => {
  if (!props.pact) return []
  const p = props.pact
  return [
    { label: '意图', value: p.intent },
    { label: '支出上限', value: `${p.maxSpend} USDC` },
    { label: '允许 Recipe', value: p.whitelist.join('、') },
    { label: '期限', value: `${p.durationDays} 天（测试网）` },
    {
      label: '收益分账',
      value: `用户 ${p.userSplitPercent}% · Agent ${100 - p.userSplitPercent}%`,
    },
    { label: 'Agent 绩效费', value: `${p.agentFeePercent}%` },
    { label: '提交模式', value: p.submissionMode === 'cobo' ? 'Cobo Pact' : '本地 Draft' },
    ...(p.coboPactId ? [{ label: 'Cobo Pact ID', value: p.coboPactId }] : []),
    ...(p.approvalId ? [{ label: 'Approval ID', value: p.approvalId }] : []),
    ...(p.coboStatus ? [{ label: 'Cobo 状态', value: p.coboStatus }] : []),
    ...(p.submissionMessage ? [{ label: '状态说明', value: p.submissionMessage }] : []),
  ]
})
</script>

<template>
  <div v-if="!pact" class="rounded-lg border border-dashed border-hairline px-5 py-12 text-center text-sm text-muted">
    选择左侧 Pact 查看详情
  </div>
  <article v-else class="rounded-lg border border-hairline bg-surface">
    <header class="border-b border-hairline px-5 py-4">
      <div class="flex items-start justify-between gap-3">
        <h2 class="text-base font-semibold text-on-dark">Pact 详情</h2>
        <UiStatusChip :label="STATUS_LABELS[pact.status]" />
      </div>
      <p class="mt-1 font-mono text-xs text-muted">ID: {{ pact.id }}</p>
    </header>
    <dl class="divide-y divide-hairline px-5">
      <div v-for="line in detailLines" :key="line.label" class="grid gap-1 py-3 sm:grid-cols-[7rem_1fr]">
        <dt class="text-xs text-muted">{{ line.label }}</dt>
        <dd class="text-sm text-body">{{ line.value }}</dd>
      </div>
    </dl>
    <div class="flex flex-wrap gap-3 border-t border-hairline px-5 py-4">
      <button
        v-if="canSync"
        type="button"
        class="h-10 rounded-md border border-primary/50 px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
        :disabled="busy"
        @click="emit('sync')"
      >
        同步 Cobo 状态
      </button>
      <button
        v-if="canApprove"
        type="button"
        class="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active disabled:opacity-50"
        :disabled="busy"
        @click="emit('approve')"
      >
        模拟审批
      </button>
      <button
        v-if="canTerminate"
        type="button"
        class="h-10 rounded-md border border-hairline px-4 text-sm font-medium text-body transition-colors hover:bg-surface-elevated disabled:opacity-50"
        :disabled="busy"
        @click="emit('terminate')"
      >
        终止 Pact
      </button>
    </div>
  </article>
</template>
