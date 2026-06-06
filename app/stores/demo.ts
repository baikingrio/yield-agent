import { defineStore } from 'pinia'
import type {
  CreateStrategyPayload,
  CawReadiness,
  CawOnboardStatus,
  DemoSettings,
  HermesStrategyPingResult,
  StrategyAgentReadiness,
  LogEntry,
  LogType,
  NetworkId,
  Pact,
  Strategy,
  WalletPreparation,
  WalletSummary,
  YieldRange,
  YieldSeries,
  DepositInfo,
} from '../../shared/types/demo'

function apiErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: { error?: string } }).data
    if (data?.error) return data.error
  }
  return '请求失败，请稍后重试'
}

export const useDemoStore = defineStore('demo', () => {
  const wallet = ref<WalletSummary | null>(null)
  const strategies = ref<Strategy[]>([])
  const pacts = ref<Pact[]>([])
  const selectedPact = ref<Pact | null>(null)
  const logs = ref<LogEntry[]>([])
  const yieldSeries = ref<YieldSeries | null>(null)
  const yieldRange = ref<YieldRange>('7d')
  const settings = ref<DemoSettings | null>(null)
  const preparation = ref<WalletPreparation | null>(null)
  const cawReadiness = ref<CawReadiness | null>(null)
  const cawOnboardStatus = ref<CawOnboardStatus | null>(null)
  const strategyAgentReadiness = ref<StrategyAgentReadiness | null>(null)
  const strategyAgentPing = ref<HermesStrategyPingResult | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchWallet() {
    try {
      wallet.value = await $fetch<WalletSummary>('/api/wallet')
    } catch (e) {
      error.value = apiErrorMessage(e)
      throw e
    }
  }

  async function fetchStrategies() {
    try {
      strategies.value = await $fetch<Strategy[]>('/api/strategies')
    } catch (e) {
      error.value = apiErrorMessage(e)
      throw e
    }
  }

  async function fetchPacts(status?: string, options?: { sync?: boolean }) {
    try {
      const query = {
        ...(status ? { status } : {}),
        ...(options?.sync ? { sync: 'true' } : {}),
      }
      pacts.value = await $fetch<Pact[]>('/api/pacts', { query })
    } catch (e) {
      error.value = apiErrorMessage(e)
      throw e
    }
  }

  async function fetchPact(id: string, options?: { sync?: boolean }) {
    try {
      selectedPact.value = await $fetch<Pact>(`/api/pacts/${id}`, {
        query: options?.sync ? { sync: 'true' } : undefined,
      })
      const idx = pacts.value.findIndex((p) => p.id === selectedPact.value?.id)
      if (idx >= 0 && selectedPact.value) pacts.value[idx] = selectedPact.value
    } catch (e) {
      error.value = apiErrorMessage(e)
      throw e
    }
  }

  async function syncPact(id: string) {
    await fetchPact(id, { sync: true })
    await Promise.all([fetchStrategies(), fetchLogs({ limit: 10 })])
    return selectedPact.value
  }

  async function fetchLogs(params?: { type?: LogType; limit?: number }) {
    try {
      logs.value = await $fetch<LogEntry[]>('/api/logs', { query: params })
    } catch (e) {
      error.value = apiErrorMessage(e)
      throw e
    }
  }

  async function fetchYieldSeries(range?: YieldRange) {
    const r = range ?? yieldRange.value
    try {
      yieldSeries.value = await $fetch<YieldSeries>('/api/yield-series', { query: { range: r } })
      yieldRange.value = r
    } catch (e) {
      error.value = apiErrorMessage(e)
      throw e
    }
  }

  async function fetchSettings() {
    try {
      settings.value = await $fetch<DemoSettings>('/api/settings')
    } catch (e) {
      error.value = apiErrorMessage(e)
      throw e
    }
  }

  async function fetchCawReadiness() {
    try {
      cawReadiness.value = await $fetch<CawReadiness>('/api/caw/readiness')
      return cawReadiness.value
    } catch (e) {
      error.value = apiErrorMessage(e)
      throw e
    }
  }

  async function fetchStrategyAgentReadiness() {
    try {
      strategyAgentReadiness.value = await $fetch<StrategyAgentReadiness>('/api/strategy-agent/readiness')
      return strategyAgentReadiness.value
    } catch (e) {
      error.value = apiErrorMessage(e)
      throw e
    }
  }

  async function provisionCawAgent(name: string) {
    try {
      const result = await $fetch<{
        provision: { agentId: string; status: string }
        readiness: CawReadiness
      }>('/api/caw/provision', {
        method: 'POST',
        body: { name },
      })
      cawReadiness.value = result.readiness
      await fetchSettings()
      return result.provision
    } catch (e) {
      error.value = apiErrorMessage(e)
      throw e
    }
  }

  async function fetchCawOnboardStatus() {
    try {
      cawOnboardStatus.value = await $fetch<CawOnboardStatus>('/api/caw/onboard/status')
      return cawOnboardStatus.value
    } catch (e) {
      error.value = apiErrorMessage(e)
      throw e
    }
  }

  async function startCawOnboard(agentName: string, wait = false) {
    try {
      cawOnboardStatus.value = await $fetch<CawOnboardStatus>('/api/caw/onboard/start', {
        method: 'POST',
        body: { agentName, wait },
      })
      await Promise.all([fetchCawReadiness(), fetchSettings()])
      return cawOnboardStatus.value
    } catch (e) {
      error.value = apiErrorMessage(e)
      throw e
    }
  }

  async function continueCawOnboard(sessionId: string, answers: Record<string, unknown>, wait = false) {
    try {
      cawOnboardStatus.value = await $fetch<CawOnboardStatus>('/api/caw/onboard/continue', {
        method: 'POST',
        body: { sessionId, answers, wait },
      })
      await Promise.all([fetchCawReadiness(), fetchSettings()])
      return cawOnboardStatus.value
    } catch (e) {
      error.value = apiErrorMessage(e)
      throw e
    }
  }

  async function pingStrategyAgent() {
    try {
      strategyAgentPing.value = await $fetch<HermesStrategyPingResult>('/api/strategy-agent/ping', {
        method: 'POST',
      })
      await fetchStrategyAgentReadiness()
      return strategyAgentPing.value
    } catch (e) {
      error.value = apiErrorMessage(e)
      throw e
    }
  }

  async function updateSettings(body: {
    network?: NetworkId
    defaultAgentFee?: number
    userSplit?: number
    apiKey?: string
  }) {
    settings.value = await $fetch<DemoSettings>('/api/settings', { method: 'PUT', body })
  }

  async function approvePact(id: string) {
    const pact = await $fetch<Pact>(`/api/pacts/${id}/approve`, { method: 'POST' })
    const idx = pacts.value.findIndex((p) => p.id === id)
    if (idx >= 0) pacts.value[idx] = pact
    if (selectedPact.value?.id === id) selectedPact.value = pact
    return pact
  }

  async function terminatePact(id: string) {
    const pact = await $fetch<Pact>(`/api/pacts/${id}/terminate`, { method: 'POST' })
    const idx = pacts.value.findIndex((p) => p.id === id)
    if (idx >= 0) pacts.value[idx] = pact
    if (selectedPact.value?.id === id) selectedPact.value = pact
    await fetchStrategies()
    return pact
  }

  async function createStrategy(payload: CreateStrategyPayload) {
    return $fetch<{ strategy: Strategy; pact: Pact }>('/api/strategies', {
      method: 'POST',
      body: payload,
    })
  }

  async function fetchPreparation() {
    try {
      preparation.value = await $fetch<WalletPreparation>('/api/wallet/preparation')
      if (preparation.value.ready) {
        await fetchWallet()
      }
    } catch (e) {
      error.value = apiErrorMessage(e)
      throw e
    }
  }

  async function connectEoa(address: string, label?: string) {
    preparation.value = await $fetch<WalletPreparation>('/api/wallet/preparation/connect-eoa', {
      method: 'POST',
      body: { address, label },
    })
    return preparation.value
  }

  async function disconnectEoa() {
    preparation.value = await $fetch<WalletPreparation>('/api/wallet/preparation/disconnect-eoa', {
      method: 'POST',
    })
    wallet.value = await $fetch<WalletSummary>('/api/wallet')
    return preparation.value
  }

  async function createAgentWallet() {
    preparation.value = await $fetch<WalletPreparation>('/api/wallet/preparation/create-agent', {
      method: 'POST',
    })
    await Promise.all([fetchWallet(), fetchSettings(), fetchCawReadiness()])
    return preparation.value
  }

  async function depositToAgentWallet(amountUsdc: number, txHash: string) {
    preparation.value = await $fetch<WalletPreparation>('/api/wallet/preparation/deposit', {
      method: 'POST',
      body: { amountUsdc, txHash },
    })
    await Promise.all([fetchWallet(), fetchLogs({ limit: 10 })])
    return preparation.value
  }

  async function fetchDepositInfo(amountUsdc: number) {
    return $fetch<DepositInfo>('/api/wallet/preparation/deposit-info', {
      query: { amountUsdc },
    })
  }

  async function resetPreparation() {
    preparation.value = await $fetch<WalletPreparation>('/api/wallet/preparation/reset', {
      method: 'POST',
    })
    await fetchWallet()
    return preparation.value
  }

  function clearError() {
    error.value = null
  }

  return {
    wallet,
    strategies,
    pacts,
    selectedPact,
    logs,
    yieldSeries,
    yieldRange,
    settings,
    preparation,
    cawReadiness,
    cawOnboardStatus,
    strategyAgentReadiness,
    strategyAgentPing,
    loading,
    error,
    fetchWallet,
    fetchStrategies,
    fetchPacts,
    fetchPact,
    syncPact,
    fetchLogs,
    fetchYieldSeries,
    fetchSettings,
    fetchCawReadiness,
    fetchCawOnboardStatus,
    startCawOnboard,
    continueCawOnboard,
    fetchStrategyAgentReadiness,
    pingStrategyAgent,
    provisionCawAgent,
    updateSettings,
    approvePact,
    terminatePact,
    createStrategy,
    fetchPreparation,
    connectEoa,
    disconnectEoa,
    createAgentWallet,
    depositToAgentWallet,
    fetchDepositInfo,
    resetPreparation,
    clearError,
  }
})
