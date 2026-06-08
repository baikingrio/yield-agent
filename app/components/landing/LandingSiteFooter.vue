<script setup lang="ts">
import {
  DASHBOARD_CREATE_STRATEGY,
  DASHBOARD_HISTORY,
  DASHBOARD_HOME,
  DASHBOARD_PACTS,
} from '#shared/constants/dashboard-routes'

const links = [
  { to: DASHBOARD_HOME, label: '控制台' },
  { to: DASHBOARD_CREATE_STRATEGY, label: '创建策略' },
  { to: DASHBOARD_PACTS, label: 'Pact 管理' },
  { to: DASHBOARD_HISTORY, label: '交易历史' },
]
</script>

<template>
  <footer class="border-t border-hairline pt-10">
    <div class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-semibold text-on-dark">YieldAgent</p>
        <p class="mt-2 max-w-[50ch] text-xs leading-5 text-[var(--color-muted-strong)]">
          基于 Cobo Agentic Wallet 的自主收益 Agent 平台。当前运行于 Base / Arbitrum Sepolia 测试网，不涉及主网资产。
        </p>
      </div>
      <nav class="flex flex-wrap gap-x-5 gap-y-2" aria-label="产品导航">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="text-sm text-[var(--color-muted-strong)] no-underline hover:text-body"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>
    </div>
  </footer>
</template>
