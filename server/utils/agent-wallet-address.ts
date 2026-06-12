import type { AppState } from '../../shared/types/app'
import { resolveEvmAddressFromSdk } from './caw-sdk-wallet'
import { isValidEvmAddress, normalizeEvmAddress } from './evm-address'
import { getPresetDemoWalletConfig } from './pacttrader-demo-wallet'

function applyAgentWalletAddress(state: AppState, address: string): string {
  const normalized = normalizeEvmAddress(address)
  const prep = state.walletPreparation
  prep.agentWallet.address = normalized
  prep.agentWallet.created = true
  state.wallet.address = normalized
  return normalized
}

export async function ensureAgentWalletEvmAddress(state: AppState): Promise<string> {
  const config = getPresetDemoWalletConfig()
  const walletId = state.walletPreparation.agentWallet.coboWalletId?.trim()
    || config.coboWalletId
  if (!walletId) {
    throw new Error('Agent Wallet UUID 未配置。请设置 PACTTRADER_DEMO_CAW_WALLET_ID 或完成 Agent Wallet 初始化。')
  }

  if (config.agentWalletAddress && config.coboWalletId === walletId) {
    if (!isValidEvmAddress(config.agentWalletAddress)) {
      throw new Error('PACTTRADER_DEMO_AGENT_WALLET_ADDRESS 不是有效的 EVM 地址')
    }
    if (state.walletPreparation.agentWallet.coboWalletId !== walletId) {
      state.walletPreparation.agentWallet.coboWalletId = walletId
    }
    return applyAgentWalletAddress(state, config.agentWalletAddress)
  }

  const prep = state.walletPreparation
  const cached = prep.agentWallet.address?.trim()
  if (isValidEvmAddress(cached) && prep.agentWallet.coboWalletId?.trim() === walletId) {
    return cached
  }

  const resolved = await resolveEvmAddressFromSdk(state, walletId)
  if (!isValidEvmAddress(resolved)) {
    throw new Error(
      '无法从 Cobo 读取 Agent Wallet 链上地址。请核对 PACTTRADER_DEMO_CAW_WALLET_ID 与 AGENT_WALLET_API_KEY 属于同一 Agent。',
    )
  }

  if (prep.agentWallet.coboWalletId !== walletId) {
    prep.agentWallet.coboWalletId = walletId
  }

  return applyAgentWalletAddress(state, resolved)
}
