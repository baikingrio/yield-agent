<script setup lang="ts">
const store = useAppStore()
const preparationReady = computed(() => Boolean(store.preparation?.ready))
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-canvas">
    <AppNav variant="dashboard" />
    <div class="flex min-h-0 flex-1 flex-col md:flex-row">
      <DashboardSidebar v-if="preparationReady" />
      <main class="min-w-0 flex-1 px-4 py-6 md:px-6 md:py-8">
        <slot />
      </main>
    </div>
    <div class="mt-auto px-4 pb-8 md:px-6">
      <div class="mx-auto max-w-7xl">
        <LandingSiteFooter />
      </div>
    </div>
  </div>
</template>
