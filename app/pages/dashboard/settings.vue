<script setup lang="ts">
import type { NetworkId } from '#shared/types/app'

useHead({ title: '设置 · YieldAgent' })

const store = useAppStore()
const saving = ref(false)
const cawBusy = ref(false)
const strategyBusy = ref(false)
const loading = ref(true)

async function load() {
  loading.value = true
  store.clearError()
  try {
    await Promise.all([
      store.fetchSettings(),
      store.fetchCawReadiness(),
      store.fetchDeploymentCheck({ sync: false }).catch(() => null),
      store.fetchCawOnboardStatus({ sync: false }),
      store.fetchStrategyAgentReadiness(),
    ])
    void Promise.all([
      store.fetchDeploymentCheck({ sync: true }).catch(() => null),
      store.fetchCawOnboardStatus({ sync: true }).catch(() => null),
    ])
  } finally {
    loading.value = false
  }
}

async function handleSave(body: {
  network: NetworkId
  defaultAgentFee: number
  userSplit: number
  apiKey?: string
  developerMode?: boolean
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

async function refreshDeploymentCheck() {
  cawBusy.value = true
  store.clearError()
  try {
    await store.fetchDeploymentCheck({ sync: true })
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

async function refreshCawOnboardStatus() {
  cawBusy.value = true
  store.clearError()
  try {
    await store.fetchCawOnboardStatus({ sync: true })
  } finally {
    cawBusy.value = false
  }
}

async function startCawOnboard(agentName: string) {
  cawBusy.value = true
  store.clearError()
  try {
    await store.startCawOnboard(agentName)
  } finally {
    cawBusy.value = false
  }
}

async function continueCawOnboard(sessionId: string, answers: Record<string, unknown>) {
  cawBusy.value = true
  store.clearError()
  try {
    await store.continueCawOnboard(sessionId, answers)
  } finally {
    cawBusy.value = false
  }
}

async function refreshStrategyAgentReadiness() {
  strategyBusy.value = true
  store.clearError()
  try {
    await store.fetchStrategyAgentReadiness()
  } finally {
    strategyBusy.value = false
  }
}

async function pingStrategyAgent() {
  strategyBusy.value = true
  store.clearError()
  try {
    await store.pingStrategyAgent()
  } finally {
    strategyBusy.value = false
  }
}

onMounted(load)
</script>

<template>
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

    <SettingsAppearanceCard v-if="!loading" />

    <SettingsCawDeploymentCheckCard
      v-if="!loading"
      :check="store.deploymentCheck"
      :busy="cawBusy"
      @refresh="refreshDeploymentCheck"
    />

    <SettingsCawReadinessCard
      v-if="!loading"
      :readiness="store.cawReadiness"
      :busy="cawBusy"
      @refresh="refreshCawReadiness"
      @provision="provisionCawAgent"
    />

    <SettingsCawOnboardCard
      v-if="!loading"
      :status="store.cawOnboardStatus"
      :busy="cawBusy"
      @refresh="refreshCawOnboardStatus"
      @start="startCawOnboard"
      @continue="continueCawOnboard"
    />

    <SettingsStrategyAgentReadinessCard
      v-if="!loading"
      :readiness="store.strategyAgentReadiness"
      :ping-result="store.strategyAgentPing"
      :busy="strategyBusy"
      @refresh="refreshStrategyAgentReadiness"
      @ping="pingStrategyAgent"
    />
</template>
