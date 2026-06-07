<script setup lang="ts">
const pactLines = [
  { label: '策略', value: '保守型 USDC 收益' },
  { label: '支出上限', value: '500 USDC' },
  { label: '网络', value: 'Base Sepolia' },
  { label: '状态', value: '执行中', highlight: true },
]

const recentActions = [
  { time: '今天 09:14', action: 'Compound 存入 500 USDC', status: '成功', tone: 'up' as const },
  { time: '昨天 18:02', action: 'Pact 审批通过', status: '已激活', tone: 'up' as const },
]
</script>

<template>
  <aside
    class="overflow-hidden rounded-lg border border-hairline bg-surface lg:sticky lg:top-[calc(3.5rem+1.5rem)]"
    aria-label="产品界面预览"
  >
    <div class="border-b border-hairline bg-canvas px-5 py-3">
      <div class="flex items-center justify-between gap-3">
        <p class="text-xs font-medium text-on-dark">控制台快照</p>
        <span class="font-mono text-[0.65rem] text-[var(--color-muted-strong)]">测试网</span>
      </div>
    </div>

    <div class="border-b border-hairline px-5 py-4">
      <p class="text-xs text-[var(--color-muted-strong)]">Agent Wallet 余额</p>
      <p class="mt-1 font-mono text-xl font-medium text-on-dark">10,000 <span class="text-sm text-body">USDC</span></p>
      <p class="mt-1 text-xs text-[var(--color-muted-strong)]">可用 · Base Sepolia</p>
    </div>

    <div class="border-b border-hairline px-5 py-4">
      <div class="flex items-center justify-between gap-2">
        <p class="text-sm font-semibold text-on-dark">当前 Pact</p>
        <span class="rounded-sm bg-surface-elevated px-2 py-0.5 text-xs text-trading-up">执行中</span>
      </div>
      <dl class="mt-3 space-y-2">
        <div
          v-for="line in pactLines"
          :key="line.label"
          class="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2 text-xs"
        >
          <dt class="text-[var(--color-muted-strong)]">{{ line.label }}</dt>
          <dd
            class="font-mono leading-5"
            :class="line.highlight ? 'text-trading-up' : 'text-body'"
          >
            {{ line.value }}
          </dd>
        </div>
      </dl>
    </div>

    <div class="px-5 py-4">
      <p class="text-xs font-medium text-[var(--color-muted-strong)]">近期动作</p>
      <ul class="mt-3 space-y-3" role="list">
        <li
          v-for="item in recentActions"
          :key="item.action"
          class="flex items-start justify-between gap-3 text-xs"
        >
          <div class="min-w-0">
            <p class="text-body">{{ item.action }}</p>
            <p class="mt-0.5 font-mono text-[var(--color-muted-strong)]">{{ item.time }}</p>
          </div>
          <span :class="item.tone === 'up' ? 'text-trading-up' : 'text-trading-down'">
            {{ item.status }}
          </span>
        </li>
      </ul>
    </div>
  </aside>
</template>
