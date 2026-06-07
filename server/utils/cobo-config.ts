import type { CawEnvironment, NetworkId } from '../../shared/types/demo'

export interface YieldProtocolContracts {
  /** Aave V3 Pool — supply / withdraw */
  aavePool: `0x${string}`
  /** Compound III Comet proxy — supply (omit if not deployed on network) */
  compoundComet?: `0x${string}`
  /** Uniswap V3 SwapRouter02 — swap (aggressive strategies) */
  uniswapSwapRouter?: `0x${string}`
}

export interface NetworkChainConfig {
  coboChainId: string
  coboTokenId: string
  evmChainId: number
  /** Wallet funding / Cobo balance USDC (Circle on Base Sepolia). */
  usdcContract: `0x${string}`
  /** USDC asset id listed on Aave V3 for this network (may differ from usdcContract). */
  aaveUsdcContract?: `0x${string}`
  usdcDecimals: number
  explorerTxBase: string
  yieldProtocols: YieldProtocolContracts
}

export const NETWORK_CHAIN_CONFIG: Record<NetworkId, NetworkChainConfig> = {
  'base-sepolia': {
    coboChainId: 'TBASE_SETH',
    coboTokenId: 'TBASE_USDC',
    evmChainId: 84532,
    usdcContract: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    aaveUsdcContract: '0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f',
    usdcDecimals: 6,
    explorerTxBase: 'https://sepolia.basescan.org/tx/',
    yieldProtocols: {
      aavePool: '0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27',
      compoundComet: '0x571621Ce60Cebb0c1D442B5afb38B1663C6Bf017',
      uniswapSwapRouter: '0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4',
    },
  },
  'arbitrum-sepolia': {
    coboChainId: 'TARBITRUM_SEPOLIA',
    coboTokenId: 'TARBITRUM_SEPOLIA_USDC',
    evmChainId: 421614,
    usdcContract: '0x75faf114eafb1BDbe2F5586D9cf644344d1172FA',
    usdcDecimals: 6,
    explorerTxBase: 'https://sepolia.arbiscan.io/tx/',
    yieldProtocols: {
      aavePool: '0xBfC91D59fdAA134A4ED45f7B584cAf96D7792Eff',
      uniswapSwapRouter: '0x101F443B4d1b059569D643917553c771E1b9663E',
    },
  },
}

export function buildYieldContractCallTargets(
  network: NetworkId,
  riskLevel: string,
): Array<{ chain_id: string; contract_addr: `0x${string}` }> {
  const cfg = getNetworkChainConfig(network)
  const chainId = cfg.coboChainId
  const targets: Array<{ chain_id: string; contract_addr: `0x${string}` }> = [
    { chain_id: chainId, contract_addr: cfg.usdcContract },
    { chain_id: chainId, contract_addr: cfg.yieldProtocols.aavePool },
  ]
  if (cfg.yieldProtocols.compoundComet) {
    targets.push({ chain_id: chainId, contract_addr: cfg.yieldProtocols.compoundComet })
  }
  if (riskLevel === 'aggressive' && cfg.yieldProtocols.uniswapSwapRouter) {
    targets.push({ chain_id: chainId, contract_addr: cfg.yieldProtocols.uniswapSwapRouter })
  }
  return targets
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
