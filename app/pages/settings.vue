<script setup lang="ts">
import type { NetworkId } from '../../shared/types/demo'

useHead({ title: '设置 · YieldAgent' })

const store = useDemoStore()
const saving = ref(false)
const loading = ref(true)

async function load() {
  loading.value = true
  store.clearError()
  try {
    await store.fetchSettings()
  } finally {
    loading.value = false
  }
}

async function handleSave(body: {
  network: NetworkId
  defaultAgentFee: number
  userSplit: number
  apiKey?: string
}) {
  saving.value = true
  store.clearError()
  try {
    await store.updateSettings(body)
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <main class="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-8">
    <header class="mb-6">
      <h1 class="text-2xl font-semibold text-on-dark">设置</h1>
      <p class="mt-2 text-sm text-muted">测试网环境配置。Cobo API Key 来自 `caw onboard` 配对，仅存于会话内存。</p>
    </header>

    <UiPageAlert v-if="store.error" :message="store.error" @retry="load" />

    <div v-if="loading" class="h-48 animate-pulse rounded-lg bg-surface" />

    <SettingsForm
      v-else
      :settings="store.settings"
      :saving="saving"
      @save="handleSave"
    />
  </main>
</template>
