import type { NetworkId, PrepStep } from '../../shared/types/demo'

const NETWORK_LABELS: Record<NetworkId, string> = {
  'base-sepolia': 'Base Sepolia 测试网',
  'arbitrum-sepolia': 'Arbitrum Sepolia 测试网',
}

export function useWalletPreparation() {
  const store = useDemoStore()
  const { transferUsdc, isWriting, transferError } = useUsdcTransfer()

  const prep = computed(() => store.preparation)
  const busy = ref(false)
  const depositPhase = ref<'idle' | 'signing' | 'confirming'>('idle')
  const depositAmount = ref('500')
  const pageError = ref<string | null>(null)

  const createAgentLabel = computed(() =>
    busy.value && prep.value?.steps.agent_wallet === 'in_progress'
      ? '创建中…'
      : '创建 Agent Wallet',
  )

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

  async function init() {
    pageError.value = null
    store.clearError()
    busy.value = true
    try {
      await Promise.all([store.fetchPreparation(), store.fetchSettings()])
    } catch {
      pageError.value = store.error
    } finally {
      busy.value = false
    }
  }

  async function runCreateAgent() {
    if (stepLocked('agent_wallet') || prep.value?.steps.agent_wallet === 'completed') return
    if (!coboConfigured.value) {
      pageError.value = '请先在设置页配置 Cobo API Key'
      return
    }
    pageError.value = null
    busy.value = true
    try {
      await store.createAgentWallet()
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

  const continueUrl = '/create-strategy?template=conservative-usdc'

  return {
    store,
    prep,
    busy,
    depositPhase,
    depositAmount,
    pageError,
    createAgentLabel,
    depositLabel,
    coboConfigured,
    isWriting,
    networkLabel: computed(() =>
      prep.value ? NETWORK_LABELS[prep.value.network] : NETWORK_LABELS['base-sepolia'],
    ),
    stepLocked,
    init,
    runCreateAgent,
    runDeposit,
    runReset,
    continueUrl,
  }
}
