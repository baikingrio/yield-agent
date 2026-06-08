<script setup lang="ts">
import { DASHBOARD_HOME } from '#shared/constants/dashboard-routes'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const store = useAppStore()
const { init: initPreparation } = useWalletPreparation()

const preparationReady = computed(() => Boolean(store.preparation?.ready))

useDashboardPoll()

onMounted(() => {
  void initPreparation()
})

watch(
  [preparationReady, () => route.path],
  ([ready, path]) => {
    if (!ready && path !== DASHBOARD_HOME) {
      void navigateTo(DASHBOARD_HOME, { replace: true })
    }
  },
  { immediate: true },
)
</script>

<template>
  <DashboardOnboarding v-if="!preparationReady" />
  <NuxtPage v-else />
</template>
