import type { AppState } from '../../shared/types/app'
import { normalizeNetwork } from '../../shared/constants/network'
import { touchPreparation } from './wallet-preparation'

export interface PresetDemoWalletConfig {
  enabled: boolean
  eoaAddress: string
  agentWalletAddress: string
  coboWalletId: string
  availableUsdc: number
}

type EnvLike = Record<string, string | undefined>

const DEFAULT_DEMO_EOA = '0x1111111111111111111111111111111111111111'
const DEFAULT_DEMO_AGENT_WALLET = '0x2222222222222222222222222222222222222222'
const DEFAULT_DEMO_CAW_WALLET_ID = 'pacttrader-hackathon-demo-wallet'
const DEFAULT_DEMO_AVAILABLE_USDC = 500

function readPositiveNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return fallback
  return parsed
}

function isPresetEnabled(env: EnvLike): boolean {
  return env.PACTTRADER_DEMO_MODE === 'preset'
    || Boolean(env.PACTTRADER_DEMO_AGENT_WALLET_ADDRESS?.trim())
}

export function getPresetDemoWalletConfig(env: EnvLike = process.env): PresetDemoWalletConfig {
  const enabled = isPresetEnabled(env)
  return {
    enabled,
    eoaAddress: env.PACTTRADER_DEMO_EOA_ADDRESS?.trim() || DEFAULT_DEMO_EOA,
    agentWalletAddress: env.PACTTRADER_DEMO_AGENT_WALLET_ADDRESS?.trim() || DEFAULT_DEMO_AGENT_WALLET,
    coboWalletId: env.PACTTRADER_DEMO_CAW_WALLET_ID?.trim() || DEFAULT_DEMO_CAW_WALLET_ID,
    availableUsdc: readPositiveNumber(env.PACTTRADER_DEMO_AVAILABLE_USDC, DEFAULT_DEMO_AVAILABLE_USDC),
  }
}

export function applyPresetDemoWallet(
  state: AppState,
  env: EnvLike = process.env,
): { state: AppState; applied: boolean } {
  const config = getPresetDemoWalletConfig(env)
  if (!config.enabled) return { state, applied: false }

  state.settings.network = normalizeNetwork(state.settings.network)
  state.settings.apiKeyConfigured = true

  state.wallet.address = config.agentWalletAddress
  state.wallet.totalAssetsUsdc = config.availableUsdc
  state.wallet.currentApy = state.wallet.currentApy || 8.4
  state.wallet.cumulativeYieldUsdc = state.wallet.cumulativeYieldUsdc || 12.6

  const prep = state.walletPreparation
  prep.network = normalizeNetwork(prep.network)
  prep.demoMode = 'preset'
  prep.eoa = {
    connected: true,
    address: config.eoaAddress,
    label: 'Hackathon Demo EOA',
  }
  prep.agentWallet = {
    created: true,
    address: config.agentWalletAddress,
    coboWalletId: config.coboWalletId,
    pairing: {
      status: 'paired',
      code: null,
      expiresAt: null,
    },
  }
  prep.funding = {
    status: 'ready',
    depositedUsdc: config.availableUsdc,
    availableUsdc: config.availableUsdc,
    lastTxHash: null,
  }
  prep.agentBootstrap = {
    mode: 'sdk-create',
    phase: 'paired',
    sessionId: null,
    walletStatus: 'active',
    tssOnline: true,
    message: 'Hackathon Demo 使用预置 active Agent Wallet；评委默认查看 Pact 边界、策略执行与审计日志。',
  }
  prep.steps = {
    eoa: 'completed',
    agent_wallet: 'completed',
    funding: 'completed',
  }
  touchPreparation(prep)

  return { state, applied: true }
}
