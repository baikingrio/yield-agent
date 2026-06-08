import { createPublicClient, http } from 'viem'
import { arbitrumSepolia, baseSepolia } from 'viem/chains'
import type { NetworkId, YieldPositionSnapshot } from '../../shared/types/app'
import type { NetworkChainConfig } from './cobo-config'
import { resolveFirstYieldSupplyRoute } from './yield-execution'

/** Compound III Comet: base asset balance for account (single-arg balanceOf). */
const compoundBalanceAbi = [{
  type: 'function',
  name: 'balanceOf',
  inputs: [{ name: 'account', type: 'address' }],
  outputs: [{ type: 'uint256' }],
  stateMutability: 'view',
}] as const

function chainForNetwork(network: NetworkId) {
  return network === 'base-sepolia' ? baseSepolia : arbitrumSepolia
}

export async function readYieldSuppliedAmount(
  network: NetworkId,
  chainConfig: NetworkChainConfig,
  walletAddress: `0x${string}`,
): Promise<bigint> {
  const route = resolveFirstYieldSupplyRoute(chainConfig)
  const client = createPublicClient({
    chain: chainForNetwork(network),
    transport: http(),
  })

  if (route.protocol === 'compound' && chainConfig.yieldProtocols.compoundComet) {
    return client.readContract({
      address: chainConfig.yieldProtocols.compoundComet,
      abi: compoundBalanceAbi,
      functionName: 'balanceOf',
      args: [walletAddress],
    })
  }

  return 0n
}

export async function fetchYieldPositionSnapshot(
  network: NetworkId,
  chainConfig: NetworkChainConfig,
  walletAddress: string,
): Promise<YieldPositionSnapshot> {
  const route = resolveFirstYieldSupplyRoute(chainConfig)
  const raw = await readYieldSuppliedAmount(
    network,
    chainConfig,
    walletAddress as `0x${string}`,
  )
  const suppliedUsdc = Number(raw) / 10 ** chainConfig.usdcDecimals
  return {
    protocol: route.protocolLabel,
    suppliedUsdc,
    redeemable: raw > 0n,
  }
}
