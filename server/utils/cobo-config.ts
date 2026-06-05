import type { CawEnvironment, NetworkId } from '../../shared/types/demo'

export interface NetworkChainConfig {
  coboChainId: string
  coboTokenId: string
  evmChainId: number
  usdcContract: `0x${string}`
  usdcDecimals: number
  explorerTxBase: string
}

export const NETWORK_CHAIN_CONFIG: Record<NetworkId, NetworkChainConfig> = {
  'base-sepolia': {
    coboChainId: 'TBASE_SETH',
    coboTokenId: 'TBASE_SETH_USDC',
    evmChainId: 84532,
    usdcContract: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    usdcDecimals: 6,
    explorerTxBase: 'https://sepolia.basescan.org/tx/',
  },
  'arbitrum-sepolia': {
    coboChainId: 'TARBITRUM_SEPOLIA',
    coboTokenId: 'TARBITRUM_SEPOLIA_USDC',
    evmChainId: 421614,
    usdcContract: '0x75faf114eafb1BDbe2F5586D9cf644344d1172FA',
    usdcDecimals: 6,
    explorerTxBase: 'https://sepolia.arbiscan.io/tx/',
  },
}

export function getNetworkChainConfig(network: NetworkId): NetworkChainConfig {
  return NETWORK_CHAIN_CONFIG[network]
}

export function getCoboBasePath(): string {
  const explicit = process.env.AGENT_WALLET_API_URL?.trim()
  if (explicit) return explicit

  return getCoboEnvironment() === 'prod'
    ? 'https://api-core.agenticwallet.cobo.com'
    : 'https://api-core.agenticwallet.dev.cobo.com'
}

export function getCoboEnvironment(): CawEnvironment {
  const env = process.env.AGENT_WALLET_ENV?.trim().toLowerCase()
  if (env === 'prod') return 'prod'
  if (env === 'dev' || !env) return 'dev'
  return 'custom'
}
