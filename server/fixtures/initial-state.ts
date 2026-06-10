import type { AppState } from '../../shared/types/app'
import { applyPresetDemoWallet } from '../utils/pacttrader-demo-wallet'
import { createInitialWalletPreparation } from '../utils/wallet-preparation'

export function createInitialState(): AppState {
  const state: AppState = {
    wallet: {
      address: '',
      totalAssetsUsdc: 0,
      currentApy: 0,
      cumulativeYieldUsdc: 0,
    },
    walletPreparation: createInitialWalletPreparation('base-sepolia'),
    strategies: [],
    pacts: [],
    logs: [],
    yieldSeries7d: [],
    yieldSeries30d: [],
    settings: {
      network: 'base-sepolia',
      apiKeyConfigured: false,
      defaultAgentFee: 15,
      userSplit: 85,
    },
  }

  applyPresetDemoWallet(state)
  return state
}
