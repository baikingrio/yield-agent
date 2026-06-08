import { DASHBOARD_CREATE_STRATEGY } from '#shared/constants/dashboard-routes'
import { NETWORK_LABELS } from '#shared/types/app'
import type { AgentBootstrapPhase, NetworkId, PrepStep } from '#shared/types/app'

const BOOTSTRAP_PHASE_LABELS: Record<AgentBootstrapPhase, string> = {
  idle: '待开始',
  tss_check: '检查 TSS Node',
  bootstrapping: 'Vault 初始化中',
  active: '钱包已激活',
  pairing: '等待 CAW App 配对',
  paired: '配对完成',
  failed: '初始化失败',
}

const MAX_AGENT_POLL_ATTEMPTS = 24
const AGENT_POLL_INTERVAL_MS = 5000

export function useWalletPreparation() {
  const store = useAppStore()
  const { transferUsdc, isWriting, transferError } = useUsdcTransfer()

  const prep = computed(() => store.preparation)
  const bootstrap = computed(() => store.agentBootstrap ?? prep.value?.agentBootstrap ?? null)
  const busy = ref(false)
  const agentPolling = ref(false)
  const depositPhase = ref<'idle' | 'signing' | 'confirming'>('idle')
  const depositAmount = ref('500')
  const pageError = ref<string | null>(null)

  const bootstrapPhaseLabel = computed(() => {
    const phase = bootstrap.value?.phase ?? 'idle'
    return BOOTSTRAP_PHASE_LABELS[phase] ?? phase
  })

  const bootstrapMessage = computed(() => bootstrap.value?.message ?? null)

  const createAgentLabel = computed(() => {
    if (busy.value || agentPolling.value) return '初始化中…'
    if (prep.value?.steps.agent_wallet === 'in_progress') return '继续初始化'
    if (prep.value?.agentWallet.created) return '重新生成配对码'
    return '创建 Agent Wallet'
  })

  const depositLabel = computed(() => {
    const amt = depositAmount.value || '500'
    if (depositPhase.value === 'signing') return '请在钱包中确认转账…'
    if (depositPhase.value === 'confirming') return '确认到账中…'
    return `转入 ${amt} USDC`
  })

  const coboConfigured = computed(
    () => store.settings?.apiKeyConfigured ?? false,
  )

  function stepLocked(step: PrepStep): boolean {
    const p = prep.value
    if (!p) return true
    if (step === 'eoa') return false
    if (step === 'agent_wallet') return p.steps.eoa !== 'completed'
    if (step === 'funding') return p.steps.agent_wallet !== 'completed'
    return true
  }

  let pollTimer: ReturnType<typeof setTimeout> | null = null

  function stopAgentPolling() {
    if (pollTimer) {
      clearTimeout(pollTimer)
      pollTimer = null
    }
    agentPolling.value = false
  }

  async function pollAgentUntilDone(attempt = 0): Promise<void> {
    if (attempt >= MAX_AGENT_POLL_ATTEMPTS) {
      stopAgentPolling()
      pageError.value = '初始化耗时较长，请确认 TSS Node 在线后点击「继续初始化」'
      return
    }

    try {
      const response = await store.pollAgentWalletStatus()
      if (response.done && prep.value?.agentWallet.pairing?.status === 'paired') {
        stopAgentPolling()
        void Promise.all([store.fetchWallet(), store.fetchSettings(), store.fetchCawReadiness()])
        return
      }
    } catch {
      pageError.value = store.error
      stopAgentPolling()
      return
    }

    agentPolling.value = true
    pollTimer = setTimeout(() => {
      void pollAgentUntilDone(attempt + 1)
    }, AGENT_POLL_INTERVAL_MS)
  }

  async function init() {
    pageError.value = null
    store.clearError()
    busy.value = true
    try {
      await Promise.all([store.fetchPreparation(), store.fetchSettings()])
      const needsBootstrapPoll = prep.value?.steps.agent_wallet === 'in_progress'
      const needsPairingPoll = Boolean(
        prep.value?.agentWallet.address
        && prep.value?.agentWallet.pairing?.status !== 'paired',
      )
      if (needsBootstrapPoll || needsPairingPoll) {
        void pollAgentUntilDone()
      }
    } catch {
      pageError.value = store.error
    } finally {
      busy.value = false
    }
  }

  async function runCreateAgent() {
    if (stepLocked('agent_wallet')) return
    if (prep.value?.agentWallet.pairing?.status === 'paired') return
    pageError.value = null
    stopAgentPolling()
    busy.value = true
    try {
      await store.createAgentWallet()
      if (prep.value?.steps.agent_wallet !== 'completed') {
        await pollAgentUntilDone()
      }
    } catch {
      pageError.value = store.error
    } finally {
      busy.value = false
    }
  }

  async function runImportAgent() {
    if (stepLocked('agent_wallet')) return
    pageError.value = null
    stopAgentPolling()
    busy.value = true
    try {
      await store.importAgentWalletFromCli()
    } catch {
      pageError.value = store.error
    } finally {
      busy.value = false
    }
  }

  async function runDeposit() {
    if (stepLocked('funding') || prep.value?.funding.status === 'ready') return
    const amount = Number(depositAmount.value)
    if (Number.isNaN(amount) || amount < 10 || amount > 10_000) {
      pageError.value = '请输入 10–10,000 USDC'
      return
    }
    if (!coboConfigured.value) {
      pageError.value = '请先在设置页配置 Cobo API Key'
      return
    }

    pageError.value = null
    depositPhase.value = 'signing'
    busy.value = true

    try {
      const info = await store.fetchDepositInfo(amount)
      const txHash = await transferUsdc(info)
      depositPhase.value = 'confirming'
      await store.depositToAgentWallet(amount, txHash)
    } catch {
      pageError.value = transferError.value || store.error
    } finally {
      depositPhase.value = 'idle'
      busy.value = false
    }
  }

  async function runReset() {
    stopAgentPolling()
    pageError.value = null
    busy.value = true
    try {
      await store.resetPreparation()
      depositAmount.value = '500'
    } catch {
      pageError.value = store.error
    } finally {
      busy.value = false
    }
  }

  onBeforeUnmount(() => {
    stopAgentPolling()
  })

  const continueUrl = `${DASHBOARD_CREATE_STRATEGY}?template=conservative-usdc`

  return {
    store,
    prep,
    bootstrap,
    busy,
    agentPolling,
    depositPhase,
    depositAmount,
    pageError,
    createAgentLabel,
    depositLabel,
    bootstrapPhaseLabel,
    bootstrapMessage,
    coboConfigured,
    isWriting,
    networkLabel: computed(() =>
      prep.value ? NETWORK_LABELS[prep.value.network] : NETWORK_LABELS['base-sepolia'],
    ),
    stepLocked,
    init,
    runCreateAgent,
    runImportAgent,
    runDeposit,
    runReset,
    continueUrl,
  }
}
