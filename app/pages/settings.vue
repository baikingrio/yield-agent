<script setup lang="ts">
import { DASHBOARD_SETTINGS } from '#shared/constants/dashboard-routes'

const route = useRoute()
await navigateTo({ path: DASHBOARD_SETTINGS, query: route.query }, { replace: true })
</script>

<template>
  <div />
</template>
