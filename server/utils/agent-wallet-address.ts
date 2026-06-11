import type { AppState } from '../../shared/types/app'
import { resolveEvmAddressFromSdk } from './caw-sdk-wallet'
import { getPresetDemoWalletConfig } from './pacttrader-demo-wallet'

export async function ensureAgentWalletEvmAddress(state: AppState): Promise<string> {
  const walletId = state.walletPreparation.agentWallet.coboWalletId?.trim()
    || getPresetDemoWalletConfig().coboWalletId
  if (!walletId) {
    throw new Error('Agent Wallet UUID 未配置。请设置 PACTTRADER_DEMO_CAW_WALLET_ID 或完成 Agent Wallet 初始化。')
  }

  const resolved = await resolveEvmAddressFromSdk(state, walletId)
  if (!resolved?.trim()) {
    throw new Error(
      '无法从 Cobo 读取 Agent Wallet 链上地址。请核对 PACTTRADER_DEMO_CAW_WALLET_ID 与 AGENT_WALLET_API_KEY 属于同一 Agent。',
    )
  }

  if (state.walletPreparation.agentWallet.coboWalletId !== walletId) {
    state.walletPreparation.agentWallet.coboWalletId = walletId
    state.walletPreparation.agentWallet.created = true
  }

  const current = state.walletPreparation.agentWallet.address?.trim()
  if (current?.toLowerCase() !== resolved.toLowerCase()) {
    state.walletPreparation.agentWallet.address = resolved
    state.wallet.address = resolved
  }

  return resolved
}
