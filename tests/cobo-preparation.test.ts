import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AppState, WalletPreparation } from '../shared/types/app'

const startAgentBootstrap = vi.fn()
const pollAgentBootstrap = vi.fn()
const regenerateAgentPairing = vi.fn()
const syncPreparationFromCawCli = vi.fn()
const listBalances = vi.hoisted(() => vi.fn())
const createCoboBalanceApi = vi.hoisted(() => vi.fn(() => ({ listBalances })))

vi.mock('../server/utils/cobo-client', () => ({
  createCoboBalanceApi,
  extractCoboErrorMessage: vi.fn(),
  withCoboRetry: (operation: () => Promise<unknown>) => operation(),
}))

vi.mock('../server/utils/caw-wallet-bootstrap', () => ({
  startAgentBootstrap,
  pollAgentBootstrap,
  regenerateAgentPairing,
  syncPreparationFromCawCli,
}))

function createState(overrides: Partial<AppState> = {}): AppState {
  const base: AppState = {
    wallet: { address: '', totalAssetsUsdc: 0, currentApy: 0, cumulativeYieldUsdc: 0 },
    walletPreparation: {
      network: 'base-sepolia',
      eoa: { connected: true, address: '0xEoa', label: 'Demo EOA' },
      agentWallet: { created: false, address: '', coboWalletId: null },
      funding: { status: 'idle', depositedUsdc: 0, availableUsdc: 0, lastTxHash: null },
      steps: { eoa: 'completed', agent_wallet: 'pending', funding: 'pending' },
      ready: false,
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

function prepResponse(prep: WalletPreparation) {
  return {
    preparation: prep,
    bootstrap: prep.agentBootstrap ?? {
      mode: 'cli-onboard' as const,
      phase: 'bootstrapping' as const,
      sessionId: 'sess-1',
      walletStatus: 'preparing',
      tssOnline: true,
      message: 'bootstrapping',
    },
    done: prep.steps.agent_wallet === 'completed',
  }
}

afterEach(() => {
  vi.clearAllMocks()
  createCoboBalanceApi.mockImplementation(() => ({ listBalances }))
})

describe('createCoboAgentWallet bootstrap orchestration', () => {
  it('starts bootstrap for a fresh preparation', async () => {
    const state = createState()
    const expectedPrep = {
      ...state.walletPreparation,
      steps: { ...state.walletPreparation.steps, agent_wallet: 'in_progress' as const },
    }
    startAgentBootstrap.mockResolvedValue(prepResponse(expectedPrep))

    const { createCoboAgentWallet } = await import('../server/utils/cobo-preparation')
    const prep = await createCoboAgentWallet(state)

    expect(startAgentBootstrap).toHaveBeenCalledOnce()
    expect(pollAgentBootstrap).not.toHaveBeenCalled()
    expect(prep.steps.agent_wallet).toBe('in_progress')
  })

  it('polls bootstrap when preparation is already in progress', async () => {
    const state = createState({
      walletPreparation: {
        network: 'base-sepolia',
        eoa: { connected: true, address: '0xEoa', label: 'Demo EOA' },
        agentWallet: { created: false, address: '', coboWalletId: 'wallet-pending' },
        funding: { status: 'idle', depositedUsdc: 0, availableUsdc: 0, lastTxHash: null },
        steps: { eoa: 'completed', agent_wallet: 'in_progress', funding: 'pending' },
        ready: false,
        updatedAt: new Date(0).toISOString(),
      },
    })
    pollAgentBootstrap.mockResolvedValue(prepResponse(state.walletPreparation))

    const { createCoboAgentWallet } = await import('../server/utils/cobo-preparation')
    await createCoboAgentWallet(state)

    expect(pollAgentBootstrap).toHaveBeenCalledOnce()
    expect(startAgentBootstrap).not.toHaveBeenCalled()
  })

  it('regenerates pairing for an existing active wallet', async () => {
    const state = createState({
      walletPreparation: {
        network: 'base-sepolia',
        eoa: { connected: true, address: '0xEoa', label: 'Demo EOA' },
        agentWallet: {
          created: true,
          address: '0xExistingAgent',
          coboWalletId: 'wallet-existing',
          pairing: { status: 'unpaired', code: null, expiresAt: null },
        },
        funding: { status: 'idle', depositedUsdc: 0, availableUsdc: 0, lastTxHash: null },
        steps: { eoa: 'completed', agent_wallet: 'completed', funding: 'pending' },
        ready: false,
        updatedAt: new Date(0).toISOString(),
      },
    })
    regenerateAgentPairing.mockResolvedValue({
      ...state.walletPreparation,
      agentWallet: {
        ...state.walletPreparation.agentWallet,
        pairing: { status: 'pairing', code: '12345678', expiresAt: '2026-06-06T12:00:00Z' },
      },
    })

    const { createCoboAgentWallet } = await import('../server/utils/cobo-preparation')
    const prep = await createCoboAgentWallet(state)

    expect(regenerateAgentPairing).toHaveBeenCalledOnce()
    expect(prep.agentWallet.pairing?.code).toBe('12345678')
  })
})

describe('syncFundingFromExistingBalance', () => {
  it('completes funding step when agent wallet already holds USDC', async () => {
    listBalances.mockResolvedValue({
      data: { result: [{ token_id: 'TBASE_USDC', amount: '120' }] },
    })

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

    const { syncFundingFromExistingBalance } = await import('../server/utils/cobo-preparation')
    const prep = await syncFundingFromExistingBalance(state)

    expect(prep.funding.status).toBe('ready')
    expect(prep.funding.availableUsdc).toBe(120)
    expect(prep.steps.funding).toBe('completed')
    expect(prep.funding.lastTxHash).toBeNull()
  })
})

describe('syncWalletSummaryFromCobo', () => {
  it('keeps the wallet summary available when Cobo API key is not configured', async () => {
    createCoboBalanceApi.mockImplementation(() => {
      throw new Error('COBO_NOT_CONFIGURED')
    })

    const state = createState({
      walletPreparation: {
        network: 'base-sepolia',
        eoa: { connected: true, address: '0xEoa', label: 'Demo EOA' },
        agentWallet: {
          created: true,
          address: '0x0000000000000000000000000000000000000000',
          coboWalletId: 'wallet-1',
          pairing: { status: 'paired', code: null, expiresAt: null },
        },
        funding: { status: 'ready', depositedUsdc: 10, availableUsdc: 10, lastTxHash: null },
        steps: { eoa: 'completed', agent_wallet: 'completed', funding: 'completed' },
        ready: true,
        updatedAt: new Date(0).toISOString(),
      },
    })

    const { syncWalletSummaryFromCobo } = await import('../server/utils/cobo-preparation')
    await expect(syncWalletSummaryFromCobo(state)).resolves.toBeUndefined()

    expect(state.wallet.address).toBe('0x0000000000000000000000000000000000000000')
    expect(state.wallet.totalAssetsUsdc).toBe(0)
    expect(state.walletPreparation.funding.availableUsdc).toBe(0)
  })
})

describe('importCoboAgentWalletFromCli', () => {
  it('delegates to syncPreparationFromCawCli', async () => {
    const state = createState()
    syncPreparationFromCawCli.mockResolvedValue({
      ...state.walletPreparation,
      agentWallet: {
        created: true,
        address: '0xImported',
        coboWalletId: 'wallet-imported',
      },
      steps: { eoa: 'completed', agent_wallet: 'completed', funding: 'pending' },
    })

    const { importCoboAgentWalletFromCli } = await import('../server/utils/cobo-preparation')
    const prep = await importCoboAgentWalletFromCli(state)

    expect(syncPreparationFromCawCli).toHaveBeenCalledWith(state)
    expect(prep.agentWallet.address).toBe('0xImported')
  })
})
