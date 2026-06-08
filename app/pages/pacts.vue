<script setup lang="ts">
import { DASHBOARD_PACTS } from '#shared/constants/dashboard-routes'

const route = useRoute()
await navigateTo({ path: DASHBOARD_PACTS, query: route.query }, { replace: true })
</script>

<template>
  <div />
</template>
