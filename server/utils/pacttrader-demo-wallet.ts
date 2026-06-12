import type { AppState } from '../../shared/types/app'
import { normalizeNetwork } from '../../shared/constants/network'
import { ensureAgentWalletEvmAddress } from './agent-wallet-address'
import { syncFundingFromExistingBalance } from './cobo-preparation'
import { touchPreparation } from './wallet-preparation'

export interface PresetDemoWalletConfig {
  enabled: boolean
  /** Required when preset mode is enabled — Cobo Agent Wallet UUID */
  coboWalletId: string | null
  /** Optional pinned Agent Wallet EVM address (from Hermes `caw wallet get`) */
  agentWalletAddress: string | null
  /** Optional display EOA; does not affect on-chain execution */
  eoaAddress: string | null
}

type EnvLike = Record<string, string | undefined>

export function isPresetDemoEnabled(env: EnvLike = process.env): boolean {
  return env.PACTTRADER_DEMO_MODE === 'preset'
    || Boolean(env.PACTTRADER_DEMO_CAW_WALLET_ID?.trim())
}

export function getPresetDemoWalletConfig(env: EnvLike = process.env): PresetDemoWalletConfig {
  const coboWalletId = env.PACTTRADER_DEMO_CAW_WALLET_ID?.trim() || null
  return {
    enabled: isPresetDemoEnabled(env),
    coboWalletId,
    agentWalletAddress: env.PACTTRADER_DEMO_AGENT_WALLET_ADDRESS?.trim() || null,
    eoaAddress: env.PACTTRADER_DEMO_EOA_ADDRESS?.trim() || null,
  }
}

/** Apply demo flags and wallet UUID only — no placeholder addresses or balances. */
export function applyPresetDemoWallet(
  state: AppState,
  env: EnvLike = process.env,
): { state: AppState; applied: boolean } {
  const config = getPresetDemoWalletConfig(env)
  if (!config.enabled || !config.coboWalletId) {
    return { state, applied: false }
  }

  state.settings.network = normalizeNetwork(state.settings.network)
  state.settings.apiKeyConfigured = Boolean(
    state.settings.coboApiKey?.trim() || process.env.AGENT_WALLET_API_KEY?.trim(),
  )

  const prep = state.walletPreparation
  prep.network = normalizeNetwork(prep.network)
  prep.demoMode = 'preset'
  prep.agentWallet.coboWalletId = config.coboWalletId
  if (config.agentWalletAddress) {
    prep.agentWallet.address = config.agentWalletAddress
    prep.agentWallet.created = true
    prep.steps.agent_wallet = 'completed'
    state.wallet.address = config.agentWalletAddress
  }
  prep.agentWallet.pairing = {
    status: 'paired',
    code: null,
    expiresAt: null,
  }

  if (config.eoaAddress) {
    prep.eoa = {
      connected: true,
      address: config.eoaAddress,
      label: 'Demo EOA',
    }
    prep.steps.eoa = 'completed'
  }

  prep.agentBootstrap = {
    mode: 'sdk-create',
    phase: 'paired',
    sessionId: null,
    walletStatus: 'active',
    tssOnline: true,
    message: 'Agent Wallet 已就绪。',
  }

  touchPreparation(prep)

  return { state, applied: true }
}

/** Resolve EVM address and USDC balance from Cobo for the configured demo wallet. */
export async function hydratePresetDemoWalletFromCobo(state: AppState): Promise<boolean> {
  const config = getPresetDemoWalletConfig()
  if (!config.enabled || !config.coboWalletId) return false

  applyPresetDemoWallet(state)
  const prep = state.walletPreparation

  try {
    const address = await ensureAgentWalletEvmAddress(state)
    prep.agentWallet.created = true
    prep.agentWallet.address = address
    prep.steps.agent_wallet = 'completed'
    state.wallet.address = address
  } catch (err) {
    const message = err instanceof Error ? err.message : '无法从 Cobo 读取 Agent Wallet'
    prep.agentBootstrap = {
      mode: 'sdk-create',
      phase: 'bootstrapping',
      sessionId: null,
      walletStatus: null,
      tssOnline: null,
      message,
    }
    prep.steps.agent_wallet = 'in_progress'
    touchPreparation(prep, state)
    return false
  }

  await syncFundingFromExistingBalance(state)
  touchPreparation(prep)
  return true
}
