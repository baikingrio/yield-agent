<script setup lang="ts">
import type { NetworkId } from '../../shared/types/demo'

useHead({ title: '设置 · YieldAgent' })

const store = useDemoStore()
const saving = ref(false)
const cawBusy = ref(false)
const loading = ref(true)

async function load() {
  loading.value = true
  store.clearError()
  try {
    await Promise.all([store.fetchSettings(), store.fetchCawReadiness()])
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
    await store.fetchCawReadiness()
  } finally {
    saving.value = false
  }
}

async function refreshCawReadiness() {
  cawBusy.value = true
  store.clearError()
  try {
    await store.fetchCawReadiness()
  } finally {
    cawBusy.value = false
  }
}

async function provisionCawAgent(name: string) {
  cawBusy.value = true
  store.clearError()
  try {
    await store.provisionCawAgent(name)
  } finally {
    cawBusy.value = false
  }
}

onMounted(load)
</script>

<template>
  <main class="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-8">
    <header class="mb-6">
      <h1 class="text-2xl font-semibold text-on-dark">设置</h1>
      <p class="mt-2 text-sm text-muted">测试网环境配置。API Key 可手动填入，也可在下方通过 CAW provision 创建；敏感凭证仅保存在服务端会话内存。</p>
    </header>

    <UiPageAlert v-if="store.error" :message="store.error" @retry="load" />

    <div v-if="loading" class="h-48 animate-pulse rounded-lg bg-surface" />

    <SettingsForm
      v-else
      :settings="store.settings"
      :saving="saving"
      @save="handleSave"
    />

    <SettingsCawReadinessCard
      v-if="!loading"
      :readiness="store.cawReadiness"
      :busy="cawBusy"
      @refresh="refreshCawReadiness"
      @provision="provisionCawAgent"
    />
  </main>
</template>
