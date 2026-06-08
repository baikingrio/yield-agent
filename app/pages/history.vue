<script setup lang="ts">
import { DASHBOARD_HISTORY } from '#shared/constants/dashboard-routes'

const route = useRoute()
await navigateTo({ path: DASHBOARD_HISTORY, query: route.query }, { replace: true })
</script>

<template>
  <div />
</template>
