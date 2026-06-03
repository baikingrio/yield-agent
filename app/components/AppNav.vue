<script setup lang="ts">
const route = useRoute()

const links = [
  { to: '/', label: '首页' },
  { to: '/dashboard', label: 'Demo 控制台' },
  { to: '/create-strategy', label: '创建策略' },
  { to: '/pacts', label: 'Pact 管理' },
  { to: '/history', label: '交易历史' },
  { to: '/settings', label: '设置' },
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <header
    class="sticky top-0 z-[var(--z-sticky)] flex h-14 items-center gap-8 border-b border-hairline bg-canvas/95 px-4 backdrop-blur md:px-6"
  >
    <NuxtLink
      to="/"
      class="shrink-0 text-sm font-semibold text-primary no-underline hover:text-primary-active"
    >
      YieldAgent
    </NuxtLink>
    <nav class="flex min-w-0 flex-1 gap-5 overflow-x-auto" aria-label="主导航">
      <NuxtLink
        v-for="link in links"
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
  </header>
</template>
