<script setup lang="ts">
import {
  DASHBOARD_CREATE_STRATEGY,
  DASHBOARD_HISTORY,
  DASHBOARD_HOME,
  DASHBOARD_PACTS,
  DASHBOARD_SETTINGS,
} from '#shared/constants/dashboard-routes'

const route = useRoute()

const items = [
  { to: DASHBOARD_HOME, label: '概览', exact: true },
  { to: DASHBOARD_CREATE_STRATEGY, label: '创建策略' },
  { to: DASHBOARD_PACTS, label: 'Pact 管理' },
  { to: DASHBOARD_HISTORY, label: '交易历史' },
  { to: DASHBOARD_SETTINGS, label: '设置' },
]

function isActive(to: string, exact?: boolean) {
  if (exact) return route.path === to
  return route.path === to || route.path.startsWith(`${to}/`)
}
</script>

<template>
  <nav
    class="w-full shrink-0 border-b border-hairline bg-surface px-3 py-4 md:w-56 md:border-b-0 md:border-r md:py-6"
    aria-label="控制台导航"
  >
    <ul class="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      <li v-for="item in items" :key="item.to" class="shrink-0 md:shrink">
        <NuxtLink
          :to="item.to"
          class="block rounded-md px-3 py-2 text-sm font-medium no-underline transition-colors duration-150"
          :class="
            isActive(item.to, item.exact)
              ? 'bg-primary/10 text-on-dark'
              : 'text-muted hover:bg-surface-elevated hover:text-body'
          "
        >
          {{ item.label }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
