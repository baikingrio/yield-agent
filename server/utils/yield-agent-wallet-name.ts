import type { AppState } from '../../shared/types/app'

export const YIELD_AGENT_WALLET_PREFIX = 'YieldAgent'

export function yieldAgentWalletName(state: AppState): string {
  const eoa = state.walletPreparation.eoa.address?.trim()
  if (!eoa || !/^0x[a-fA-F0-9]{40}$/.test(eoa)) {
    return `${YIELD_AGENT_WALLET_PREFIX}-session`
  }
  return `${YIELD_AGENT_WALLET_PREFIX}-${eoa.slice(2, 10).toLowerCase()}`
}

export function isYieldAgentWalletName(name: string | undefined | null): boolean {
  return Boolean(name?.startsWith(`${YIELD_AGENT_WALLET_PREFIX}-`))
}
