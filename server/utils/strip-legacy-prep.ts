import type { AppState, WalletPreparation } from '../../shared/types/app'
import { loadPersistedSession } from './app-state-persistence'
import { createInitialWalletPreparation } from './wallet-preparation'

const EOA_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/
const LEGACY_EOA_ADDRESSES = new Set(['0xeoa', '0xdemo'])
const LEGACY_AGENT_ADDRESSES = new Set(['0xagent'])

export function isLegacyPrepFixture(prep: WalletPreparation): boolean {
  const eoaAddr = prep.eoa.address?.toLowerCase()
  if (prep.eoa.connected && eoaAddr) {
    if (!EOA_ADDRESS_RE.test(prep.eoa.address!)) return true
    if (LEGACY_EOA_ADDRESSES.has(eoaAddr)) return true
  }
  if (prep.eoa.label.trim().toLowerCase() === 'demo eoa') return true

  const agentAddr = prep.agentWallet.address?.toLowerCase()
  if (agentAddr && LEGACY_AGENT_ADDRESSES.has(agentAddr)) return true

  return false
}

export function stripLegacyPrepFixtures(state: AppState): {
  state: AppState
  changed: boolean
  source: 'none' | 'legacy-json' | 'reset'
} {
  if (!isLegacyPrepFixture(state.walletPreparation)) {
    return { state, changed: false, source: 'none' }
  }

  const legacy = loadPersistedSession()
  if (legacy && !isLegacyPrepFixture(legacy.walletPreparation)) {
    return {
      state: {
        ...state,
        walletPreparation: legacy.walletPreparation,
        settings: { ...state.settings, ...legacy.settings },
        wallet: { ...state.wallet, ...legacy.wallet },
      },
      changed: true,
      source: 'legacy-json',
    }
  }

  return {
    state: {
      ...state,
      walletPreparation: createInitialWalletPreparation(state.settings.network),
      wallet: {
        address: '',
        totalAssetsUsdc: 0,
        currentApy: 0,
        cumulativeYieldUsdc: 0,
      },
    },
    changed: true,
    source: 'reset',
  }
}
