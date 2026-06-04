<script setup lang="ts">
import type { PrepStep, PrepStepStatus } from '../../../shared/types/demo'

const props = defineProps<{
  steps: Record<PrepStep, PrepStepStatus> | undefined
}>()

const labels: { key: PrepStep; label: string }[] = [
  { key: 'eoa', label: '连接 EOA' },
  { key: 'agent_wallet', label: 'Agent Wallet' },
  { key: 'funding', label: '注入资金' },
]

function tone(status: PrepStepStatus): 'active' | 'pending' | 'neutral' {
  if (status === 'completed') return 'active'
  if (status === 'in_progress') return 'pending'
  return 'neutral'
}
</script>

<template>
  <ol class="flex flex-wrap gap-2" aria-label="资金准备进度">
    <li
      v-for="(item, i) in labels"
      :key="item.key"
      class="flex items-center gap-2"
    >
      <span
        class="flex h-6 min-w-[1.5rem] items-center justify-center rounded-sm px-1 font-mono text-xs"
        :class="
          steps?.[item.key] === 'completed'
            ? 'bg-primary text-on-primary'
            : 'bg-surface-elevated text-muted-strong'
        "
      >{{ i + 1 }}</span>
      <span class="text-xs font-medium" :class="steps?.[item.key] === 'completed' ? 'text-on-dark' : 'text-muted'">
        {{ item.label }}
      </span>
      <UiStatusChip
        v-if="steps"
        class="!px-2 !py-0.5"
        :label="steps[item.key] === 'completed' ? '完成' : steps[item.key] === 'in_progress' ? '进行中' : '待办'"
        :tone="tone(steps[item.key])"
      />
    </li>
  </ol>
</template>
