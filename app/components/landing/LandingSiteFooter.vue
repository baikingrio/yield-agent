<script setup lang="ts">
import {
  DASHBOARD_CREATE_STRATEGY,
  DASHBOARD_HISTORY,
  DASHBOARD_HOME,
  DASHBOARD_PACTS,
} from '#shared/constants/dashboard-routes'

const props = withDefaults(defineProps<{
  /** Dashboard layout provides the divider; skip the component border. */
  embedded?: boolean
}>(), {
  embedded: false,
})

const store = useAppStore()
const { isConnected } = useWalletConnect()

const showDashboardEntry = computed(
  () => isConnected.value || Boolean(store.preparation?.eoa.connected),
)

const links = [
  { to: DASHBOARD_HOME, label: '控制台' },
  { to: DASHBOARD_CREATE_STRATEGY, label: '创建策略' },
  { to: DASHBOARD_PACTS, label: 'Pact 管理' },
  { to: DASHBOARD_HISTORY, label: '交易历史' },
]
</script>

<template>
  <footer :class="props.embedded ? undefined : 'border-t border-hairline pt-10'">
    <div class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <UiAppLogo variant="full" size="sm" />
        <p class="mt-3 max-w-[50ch] text-xs leading-5 text-[var(--color-muted-strong)]">
          基于 Cobo Agentic Wallet 的自主收益 Agent 平台。当前运行于 Base Sepolia 测试网，不涉及主网资产。
        </p>
      </div>
      <div class="flex flex-col items-start gap-4 sm:items-end">
        <nav
          v-if="showDashboardEntry"
          class="flex flex-wrap gap-x-5 gap-y-2"
          aria-label="产品导航"
        >
          <NuxtLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="text-sm text-[var(--color-muted-strong)] no-underline hover:text-body"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>
        <div class="flex items-center gap-2">
          <span class="text-xs text-muted-strong">主题</span>
          <UiThemeToggle />
        </div>
      </div>
    </div>
  </footer>
</template>
