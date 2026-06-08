import { createPublicClient, formatEther, http } from 'viem'
import { arbitrumSepolia, baseSepolia, sepolia } from 'viem/chains'
import { NETWORK_LABELS } from '../../shared/types/app'
import type { AgentGasWrongChainHint, NetworkId } from '../../shared/types/app'

export { NETWORK_LABELS }

export const MIN_NATIVE_ETH = 0.0001
export const RECOMMENDED_FUND_ETH = 0.001

const MIN_NATIVE_ETH_WEI = BigInt(Math.floor(MIN_NATIVE_ETH * 1e18))

export const NATIVE_TOKEN_LABELS: Record<NetworkId, string> = {
  'base-sepolia': 'Base Sepolia ETH',
  'arbitrum-sepolia': 'Arbitrum Sepolia ETH',
}

export const FAUCET_HINTS: Record<NetworkId, string> = {
  'base-sepolia': 'https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet',
  'arbitrum-sepolia': 'https://faucet.quicknode.com/arbitrum/sepolia',
}

function chainForNetwork(network: NetworkId) {
  return network === 'base-sepolia' ? baseSepolia : arbitrumSepolia
}

export async function getAgentNativeEthBalance(
  network: NetworkId,
  address: `0x${string}`,
): Promise<bigint> {
  const client = createPublicClient({
    chain: chainForNetwork(network),
    transport: http(),
  })
  return client.getBalance({ address })
}

export async function detectWrongChainGasHint(
  network: NetworkId,
  address: `0x${string}`,
  requiredNetworkBalance: bigint,
): Promise<AgentGasWrongChainHint | null> {
  if (hasEnoughAgentGas(requiredNetworkBalance)) return null

  if (network === 'base-sepolia') {
    const client = createPublicClient({ chain: sepolia, transport: http() })
    const sepoliaBalance = await client.getBalance({ address })
    if (!hasEnoughAgentGas(sepoliaBalance)) return null

    const formatted = formatEther(sepoliaBalance)
    return {
      chainLabel: 'Ethereum Sepolia',
      tokenLabel: 'SETH',
      balance: formatted,
      message: `检测到 Agent Wallet 在 Ethereum Sepolia 有 ${formatted} SETH，但本策略运行在 Base Sepolia，链上 Gas 不通用。请为 Base Sepolia 单独领取或转入 ETH。`,
    }
  }

  return null
}

export function buildAgentGasRequiredMessage(
  network: NetworkId,
  address: string,
  ethBalance: bigint,
  wrongChainHint?: AgentGasWrongChainHint | null,
): string {
  const label = NETWORK_LABELS[network]
  const tokenLabel = NATIVE_TOKEN_LABELS[network]
  const faucet = FAUCET_HINTS[network]
  const formatted = formatEther(ethBalance)
  const lines = [
    `Agent Wallet 缺少 ${tokenLabel} 用于支付链上 Gas（${label} 余额 ${formatted} ETH）。`,
    `请先向 ${address} 转入至少 ${MIN_NATIVE_ETH} ${tokenLabel}，然后重试首次 Recipe。`,
    `测试网水龙头：${faucet}`,
  ]
  if (wrongChainHint) lines.splice(1, 0, wrongChainHint.message)
  return lines.join(' ')
}

export function hasEnoughAgentGas(ethBalance: bigint): boolean {
  return ethBalance >= MIN_NATIVE_ETH_WEI
}

export async function assertAgentWalletHasGas(
  network: NetworkId,
  address: string,
): Promise<void> {
  const balance = await getAgentNativeEthBalance(network, address as `0x${string}`)
  if (hasEnoughAgentGas(balance)) return
  const wrongChainHint = await detectWrongChainGasHint(network, address as `0x${string}`, balance)
  throw new Error(buildAgentGasRequiredMessage(network, address, balance, wrongChainHint))
}

export function resolveContractCallSponsor(ethBalance: bigint): boolean {
  return !hasEnoughAgentGas(ethBalance)
}
