import type { AppState } from '../types/app'

export type NetworkId = 'base-sepolia'

export const DEFAULT_NETWORK: NetworkId = 'base-sepolia'

export const NETWORK_LABELS: Record<NetworkId, string> = {
  'base-sepolia': 'Base Sepolia',
}

export function normalizeNetwork(_value: unknown): NetworkId {
  return DEFAULT_NETWORK
}

export function normalizeAppStateNetworks(state: AppState): { state: AppState; changed: boolean } {
  let changed = false

  if (state.settings.network !== DEFAULT_NETWORK) {
    state.settings.network = DEFAULT_NETWORK
    changed = true
  }
  if (state.walletPreparation.network !== DEFAULT_NETWORK) {
    state.walletPreparation.network = DEFAULT_NETWORK
    changed = true
  }
  for (const strategy of state.strategies) {
    if (strategy.network !== DEFAULT_NETWORK) {
      strategy.network = DEFAULT_NETWORK
      changed = true
    }
  }

  return { state, changed }
}
