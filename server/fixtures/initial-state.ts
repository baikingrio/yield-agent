import type { DemoState } from '../../shared/types/demo'
import { createInitialWalletPreparation } from '../utils/wallet-preparation'

export function createInitialState(): DemoState {
  return {
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
}
