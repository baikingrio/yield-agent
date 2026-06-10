<script setup lang="ts">
const store = useAppStore()
const preparationReady = computed(() => Boolean(store.preparation?.ready))
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-canvas">
    <AppNav variant="dashboard" />
    <div class="flex min-h-0 flex-1 flex-col md:flex-row">
      <DashboardSidebar v-if="preparationReady" />
      <main class="min-w-0 flex-1 py-6 md:py-8">
        <div class="mx-auto w-full max-w-7xl px-4 md:px-6">
          <slot />
        </div>
      </main>
    </div>
    <div class="mt-auto border-t border-hairline">
      <div class="mx-auto w-full max-w-7xl px-4 pb-8 pt-6 md:px-6">
        <LandingSiteFooter />
      </div>
    </div>
  </div>
</template>
