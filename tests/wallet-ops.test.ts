import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AppState } from '../shared/types/app'

const verifyUsdcDeposit = vi.fn()
const fetchUsdcBalanceFromCobo = vi.fn()
const syncWalletSummaryFromCobo = vi.fn()
const applyDepositToState = vi.fn()
const touchPreparation = vi.fn()
const readYieldSuppliedAmount = vi.fn()
const assertAgentWalletHasGas = vi.fn()
const getAgentNativeEthBalance = vi.fn()
const submitTransferAndWait = vi.fn()
const createCoboTransactionsApi = vi.fn()
const createCoboTransactionRecordsApi = vi.fn()
const isCoboConfigured = vi.fn(() => true)

vi.mock('../server/utils/deposit-verify', () => ({
  verifyUsdcDeposit,
}))

vi.mock('../server/utils/cobo-preparation', () => ({
  fetchUsdcBalanceFromCobo,
  syncWalletSummaryFromCobo,
}))

vi.mock('../server/utils/wallet-preparation', () => ({
  applyDepositToState,
  touchPreparation,
}))

vi.mock('../server/utils/yield-position', () => ({
  readYieldSuppliedAmount,
}))

vi.mock('../server/utils/agent-gas', () => ({
  assertAgentWalletHasGas,
  getAgentNativeEthBalance,
  resolveContractCallSponsor: () => false,
}))

vi.mock('../server/utils/cobo-transaction', () => ({
  submitTransferAndWait,
}))

vi.mock('../server/utils/cobo-client', () => ({
  createCoboTransactionsApi,
  createCoboTransactionRecordsApi,
  extractCoboErrorMessage: (err: unknown) => (err instanceof Error ? err.message : 'Cobo API 请求失败'),
  isCoboConfigured,
  withCoboRetry: (operation: () => Promise<unknown>) => operation(),
}))

function createState(overrides: Partial<AppState> = {}): AppState {
  const base: AppState = {
    wallet: { address: '0xAgent', totalAssetsUsdc: 500, currentApy: 0, cumulativeYieldUsdc: 0 },
    walletPreparation: {
      network: 'base-sepolia',
      eoa: { connected: true, address: '0xEoa', label: 'Demo EOA' },
      agentWallet: {
        created: true,
        address: '0xAgent',
        coboWalletId: 'wallet-1',
        pairing: { status: 'paired', code: null, expiresAt: null },
      },
      funding: { status: 'ready', depositedUsdc: 500, availableUsdc: 500, lastTxHash: '0xabc' },
      steps: { eoa: 'completed', agent_wallet: 'completed', funding: 'completed' },
      ready: true,
      updatedAt: new Date(0).toISOString(),
    },
    strategies: [],
    pacts: [],
    logs: [],
    yieldSeries7d: [],
    yieldSeries30d: [],
    settings: { network: 'base-sepolia', apiKeyConfigured: true, coboApiKey: 'caw-key', defaultAgentFee: 10, userSplit: 90 },
  }

  return {
    ...base,
    ...overrides,
    settings: { ...base.settings, ...overrides.settings },
    walletPreparation: { ...base.walletPreparation, ...overrides.walletPreparation },
  }
}

afterEach(() => {
  vi.clearAllMocks()
  isCoboConfigured.mockReturnValue(true)
})

describe('topUpUsdcDeposit', () => {
  it('updates balance when funding is already ready without downgrading step', async () => {
    const state = createState()
    verifyUsdcDeposit.mockResolvedValue(undefined)
    fetchUsdcBalanceFromCobo.mockResolvedValue(620)
    applyDepositToState.mockImplementation((s, amount) => {
      s.walletPreparation.funding.depositedUsdc = amount
      return s.walletPreparation
    })

    const { topUpUsdcDeposit } = await import('../server/utils/wallet-ops')
    await topUpUsdcDeposit(state, 120, '0x' + 'a'.repeat(64))

    expect(verifyUsdcDeposit).toHaveBeenCalledOnce()
    expect(applyDepositToState).toHaveBeenCalledWith(state, 620, '0x' + 'a'.repeat(64))
    expect(touchPreparation).not.toHaveBeenCalled()
    expect(state.walletPreparation.steps.funding).toBe('completed')
    expect(state.walletPreparation.funding.status).toBe('ready')
  })

  it('sets funding in progress for first deposit and reverts on failure', async () => {
    const state = createState({
      walletPreparation: {
        network: 'base-sepolia',
        eoa: { connected: true, address: '0xEoa', label: 'Demo EOA' },
        agentWallet: {
          created: true,
          address: '0xAgent',
          coboWalletId: 'wallet-1',
          pairing: { status: 'paired', code: null, expiresAt: null },
        },
        funding: { status: 'idle', depositedUsdc: 0, availableUsdc: 0, lastTxHash: null },
        steps: { eoa: 'completed', agent_wallet: 'completed', funding: 'pending' },
        ready: false,
        updatedAt: new Date(0).toISOString(),
      },
    })

    verifyUsdcDeposit.mockRejectedValue(new Error('TX_FAILED'))

    const { topUpUsdcDeposit } = await import('../server/utils/wallet-ops')
    await expect(topUpUsdcDeposit(state, 100, '0x' + 'b'.repeat(64))).rejects.toThrow('链上交易失败')

    expect(state.walletPreparation.steps.funding).toBe('pending')
    expect(state.walletPreparation.funding.status).toBe('idle')
    expect(touchPreparation).toHaveBeenCalled()
  })

  it('keeps funding ready when top-up fails after initial deposit', async () => {
    const state = createState()
    verifyUsdcDeposit.mockRejectedValue(new Error('TRANSFER_NOT_FOUND'))

    const { topUpUsdcDeposit } = await import('../server/utils/wallet-ops')
    await expect(topUpUsdcDeposit(state, 50, '0x' + 'c'.repeat(64))).rejects.toThrow('未找到匹配')

    expect(state.walletPreparation.steps.funding).toBe('completed')
    expect(state.walletPreparation.funding.status).toBe('ready')
  })
})

describe('getWithdrawInfo', () => {
  it('returns liquid and supplied balances', async () => {
    fetchUsdcBalanceFromCobo.mockResolvedValue(300)
    readYieldSuppliedAmount.mockResolvedValue(150_000_000n)

    const state = createState()
    const { getWithdrawInfo } = await import('../server/utils/wallet-ops')
    const info = await getWithdrawInfo(state)

    expect(info.liquidUsdc).toBe(300)
    expect(info.suppliedUsdc).toBe(150)
    expect(info.maxWithdrawUsdc).toBe(300)
    expect(info.eoaAddress).toBe('0xEoa')
  })
})

describe('withdrawUsdcToEoa', () => {
  it('rejects amount above liquid balance', async () => {
    fetchUsdcBalanceFromCobo.mockResolvedValue(50)
    readYieldSuppliedAmount.mockResolvedValue(0n)

    const state = createState()
    const { withdrawUsdcToEoa } = await import('../server/utils/wallet-ops')

    await expect(withdrawUsdcToEoa(state, 100)).rejects.toThrow('可提余额不足')
    expect(submitTransferAndWait).not.toHaveBeenCalled()
  })

  it('rejects when EOA is missing', async () => {
    const state = createState({
      walletPreparation: {
        ...createState().walletPreparation,
        eoa: { connected: false, address: null, label: null },
      },
    })

    const { withdrawUsdcToEoa } = await import('../server/utils/wallet-ops')
    await expect(withdrawUsdcToEoa(state, 50)).rejects.toThrow('EOA_NOT_CONNECTED')
  })

  it('rejects when Cobo API key is not configured', async () => {
    isCoboConfigured.mockReturnValue(false)
    const state = createState()

    const { withdrawUsdcToEoa } = await import('../server/utils/wallet-ops')
    await expect(withdrawUsdcToEoa(state, 50)).rejects.toThrow('Cobo API Key')
  })

  it('submits transfer and syncs balance on success', async () => {
    fetchUsdcBalanceFromCobo
      .mockResolvedValueOnce(500)
      .mockResolvedValueOnce(400)
    readYieldSuppliedAmount.mockResolvedValue(0n)
    getAgentNativeEthBalance.mockResolvedValue(1_000_000_000_000_000n)
    createCoboTransactionsApi.mockReturnValue({})
    createCoboTransactionRecordsApi.mockReturnValue({})
    submitTransferAndWait.mockResolvedValue({
      transaction_hash: '0xwithdraw',
      status_display: 'Success',
    })

    const state = createState()
    const { withdrawUsdcToEoa } = await import('../server/utils/wallet-ops')
    const result = await withdrawUsdcToEoa(state, 100)

    expect(submitTransferAndWait).toHaveBeenCalledOnce()
    expect(syncWalletSummaryFromCobo).toHaveBeenCalledWith(state)
    expect(result.txHash).toBe('0xwithdraw')
    expect(result.amountUsdc).toBe(100)
    expect(result.liquidUsdc).toBe(400)
    expect(state.logs[0]?.type).toBe('withdraw')
  })
})
