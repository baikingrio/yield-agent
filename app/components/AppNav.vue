<script setup lang="ts">
const route = useRoute()

const appLinks = [
  { to: '/wallet', label: '资金准备' },
  { to: '/dashboard', label: 'Demo 控制台' },
  { to: '/create-strategy', label: '创建策略' },
  { to: '/pacts', label: 'Pact 管理' },
  { to: '/history', label: '交易历史' },
  { to: '/settings', label: '设置' },
]

const landingLinks = [
  { to: '/wallet', label: '准备资金', variant: 'secondary' },
  { to: '/create-strategy?mode=demo&template=conservative-usdc', label: '体验 Demo', variant: 'primary' },
]

const isLanding = computed(() => route.path === '/')

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <header
    class="sticky top-0 z-[var(--z-sticky)] flex h-14 items-center gap-8 border-b border-hairline bg-canvas px-4 md:px-6"
  >
    <NuxtLink
      to="/"
      class="shrink-0 text-sm font-semibold text-primary no-underline hover:text-primary-active"
    >
      YieldAgent
    </NuxtLink>

    <nav
      v-if="isLanding"
      class="flex min-w-0 flex-1 justify-end gap-2"
      aria-label="落地页导航"
    >
      <NuxtLink
        v-for="link in landingLinks"
        :key="link.to"
        :to="link.to"
        class="inline-flex h-9 shrink-0 items-center justify-center rounded-md px-3 text-sm font-semibold no-underline transition-colors duration-150 md:px-4"
        :class="
          link.variant === 'primary'
            ? 'bg-primary text-on-primary hover:bg-primary-active'
            : 'border border-hairline text-body hover:bg-surface-elevated'
        "
      >
        {{ link.label }}
      </NuxtLink>
    </nav>

    <template v-else>
      <nav class="flex min-w-0 flex-1 gap-5 overflow-x-auto" aria-label="应用导航">
        <NuxtLink
          v-for="link in appLinks"
          :key="link.to"
          :to="link.to"
          class="shrink-0 border-b-2 pb-0.5 text-sm font-medium no-underline transition-colors duration-150"
          :class="
            isActive(link.to)
              ? 'border-primary text-on-dark'
              : 'border-transparent text-muted hover:text-body'
          "
        >
          {{ link.label }}
        </NuxtLink>
      </nav>
      <span
        class="hidden shrink-0 rounded-sm bg-surface-elevated px-2 py-1 font-mono text-[0.65rem] text-muted-strong md:inline"
        title="演示模式"
      >
        演示
      </span>
    </template>
  </header>
</template>
