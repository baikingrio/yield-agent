<script setup lang="ts">
import { DASHBOARD_CREATE_STRATEGY } from '#shared/constants/dashboard-routes'

const route = useRoute()
await navigateTo({ path: DASHBOARD_CREATE_STRATEGY, query: route.query }, { replace: true })
</script>

<template>
  <div />
</template>
