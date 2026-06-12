<script setup lang="ts">
import type { LogEntry, LogType } from '#shared/types/app'
import { DASHBOARD_HISTORY } from '#shared/constants/dashboard-routes'
import { extractApiErrorMessage } from '~/utils/api-error'

type LogFilter = LogType | 'all'

useHead({ title: '交易历史 · YieldAgent' })

const route = useRoute()
const filter = ref<LogFilter>('all')
const historyLogs = ref<LogEntry[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const pactIdFilter = computed(() => {
  const q = route.query.pactId
  return typeof q === 'string' ? q : undefined
})

function buildQuery() {
  return {
    limit: 100,
    ...(filter.value === 'all' ? {} : { type: filter.value }),
    ...(pactIdFilter.value ? { pactId: pactIdFilter.value } : {}),
  }
}

async function loadLogs() {
  const showSkeleton = historyLogs.value.length === 0
  if (showSkeleton) loading.value = true
  error.value = null
  try {
    historyLogs.value = await $fetch<LogEntry[]>('/api/logs', { query: buildQuery() })
  } catch (e) {
    error.value = extractApiErrorMessage(e)
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

    <UiPageAlert v-if="error" :message="error" @retry="loadLogs" />

    <HistoryLogTypeFilter v-model="filter" class="mb-6" />

    <HistoryLogTimeline :logs="historyLogs" :loading="loading" />
</template>
