<script setup lang="ts">
import type { LogType } from '#shared/types/app'
import { DASHBOARD_HISTORY } from '#shared/constants/dashboard-routes'

type LogFilter = LogType | 'all'

useHead({ title: '交易历史 · YieldAgent' })

const route = useRoute()
const store = useAppStore()
const filter = ref<LogFilter>('all')
const loading = ref(true)

const pactIdFilter = computed(() => {
  const q = route.query.pactId
  return typeof q === 'string' ? q : undefined
})

async function loadLogs() {
  loading.value = true
  store.clearError()
  try {
    const query = {
      limit: 100,
      ...(filter.value === 'all' ? {} : { type: filter.value }),
      ...(pactIdFilter.value ? { pactId: pactIdFilter.value } : {}),
    }
    await store.fetchLogs(query)
  } finally {
    loading.value = false
  }
}

watch(filter, loadLogs)
watch(pactIdFilter, loadLogs)

onMounted(loadLogs)
</script>

<template>
  <header class="mb-6">
      <h1 class="text-2xl font-semibold text-on-dark">交易历史</h1>
      <p class="mt-2 text-sm text-muted">可审计执行轨迹，与控制台近期日志同源。</p>
      <p v-if="pactIdFilter" class="mt-2 font-mono text-xs text-muted">
        筛选 Pact：{{ pactIdFilter }}
        <NuxtLink :to="DASHBOARD_HISTORY" class="ml-2 text-primary hover:underline">清除筛选</NuxtLink>
      </p>
    </header>

    <UiPageAlert v-if="store.error" :message="store.error" @retry="loadLogs" />

    <HistoryLogTypeFilter v-model="filter" class="mb-6" />

    <HistoryLogTimeline :logs="store.logs" :loading="loading" />
</template>
