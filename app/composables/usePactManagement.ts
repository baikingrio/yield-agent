import { DASHBOARD_PACTS } from '#shared/constants/dashboard-routes'
import type { AgentGasStatus, Pact, Strategy, YieldPositionSnapshot } from '#shared/types/app'
import { extractApiErrorMessage } from '~/utils/api-error'
import { useAgentGasFunding } from '~/composables/useAgentGasFunding'
import {
  isPactFilterTab,
  pactListFetchStatus,
  pactMatchesFilter,
  type PactFilterTab,
} from '~/utils/pact-filter'

const POLL_MS = 4000
const MAX_POLL_ATTEMPTS = 75

export function usePactManagement() {
  const route = useRoute()
  const router = useRouter()
  const store = useAppStore()
  const { fundAgentGas, funding: fundingGas, fundingError: gasFundingError, eoaConnected } = useAgentGasFunding()

  const busy = ref(false)
  const gasStatus = ref<AgentGasStatus | null>(null)
  const loading = ref(true)
  const actionBanner = ref<{ tone: 'success' | 'error' | 'info'; message: string } | null>(null)
  const executeError = ref('')
  const executing = ref(false)
  const redeeming = ref(false)
  const redeemError = ref('')
  const yieldPosition = ref<(YieldPositionSnapshot & { redeemCompleted?: boolean }) | null>(null)
  const pollAttempt = ref(0)
  const waitingSeconds = ref(0)
  const autoExecuteAttempted = ref(false)

  let pollTimer: ReturnType<typeof setTimeout> | null = null
  let waitingTimer: ReturnType<typeof setInterval> | null = null
  let pollAborted = false

  const statusFilter = computed<PactFilterTab>(() => {
    const q = route.query.status
    if (isPactFilterTab(q)) return q
    return 'active'
  })

  const filteredPacts = computed(() =>
    store.pacts.filter((p) => pactMatchesFilter(p, statusFilter.value)),
  )

  const awaitingCount = computed(() =>
    store.pacts.filter((p) => pactMatchesFilter(p, 'awaiting-approval')).length,
  )

  const selectedId = computed({
    get: () => resolveSelectedId(route.query.id, store.pacts),
    set: (id: string) => {
      router.replace({
        path: DASHBOARD_PACTS,
        query: {
          ...(statusFilter.value !== 'all' ? { status: statusFilter.value } : {}),
          id,
        },
      })
    },
  })

  const selectedPact = computed(() =>
    store.pacts.find((p) => p.id === selectedId.value)
    ?? store.pacts.find((p) => p.coboPactId === selectedId.value)
    ?? null,
  )

  const selectedStrategy = computed((): Strategy | null => {
    if (!selectedPact.value) return null
    return store.strategies.find((s) => s.id === selectedPact.value!.strategyId) ?? null
  })

  function resolveSelectedId(
    queryId: unknown,
    pacts: Pact[],
  ): string | null {
    if (typeof queryId !== 'string' || !queryId) {
      return pacts[0]?.id ?? null
    }
    if (pacts.some((p) => p.id === queryId || p.coboPactId === queryId)) {
      const match = pacts.find((p) => p.id === queryId || p.coboPactId === queryId)
      return match?.id ?? queryId
    }
    return queryId
  }

  function clearPollTimer() {
    pollAborted = true
    if (pollTimer) {
      clearTimeout(pollTimer)
      pollTimer = null
    }
    if (waitingTimer) {
      clearInterval(waitingTimer)
      waitingTimer = null
    }
    pollAttempt.value = 0
    waitingSeconds.value = 0
  }

  function setStatusFilter(tab: PactFilterTab) {
    router.replace({
      path: DASHBOARD_PACTS,
      query: {
        ...(tab !== 'all' ? { status: tab } : {}),
        ...(selectedId.value ? { id: selectedId.value } : {}),
      },
    })
  }

  async function tryAutoExecute(pactId: string) {
    const pact = store.pacts.find((p) => p.id === pactId)
    if (!pact || pact.submissionMode !== 'cobo' || pact.status !== 'active') return
    if (pact.firstExecutionCompleted && pact.firstExecutionTxHash?.trim()) return
    if (autoExecuteAttempted.value && executeError.value) return
    if (executing.value) return

    await refreshGasStatus()
    if (gasStatus.value && !gasStatus.value.ready) {
      executeError.value = gasStatus.value.wrongChainHint?.message
        ?? `Agent Wallet 需要至少 ${gasStatus.value.minEth} ${gasStatus.value.nativeTokenLabel}（${gasStatus.value.networkLabel} 当前 ${gasStatus.value.ethBalance} ETH）`
      actionBanner.value = { tone: 'error', message: executeError.value }
      autoExecuteAttempted.value = true
      return
    }

    autoExecuteAttempted.value = true
    executing.value = true
    executeError.value = ''
    try {
      const result = await store.executePact(pactId)
      actionBanner.value = {
        tone: 'success',
        message: `首次 Recipe 已执行，tx：${result.txHash || '已提交'}`,
      }
      clearPollTimer()
    } catch (e: unknown) {
      executeError.value = extractApiErrorMessage(e, 'Recipe 执行失败')
      actionBanner.value = {
        tone: 'error',
        message: executeError.value,
      }
    } finally {
      executing.value = false
    }
  }

  async function handlePactAfterSync(pact: Pact | null | undefined) {
    if (!pact) return
    if (pact.status === 'active' && pact.submissionMode === 'cobo'
      && (!pact.firstExecutionCompleted || !pact.firstExecutionTxHash?.trim())) {
      clearPollTimer()
      await tryAutoExecute(pact.id)
      return
    }
    if (pact.status === 'terminated') {
      clearPollTimer()
      actionBanner.value = {
        tone: 'error',
        message: pact.submissionMessage || 'Pact 已被拒绝或终止。',
      }
      return
    }
    if (pact.status === 'awaiting-approval') {
      schedulePoll(pact.id, pollAttempt.value)
    }
  }

  function schedulePoll(pactId: string, attempt = 0) {
    if (pollAborted) return
    if (attempt >= MAX_POLL_ATTEMPTS) {
      actionBanner.value = {
        tone: 'info',
        message: '等待 App 审批超时。若已在 App 中批准，请点击「我已批准，刷新状态」。',
      }
      return
    }

    pollAttempt.value = attempt
    pollTimer = setTimeout(async () => {
      if (pollAborted) return
      try {
        const pact = await store.syncPact(pactId)
        if (pact?.status === 'active') {
          await handlePactAfterSync(pact)
          return
        }
        if (pact?.status === 'terminated') {
          await handlePactAfterSync(pact)
          return
        }
        schedulePoll(pactId, attempt + 1)
      } catch {
        schedulePoll(pactId, attempt + 1)
      }
    }, POLL_MS)
  }

  function startWaitingClock() {
    if (waitingTimer) return
    waitingSeconds.value = 0
    waitingTimer = setInterval(() => {
      waitingSeconds.value += 1
    }, 1000)
  }

  function maybeStartPolling(pact: Pact | null) {
    if (!pact || pact.status !== 'awaiting-approval') {
      clearPollTimer()
      return
    }
    pollAborted = false
    startWaitingClock()
    schedulePoll(pact.id, pollAttempt.value)
  }

  async function syncVisibleLivePacts() {
    const targets = new Set<string>()
    if (selectedId.value) targets.add(selectedId.value)

    for (const pact of store.pacts) {
      if (pact.submissionMode !== 'cobo') continue
      if (!['pending', 'active', 'awaiting-approval'].includes(pact.status)) continue
      if (!pactMatchesFilter(pact, statusFilter.value)) continue
      targets.add(pact.id)
    }

    if (!targets.size) return

    await Promise.all(
      [...targets].map((id) => store.fetchPact(id, { sync: true }).catch(() => {})),
    )
    await store.fetchPacts(pactListFetchStatus(statusFilter.value), { sync: false })
  }

  async function load(options?: { sync?: boolean }) {
    loading.value = true
    store.clearError()
    actionBanner.value = null
    try {
      const preparationTask = store.preparation
        ? Promise.resolve()
        : store.fetchPreparation().catch(() => {})

      await preparationTask
      if (options?.sync) {
        await store.syncPortfolioFromCobo(pactListFetchStatus(statusFilter.value))
      } else {
        await Promise.all([
          store.fetchStrategies(),
          store.fetchPacts(pactListFetchStatus(statusFilter.value), { sync: false }),
        ])
      }
    } finally {
      loading.value = false
    }

    const pact = selectedPact.value
    if (pact) {
      autoExecuteAttempted.value = false
      executeError.value = ''
      if (pact.status === 'awaiting-approval' || pact.status === 'pending') {
        maybeStartPolling(pact)
      }
    }

    if (options?.sync !== false) {
      void syncVisibleLivePacts().then(() => {
        const refreshed = selectedPact.value
        if (!refreshed) return
        if (refreshed.status === 'active'
          && (!refreshed.firstExecutionCompleted || !refreshed.firstExecutionTxHash?.trim())) {
          void tryAutoExecute(refreshed.id)
        } else if (refreshed.status === 'awaiting-approval' || refreshed.status === 'pending') {
          maybeStartPolling(refreshed)
        }
      })
    }
  }

  async function refreshStatus() {
    if (!selectedId.value) return
    busy.value = true
    store.clearError()
    try {
      const pact = await store.syncPact(selectedId.value)
      await store.fetchPacts(pactListFetchStatus(statusFilter.value))
      if (pact?.status === 'active') {
        actionBanner.value = {
          tone: 'success',
          message: 'Pact 已激活。',
        }
      }
      await handlePactAfterSync(pact)
    } catch (e: unknown) {
      actionBanner.value = {
        tone: 'error',
        message: extractApiErrorMessage(e, '同步状态失败'),
      }
    } finally {
      busy.value = false
    }
  }

  async function approveLocalDraft() {
    if (!selectedId.value) return
    busy.value = true
    try {
      await store.approvePact(selectedId.value)
      await store.fetchPacts()
      actionBanner.value = { tone: 'success', message: '本地 Pact 已批准。' }
    } catch (e: unknown) {
      actionBanner.value = {
        tone: 'error',
        message: extractApiErrorMessage(e, '批准失败'),
      }
    } finally {
      busy.value = false
    }
  }

  async function refreshYieldPosition(pactId?: string) {
    const id = pactId ?? selectedId.value
    if (!id) {
      yieldPosition.value = null
      return
    }
    try {
      const snapshot = await store.fetchPactPosition(id)
      yieldPosition.value = snapshot
    } catch {
      yieldPosition.value = null
    }
  }

  async function runRedeemFunds() {
    if (!selectedId.value) return
    redeeming.value = true
    redeemError.value = ''
    try {
      const result = await store.redeemPact(selectedId.value)
      await refreshYieldPosition(selectedId.value)
      actionBanner.value = {
        tone: result.amountUsdc > 0 ? 'success' : 'info',
        message: result.amountUsdc > 0
          ? `已赎回 ${result.amountUsdc} USDC 至 Agent Wallet，tx：${result.txHash || '已提交'}`
          : result.action,
      }
    } catch (e: unknown) {
      redeemError.value = extractApiErrorMessage(e, '赎回失败')
      actionBanner.value = { tone: 'error', message: redeemError.value }
    } finally {
      redeeming.value = false
    }
  }

  async function refreshGasStatus() {
    try {
      gasStatus.value = await store.fetchAgentGasStatus()
    } catch {
      gasStatus.value = null
    }
  }

  async function runFundAgentGas() {
    if (!gasStatus.value) {
      await refreshGasStatus()
    }
    const status = gasStatus.value
    if (!status) {
      actionBanner.value = { tone: 'error', message: '无法读取 Agent Wallet Gas 状态' }
      return
    }
    try {
      await fundAgentGas(status.agentAddress, status.network, status.recommendedFundEth)
      await refreshGasStatus()
      executeError.value = ''
      actionBanner.value = {
        tone: 'success',
        message: 'Gas 已充值，请点击「执行首次 Recipe」重试。',
      }
    } catch (e: unknown) {
      const message = gasFundingError.value || extractApiErrorMessage(e, 'Gas 充值失败')
      actionBanner.value = { tone: 'error', message }
    }
  }

  async function retryExecute() {
    if (!selectedId.value) return
    await refreshGasStatus()
    if (gasStatus.value && !gasStatus.value.ready) {
      executeError.value = gasStatus.value.wrongChainHint?.message
        ?? `Agent Wallet 需要至少 ${gasStatus.value.minEth} ${gasStatus.value.nativeTokenLabel}（${gasStatus.value.networkLabel} 当前 ${gasStatus.value.ethBalance} ETH）`
      actionBanner.value = { tone: 'error', message: executeError.value }
      return
    }

    autoExecuteAttempted.value = false
    executing.value = true
    executeError.value = ''
    try {
      const result = await store.executePact(selectedId.value)
      actionBanner.value = {
        tone: 'success',
        message: `首次 Recipe 已执行，tx：${result.txHash || '已提交'}`,
      }
    } catch (e: unknown) {
      executeError.value = extractApiErrorMessage(e, 'Recipe 执行失败')
      actionBanner.value = { tone: 'error', message: executeError.value }
      if (executeError.value.includes('测试 ETH')) {
        await refreshGasStatus()
      }
    } finally {
      executing.value = false
    }
  }

  async function simulateDenial() {
    if (!selectedId.value) return
    busy.value = true
    try {
      const result = await store.simulatePactDenial(selectedId.value)
      actionBanner.value = {
        tone: 'info',
        message: result.reason,
      }
    } catch (e: unknown) {
      actionBanner.value = {
        tone: 'error',
        message: extractApiErrorMessage(e, '越权模拟失败'),
      }
    } finally {
      busy.value = false
    }
  }

  async function terminateSelected() {
    if (!selectedId.value || !selectedPact.value) return
    const isWithdraw = ['pending', 'awaiting-approval'].includes(selectedPact.value.status)
      && selectedPact.value.submissionMode === 'cobo'
    const confirmed = window.confirm(
      isWithdraw
        ? '确定撤回此待审批 Pact？将拒绝 Cobo 审批请求，Agent 需重新提交。'
        : '确定终止此 Pact？本地 draft 将立即标记为已终止。',
    )
    if (!confirmed) return

    busy.value = true
    clearPollTimer()
    try {
      await store.terminatePact(selectedId.value)
      await store.fetchPacts()
      actionBanner.value = { tone: 'info', message: 'Pact 已终止。' }
    } catch (e: unknown) {
      actionBanner.value = {
        tone: 'error',
        message: extractApiErrorMessage(e, '终止失败'),
      }
    } finally {
      busy.value = false
    }
  }

  function selectPact(id: string) {
    clearPollTimer()
    autoExecuteAttempted.value = false
    executeError.value = ''
    redeemError.value = ''
    actionBanner.value = null
    selectedId.value = id
    const pact = store.pacts.find((p) => p.id === id)
    maybeStartPolling(pact ?? null)
  }

  watch(selectedPact, (pact) => {
    if (pact?.status === 'awaiting-approval' && !pollTimer && !pollAborted) {
      maybeStartPolling(pact)
    }
    if (pact?.firstExecutionCompleted && pact.firstExecutionTxHash) {
      void refreshYieldPosition(pact.id)
    } else {
      yieldPosition.value = null
    }
    if (pact?.status === 'active') {
      void refreshGasStatus()
    } else {
      gasStatus.value = null
    }
  })

  watch(statusFilter, (next, prev) => {
    if (next === prev) return
    void load()
  })

  onMounted(() => load({ sync: true }))

  onUnmounted(() => {
    clearPollTimer()
  })

  return {
    store,
    busy,
    loading,
    actionBanner,
    executeError,
    executing,
    pollAttempt,
    waitingSeconds,
    statusFilter,
    filteredPacts,
    awaitingCount,
    selectedId,
    selectedPact,
    selectedStrategy,
    setStatusFilter,
    load,
    refreshStatus,
    approveLocalDraft,
    retryExecute,
    runFundAgentGas,
    runRedeemFunds,
    simulateDenial,
    terminateSelected,
    selectPact,
    gasStatus,
    fundingGas,
    eoaConnected,
    yieldPosition,
    redeeming,
    redeemError,
  }
}
