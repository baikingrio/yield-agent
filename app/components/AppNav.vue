<script setup lang="ts">
import { DASHBOARD_HOME } from '#shared/constants/dashboard-routes'

withDefaults(
  defineProps<{
    variant?: 'landing' | 'dashboard'
  }>(),
  { variant: 'landing' },
)
</script>

<template>
  <header
    class="sticky top-0 z-[var(--z-sticky)] flex h-14 items-center gap-4 border-b border-hairline bg-canvas px-4 md:gap-8 md:px-6"
  >
    <NuxtLink
      to="/"
      class="shrink-0 no-underline transition-opacity duration-150 hover:opacity-90"
      aria-label="YieldAgent 首页"
    >
      <UiAppLogo />
    </NuxtLink>

    <nav
      v-if="variant === 'landing'"
      class="flex min-w-0 flex-1 items-center justify-end gap-2"
      aria-label="落地页导航"
    >
      <NuxtLink
        :to="DASHBOARD_HOME"
        class="inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-primary px-3 text-sm font-semibold text-on-primary no-underline transition-colors duration-150 hover:bg-primary-active md:px-4"
      >
        进入 Demo
      </NuxtLink>
    </nav>

    <div v-else class="flex min-w-0 flex-1 items-center justify-end gap-2">
      <AppWalletStatus />
    </div>
  </header>
</template>
