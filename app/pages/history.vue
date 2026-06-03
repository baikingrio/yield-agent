<script setup lang="ts">
import type { LogType } from '../../shared/types/demo'

type LogFilter = LogType | 'all'

useHead({ title: '交易历史 · YieldAgent' })

const store = useDemoStore()
const filter = ref<LogFilter>('all')
const loading = ref(true)

async function loadLogs() {
  loading.value = true
  store.clearError()
  try {
    const query =
      filter.value === 'all' ? { limit: 100 } : { type: filter.value, limit: 100 }
    await store.fetchLogs(query)
  } finally {
    loading.value = false
  }
}

watch(filter, loadLogs)

onMounted(loadLogs)
</script>

<template>
  <main class="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-8">
    <header class="mb-6">
      <h1 class="text-2xl font-semibold text-on-dark">交易历史</h1>
      <p class="mt-2 text-sm text-muted">可审计执行轨迹，与控制台近期日志同源。</p>
    </header>

    <UiPageAlert v-if="store.error" :message="store.error" @retry="loadLogs" />

    <HistoryLogTypeFilter v-model="filter" class="mb-6" />

    <HistoryLogTimeline :logs="store.logs" :loading="loading" />
  </main>
</template>
