import { defineStore } from 'pinia'
import type {
  CreateStrategyPayload,
  CawReadiness,
  CawDeploymentCheck,
  CawOnboardStatus,
  AppSettings,
  HermesStrategyPingResult,
  StrategyAgentReadiness,
  LogEntry,
  LogType,
  NetworkId,
  Pact,
  Strategy,
  AgentBootstrapState,
  AgentBootstrapStatusResponse,
  WalletPreparation,
  WalletSummary,
  YieldRange,
  YieldSeries,
  DepositInfo,
} from '../../shared/types/app'

import { extractApiErrorMessage } from '~/utils/api-error'

function apiErrorMessage(err: unknown): string {
  return extractApiErrorMessage(err)
}

export const useAppStore = defineStore('app', () => {
  const wallet = ref<WalletSummary | null>(null)
  const strategies = ref<Strategy[]>([])
  const pacts = ref<Pact[]>([])
  const selectedPact = ref<Pact | null>(null)
  const logs = ref<LogEntry[]>([])
  const yieldSeries = ref<YieldSeries | null>(null)
  const yieldRange = ref<YieldRange>('7d')
  const settings = ref<AppSettings | null>(null)
  const preparation = ref<WalletPreparation | null>(null)
  const agentBootstrap = ref<AgentBootstrapState | null>(null)
  const cawReadiness = ref<CawReadiness | null>(null)
  const deploymentCheck = ref<CawDeploymentCheck | null>(null)
  const cawOnboardStatus = ref<CawOnboardStatus | null>(null)
  const strategyAgentReadiness = ref<StrategyAgentReadiness | null>(null)
  const strategyAgentPing = ref<HermesStrategyPingResult | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchWallet(options?: { sync?: boolean }) {
    try {
      const query = options?.sync ? { sync: 'true' } : undefined
      wallet.value = await $fetch<WalletSummary>('/api/wallet', { query })
    } catch (e) {
      error.value = apiErrorMessage(e)
      throw e
    }
  }

  async function fetchStrategies(options?: { sync?: boolean }) {
    try {
      strategies.value = await $fetch<Strategy[]>('/api/strategies', {
        query: options?.sync ? { sync: 'true' } : undefined,
      })
    } catch (e) {
      error.value = apiErrorMessage(e)
      throw e
    }
  }

  /** Import remote Cobo pacts first, then load strategies (order matters). */
  async function syncPortfolioFromCobo(status?: string) {
    await fetchPacts(status, { sync: true })
    await fetchStrategies()
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

  async function fetchLogs(params?: { type?: LogType; limit?: number; pactId?: string }) {
    try {
      logs.value = await $fetch<LogEntry[]>('/api/logs', { query: params })
    } catch (e) {
      error.value = apiErrorMessage(e)
      throw e
    }
  }

  async function fetchYieldSeries(range?: YieldRange, options?: { sync?: boolean }) {
    const r = range ?? yieldRange.value
    try {
      yieldSeries.value = await $fetch<YieldSeries>('/api/yield-series', {
        query: {
          range: r,
          ...(options?.sync ? { sync: 'true' } : {}),
        },
      })
      yieldRange.value = r
    } catch (e) {
      error.value = apiErrorMessage(e)
      throw e
    }
  }

  async function fetchSettings() {
    try {
      settings.value = await $fetch<AppSettings>('/api/settings')
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

  async function fetchDeploymentCheck(options?: { sync?: boolean }) {
    try {
      const query = options?.sync ? { sync: 'true' } : undefined
      deploymentCheck.value = await $fetch<CawDeploymentCheck>('/api/caw/deployment-check', { query })
      return deploymentCheck.value
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

  async function fetchCawOnboardStatus(options?: { sync?: boolean }) {
    try {
      const query = options?.sync ? { sync: 'true' } : undefined
      cawOnboardStatus.value = await $fetch<CawOnboardStatus>('/api/caw/onboard/status', { query })
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
    defaultAgentFee?: number
    userSplit?: number
    apiKey?: string
    developerMode?: boolean
  }) {
    settings.value = await $fetch<AppSettings>('/api/settings', { method: 'PUT', body })
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
    const result = await $fetch<{ strategy: Strategy; pact: Pact }>('/api/strategies', {
      method: 'POST',
      body: payload,
    })
    strategies.value = [result.strategy, ...strategies.value.filter((s) => s.id !== result.strategy.id)]
    pacts.value = [result.pact, ...pacts.value.filter((p) => p.id !== result.pact.id)]
    await fetchLogs({ limit: 10 })
    return result
  }

  async function executePact(id: string) {
    const result = await $fetch<import('../../shared/types/app').PactExecutionResult>(`/api/pacts/${id}/execute`, {
      method: 'POST',
    })
    await fetchPact(id)
    await fetchLogs({ limit: 10, pactId: id })
    return result
  }

  async function simulatePactDenial(id: string) {
    const result = await $fetch<import('../../shared/types/app').PactDenialResult>(`/api/pacts/${id}/simulate-denial`, {
      method: 'POST',
    })
    await fetchLogs({ limit: 10, pactId: id })
    return result
  }

  async function redeemPact(id: string) {
    const result = await $fetch<import('../../shared/types/app').PactRedeemResult>(`/api/pacts/${id}/redeem`, {
      method: 'POST',
    })
    await Promise.all([
      fetchPact(id),
      fetchWallet({ sync: true }),
      fetchLogs({ limit: 10, pactId: id }),
    ])
    return result
  }

  async function fetchPactPosition(id: string) {
    return $fetch<import('../../shared/types/app').YieldPositionSnapshot & {
      pactId: string
      status: string
      firstExecutionCompleted: boolean
      redeemCompleted: boolean
    }>(`/api/pacts/${id}/position`)
  }

  async function parseStrategyText(text: string, limits: import('../../shared/types/app').StrategyParseLimits) {
    return $fetch<import('../../shared/types/app').StrategyParseResponse>('/api/strategy-agent/parse', {
      method: 'POST',
      body: { text, limits },
    })
  }

  async function fetchPreparation() {
    try {
      preparation.value = await $fetch<WalletPreparation>('/api/wallet/preparation')
      if (preparation.value.ready) {
        if (!wallet.value) {
          await fetchWallet({ sync: false })
        }
        void fetchWallet({ sync: true })
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

  function applyAgentBootstrapResponse(response: AgentBootstrapStatusResponse | {
    preparation: WalletPreparation
    bootstrap?: AgentBootstrapState | null
    done?: boolean
  }) {
    preparation.value = response.preparation
    agentBootstrap.value = response.bootstrap
      ?? response.preparation.agentBootstrap
      ?? null
    return response
  }

  async function createAgentWallet() {
    const response = await $fetch<{
      preparation: WalletPreparation
      bootstrap: AgentBootstrapState | null
      done: boolean
    }>('/api/wallet/preparation/create-agent', {
      method: 'POST',
    })
    applyAgentBootstrapResponse(response)
    void Promise.all([fetchWallet({ sync: true }), fetchSettings(), fetchCawReadiness()])
    return preparation.value
  }

  async function pollAgentWalletStatus() {
    const response = await $fetch<AgentBootstrapStatusResponse>('/api/wallet/preparation/agent-status')
    applyAgentBootstrapResponse(response)
    return response
  }

  async function importAgentWalletFromCli() {
    preparation.value = await $fetch<WalletPreparation>('/api/wallet/preparation/import-agent', {
      method: 'POST',
    })
    agentBootstrap.value = preparation.value?.agentBootstrap ?? null
    void Promise.all([fetchWallet({ sync: true }), fetchSettings(), fetchCawReadiness()])
    return preparation.value
  }

  async function depositToAgentWallet(amountUsdc: number, txHash: string) {
    preparation.value = await $fetch<WalletPreparation>('/api/wallet/preparation/deposit', {
      method: 'POST',
      body: { amountUsdc, txHash },
    })
    await Promise.all([fetchWallet({ sync: true }), fetchLogs({ limit: 10 })])
    return preparation.value
  }

  async function fetchDepositInfo(amountUsdc: number) {
    return $fetch<DepositInfo>('/api/wallet/preparation/deposit-info', {
      query: { amountUsdc },
    })
  }

  async function fetchWithdrawInfo(amountUsdc?: number) {
    return $fetch<import('../../shared/types/app').WithdrawInfo>('/api/wallet/withdraw-info', {
      query: amountUsdc !== undefined ? { amountUsdc } : undefined,
    })
  }

  async function withdrawFromAgentWallet(amountUsdc: number) {
    const result = await $fetch<import('../../shared/types/app').WithdrawResult>('/api/wallet/withdraw', {
      method: 'POST',
      body: { amountUsdc },
    })
    await Promise.all([fetchWallet({ sync: true }), fetchPreparation(), fetchLogs({ limit: 10 })])
    return result
  }

  async function fetchAgentGasStatus() {
    return $fetch<import('../../shared/types/app').AgentGasStatus>('/api/wallet/preparation/gas-status')
  }

  async function resetPreparation() {
    const response = await $fetch<{ preparation: WalletPreparation; warning: string | null }>(
      '/api/wallet/preparation/reset',
      { method: 'POST' },
    )
    preparation.value = response.preparation
    agentBootstrap.value = response.preparation.agentBootstrap ?? null
    await fetchWallet({ sync: true })
    return response
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
    agentBootstrap,
    cawReadiness,
    deploymentCheck,
    cawOnboardStatus,
    strategyAgentReadiness,
    strategyAgentPing,
    loading,
    error,
    fetchWallet,
    fetchStrategies,
    syncPortfolioFromCobo,
    fetchPacts,
    fetchPact,
    syncPact,
    fetchLogs,
    fetchYieldSeries,
    fetchSettings,
    fetchCawReadiness,
    fetchDeploymentCheck,
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
    executePact,
    redeemPact,
    fetchPactPosition,
    simulatePactDenial,
    parseStrategyText,
    fetchPreparation,
    connectEoa,
    disconnectEoa,
    createAgentWallet,
    pollAgentWalletStatus,
    importAgentWalletFromCli,
    depositToAgentWallet,
    fetchDepositInfo,
    fetchWithdrawInfo,
    withdrawFromAgentWallet,
    fetchAgentGasStatus,
    resetPreparation,
    clearError,
  }
})
