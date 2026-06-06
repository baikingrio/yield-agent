import type {
  DemoState,
  NetworkId,
  PrepStepStatus,
  WalletPreparation,
} from '../../shared/types/demo'
import { schedulePersistDemoState } from './demo-state-persistence'

const EOA_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/

export function createInitialWalletPreparation(
  network: NetworkId = 'base-sepolia',
): WalletPreparation {
  return {
    network,
    eoa: {
      connected: false,
      address: null,
      label: '',
    },
    agentWallet: {
      created: false,
      address: '',
      coboWalletId: null,
      pairing: {
        status: 'unpaired',
        code: null,
        expiresAt: null,
      },
    },
    funding: {
      status: 'idle',
      depositedUsdc: 0,
      availableUsdc: 0,
      lastTxHash: null,
    },
    agentBootstrap: {
      mode: null,
      phase: 'idle',
      sessionId: null,
      walletStatus: null,
      tssOnline: null,
      message: null,
    },
    steps: {
      eoa: 'pending',
      agent_wallet: 'pending',
      funding: 'pending',
    },
    ready: false,
    updatedAt: new Date().toISOString(),
  }
}

function syncReady(prep: WalletPreparation): void {
  prep.ready =
    prep.steps.eoa === 'completed'
    && prep.steps.agent_wallet === 'completed'
    && prep.steps.funding === 'completed'
    && prep.funding.status === 'ready'
}

export function touchPreparation(prep: WalletPreparation, state?: DemoState): void {
  prep.updatedAt = new Date().toISOString()
  syncReady(prep)
  if (state) schedulePersistDemoState(state)
}

export function getWalletPreparation(state: DemoState): WalletPreparation {
  return state.walletPreparation
}

export function connectEoa(
  state: DemoState,
  params: { address: string; label?: string },
): WalletPreparation {
  const address = params.address.trim()
  if (!EOA_ADDRESS_RE.test(address)) {
    throw new Error('INVALID_EOA_ADDRESS')
  }

  const prep = state.walletPreparation
  prep.eoa.connected = true
  prep.eoa.address = address
  prep.eoa.label = params.label?.trim() || '已连接钱包'
  prep.steps.eoa = 'completed'
  touchPreparation(prep, state)
  return prep
}

export function disconnectEoa(state: DemoState): WalletPreparation {
  const prep = state.walletPreparation
  prep.eoa.connected = false
  prep.eoa.address = null
  prep.eoa.label = ''
  prep.steps.eoa = 'pending'
  prep.steps.agent_wallet = 'pending'
  prep.steps.funding = 'pending'
  prep.agentWallet.created = false
  prep.agentWallet.address = ''
  prep.agentWallet.coboWalletId = null
  prep.agentWallet.pairing = { status: 'unpaired', code: null, expiresAt: null }
  prep.funding.status = 'idle'
  prep.funding.depositedUsdc = 0
  prep.funding.availableUsdc = 0
  prep.funding.lastTxHash = null
  state.wallet.totalAssetsUsdc = 0
  state.wallet.address = ''
  touchPreparation(prep, state)
  return prep
}

export function markAgentWalletPreparing(
  state: DemoState,
  params: {
    coboWalletId: string
    pairing?: { status: 'unpaired' | 'pairing' | 'paired'; code: string | null; expiresAt: string | null }
  },
): WalletPreparation {
  const prep = state.walletPreparation
  prep.agentWallet.created = false
  prep.agentWallet.address = ''
  prep.agentWallet.coboWalletId = params.coboWalletId
  if (params.pairing) {
    prep.agentWallet.pairing = params.pairing
  }
  prep.steps.agent_wallet = 'in_progress'
  touchPreparation(prep, state)
  return prep
}

export function markAgentWalletCreated(
  state: DemoState,
  params: {
    address: string
    coboWalletId: string
    pairing?: { status: 'unpaired' | 'pairing' | 'paired'; code: string | null; expiresAt: string | null }
  },
): WalletPreparation {
  const prep = state.walletPreparation
  prep.agentWallet.created = true
  prep.agentWallet.address = params.address
  prep.agentWallet.coboWalletId = params.coboWalletId
  prep.agentWallet.pairing = params.pairing ?? prep.agentWallet.pairing ?? {
    status: 'unpaired',
    code: null,
    expiresAt: null,
  }
  state.wallet.address = params.address
  prep.steps.agent_wallet = prep.agentWallet.pairing.status === 'paired' ? 'completed' : 'in_progress'
  touchPreparation(prep, state)
  return prep
}

export function applyDepositToState(
  state: DemoState,
  amountUsdc: number,
  txHash: string | null,
): WalletPreparation {
  const prep = state.walletPreparation
  prep.funding.status = 'ready'
  prep.funding.depositedUsdc = amountUsdc
  prep.funding.availableUsdc = amountUsdc
  prep.funding.lastTxHash = txHash
  state.wallet.totalAssetsUsdc = amountUsdc
  state.wallet.address = prep.agentWallet.address
  prep.steps.funding = 'completed'
  touchPreparation(prep, state)
  return prep
}

export function resetWalletPreparation(state: DemoState): WalletPreparation {
  const network = state.settings.network
  state.walletPreparation = createInitialWalletPreparation(network)
  state.wallet.totalAssetsUsdc = 0
  state.wallet.address = ''
  touchPreparation(state.walletPreparation, state)
  return state.walletPreparation
}

export function stepStatusLabel(status: PrepStepStatus): string {
  switch (status) {
    case 'completed':
      return '已完成'
    case 'in_progress':
      return '进行中'
    default:
      return '待完成'
  }
}
