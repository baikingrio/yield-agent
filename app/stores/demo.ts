import { defineStore } from 'pinia'
import type {
  CreateStrategyPayload,
  DemoSettings,
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

  async function fetchPacts(status?: string) {
    try {
      const query = status ? { status } : undefined
      pacts.value = await $fetch<Pact[]>('/api/pacts', { query })
    } catch (e) {
      error.value = apiErrorMessage(e)
      throw e
    }
  }

  async function fetchPact(id: string) {
    try {
      selectedPact.value = await $fetch<Pact>(`/api/pacts/${id}`)
    } catch (e) {
      error.value = apiErrorMessage(e)
      throw e
    }
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
    await fetchWallet()
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
    loading,
    error,
    fetchWallet,
    fetchStrategies,
    fetchPacts,
    fetchPact,
    fetchLogs,
    fetchYieldSeries,
    fetchSettings,
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
