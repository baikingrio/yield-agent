<script setup lang="ts">
import {
  DASHBOARD_CREATE_STRATEGY,
  DASHBOARD_HOME,
  DASHBOARD_PACTS,
} from '#shared/constants/dashboard-routes'

const store = useAppStore()
const { isConnected } = useWalletConnect()

const showDashboardEntry = computed(
  () => isConnected.value || Boolean(store.preparation?.eoa.connected),
)

const steps = [
  {
    title: '准备 Agent 资金',
    body: '连接 EOA，在控制台创建 Agent Wallet 并转入用于自动化的 USDC。资金与主钱包隔离。',
    href: DASHBOARD_HOME,
    linkLabel: '前往控制台',
  },
  {
    title: '定义收益策略',
    body: '从保守型、平衡型模板出发，或用自然语言描述目标。提交前可预览完整 Pact 条款。',
    href: `${DASHBOARD_CREATE_STRATEGY}?template=conservative-usdc`,
    linkLabel: '创建策略',
  },
  {
    title: '审批 Pact',
    body: '在 Cobo Agentic Wallet App 中由钱包主人签署。未审批前 Agent 不会动用预算。',
    href: DASHBOARD_PACTS,
    linkLabel: '管理 Pact',
  },
  {
    title: '执行与监控',
    body: 'Agent 在授权范围内自动执行 Recipe。你在控制台查看仓位、日志，必要时赎回或结束策略。',
    href: DASHBOARD_HOME,
    linkLabel: '打开控制台',
  },
]
</script>

<template>
  <section aria-labelledby="landing-how-heading">
    <h2 id="landing-how-heading" class="text-base font-semibold text-on-dark">
      如何使用
    </h2>
    <p class="mt-2 text-sm text-[var(--color-muted-strong)]">
      从首次接入到持续运行，流程固定且可在产品内逐步完成。
    </p>

    <ol class="mt-8 space-y-0 divide-y divide-hairline rounded-lg border border-hairline" role="list">
      <li
        v-for="(step, index) in steps"
        :key="step.title"
        class="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:gap-6"
      >
        <span
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-canvas font-mono text-xs text-primary"
          aria-hidden="true"
        >{{ index + 1 }}</span>
        <div class="min-w-0 flex-1">
          <h3 class="text-sm font-semibold text-on-dark">{{ step.title }}</h3>
          <p class="mt-1.5 text-pretty text-sm leading-6 text-body">{{ step.body }}</p>
          <NuxtLink
            v-if="showDashboardEntry"
            :to="step.href"
            class="mt-3 inline-block text-sm font-medium text-primary no-underline hover:text-primary-active"
          >
            {{ step.linkLabel }}
          </NuxtLink>
        </div>
      </li>
    </ol>
  </section>
</template>
