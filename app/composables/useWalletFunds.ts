import { DASHBOARD_SETTINGS } from '#shared/constants/dashboard-routes'
import type { AgentGasStatus, WithdrawInfo } from '#shared/types/app'

export function useWalletFunds() {
  const store = useAppStore()
  const { transferUsdc, isWriting, transferError } = useUsdcTransfer()
  const { fundAgentGas, funding: fundingGas, fundingError: gasFundingError, eoaConnected } = useAgentGasFunding()

  const topUpPhase = ref<'idle' | 'signing' | 'confirming'>('idle')
  const withdrawPhase = ref<'idle' | 'confirming'>('idle')
  const pageError = ref<string | null>(null)
  const withdrawInfo = ref<WithdrawInfo | null>(null)
  const withdrawInfoLoading = ref(false)
  const gasStatus = ref<AgentGasStatus | null>(null)
  const gasStatusLoading = ref(false)
  const topUpAmount = ref('100')
  const withdrawAmount = ref('100')
  const busy = ref(false)

  const prep = computed(() => store.preparation)
  const coboConfigured = computed(() => store.settings?.apiKeyConfigured ?? false)
  const fundsUnlocked = computed(
    () => prep.value?.steps.agent_wallet === 'completed'
      && prep.value?.agentWallet.created
      && prep.value?.ready === true,
  )

  const topUpLabel = computed(() => {
    const amt = topUpAmount.value || '100'
    if (topUpPhase.value === 'signing') return '请在钱包中确认转账…'
    if (topUpPhase.value === 'confirming') return '确认到账中…'
    return `从 EOA 转入 ${amt} USDC`
  })

  const withdrawLabel = computed(() => {
    const amt = withdrawAmount.value || '100'
    if (withdrawPhase.value === 'confirming') return '提取处理中…'
    return `提取 ${amt} USDC 到 EOA`
  })

  const gasFundLabel = computed(() => {
    if (fundingGas.value) return '充值中…'
    const eth = gasStatus.value?.recommendedFundEth ?? 0.001
    const label = gasStatus.value?.nativeTokenLabel ?? 'ETH'
    return `从 EOA 充值 ${eth} ${label}`
  })

  async function loadGasStatus() {
    if (!fundsUnlocked.value) return
    gasStatusLoading.value = true
    try {
      gasStatus.value = await store.fetchAgentGasStatus()
    } catch {
      gasStatus.value = null
    } finally {
      gasStatusLoading.value = false
    }
  }

  async function loadFundsPanel() {
    await Promise.all([loadWithdrawInfo(), loadGasStatus()])
  }

  async function loadWithdrawInfo(amountUsdc?: number) {
    if (!fundsUnlocked.value) return
    withdrawInfoLoading.value = true
    pageError.value = null
    try {
      withdrawInfo.value = await store.fetchWithdrawInfo(amountUsdc)
    } catch (err) {
      pageError.value = err instanceof Error ? err.message : '无法读取提取信息'
      withdrawInfo.value = null
    } finally {
      withdrawInfoLoading.value = false
    }
  }

  async function topUp() {
    if (!fundsUnlocked.value) return
    const amount = Number(topUpAmount.value)
    if (Number.isNaN(amount) || amount < 10 || amount > 10_000) {
      pageError.value = '请输入 10–10,000 USDC'
      return
    }
    if (!coboConfigured.value) {
      pageError.value = '请先在设置页配置 Cobo API Key'
      return
    }

    pageError.value = null
    topUpPhase.value = 'signing'
    busy.value = true

    try {
      const info = await store.fetchDepositInfo(amount)
      const txHash = await transferUsdc(info)
      topUpPhase.value = 'confirming'
      await store.depositToAgentWallet(amount, txHash)
      await loadWithdrawInfo()
    } catch (err) {
      pageError.value = transferError.value
        || (err instanceof Error ? err.message : '补充资金失败')
    } finally {
      topUpPhase.value = 'idle'
      busy.value = false
    }
  }

  async function withdraw() {
    if (!fundsUnlocked.value) return
    const amount = Number(withdrawAmount.value)
    if (Number.isNaN(amount) || amount < 10 || amount > 10_000) {
      pageError.value = '请输入 10–10,000 USDC'
      return
    }
    if (!coboConfigured.value) {
      pageError.value = '请先在设置页配置 Cobo API Key'
      return
    }
    if (withdrawInfo.value && amount > withdrawInfo.value.maxWithdrawUsdc) {
      pageError.value = `可提余额不足（当前 ${withdrawInfo.value.liquidUsdc.toLocaleString('zh-CN')} USDC）`
      return
    }

    pageError.value = null
    withdrawPhase.value = 'confirming'
    busy.value = true

    try {
      await store.withdrawFromAgentWallet(amount)
      await loadWithdrawInfo()
    } catch (err) {
      pageError.value = err instanceof Error ? err.message : '提取失败，请重试'
    } finally {
      withdrawPhase.value = 'idle'
      busy.value = false
    }
  }

  async function fundGas() {
    if (!fundsUnlocked.value) return
    if (!gasStatus.value) {
      await loadGasStatus()
    }
    const status = gasStatus.value
    if (!status) {
      pageError.value = '无法读取 Agent Wallet Gas 状态'
      return
    }

    pageError.value = null
    try {
      await fundAgentGas(status.agentAddress, status.network, status.recommendedFundEth)
      await loadGasStatus()
    } catch {
      pageError.value = gasFundingError.value || 'Gas 充值失败'
    }
  }

  return {
    prep,
    coboConfigured,
    fundsUnlocked,
    topUpAmount,
    withdrawAmount,
    topUpPhase,
    withdrawPhase,
    topUpLabel,
    withdrawLabel,
    gasFundLabel,
    pageError,
    withdrawInfo,
    withdrawInfoLoading,
    gasStatus,
    gasStatusLoading,
    fundingGas,
    eoaConnected,
    busy,
    isWriting,
    loadFundsPanel,
    loadWithdrawInfo,
    loadGasStatus,
    topUp,
    withdraw,
    fundGas,
    settingsPath: DASHBOARD_SETTINGS,
  }
}
