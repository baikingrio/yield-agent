import { createPublicClient, erc20Abi, http, parseEventLogs } from 'viem'
import { arbitrumSepolia, baseSepolia } from 'viem/chains'
import type { NetworkId } from '../../shared/types/app'
import { getNetworkChainConfig } from './cobo-config'

export async function verifyUsdcDeposit(params: {
  txHash: string
  network: NetworkId
  agentAddress: string
  eoaAddress: string
  minAmountUsdc: number
}): Promise<void> {
  const chainConfig = getNetworkChainConfig(params.network)
  const chain = params.network === 'base-sepolia' ? baseSepolia : arbitrumSepolia
  const client = createPublicClient({ chain, transport: http() })

  const receipt = await client.waitForTransactionReceipt({
    hash: params.txHash as `0x${string}`,
    timeout: 120_000,
  })

  if (receipt.status !== 'success') {
    throw new Error('TX_FAILED')
  }

  const minUnits = BigInt(Math.round(params.minAmountUsdc * 10 ** chainConfig.usdcDecimals))
  const agent = params.agentAddress.toLowerCase()
  const eoa = params.eoaAddress.toLowerCase()
  const contract = chainConfig.usdcContract.toLowerCase()

  const transfers = parseEventLogs({
    abi: erc20Abi,
    eventName: 'Transfer',
    logs: receipt.logs,
  })

  const matched = transfers.some((log) => {
    if (log.address.toLowerCase() !== contract) return false
    const { from, to, value } = log.args
    return (
      to?.toLowerCase() === agent
      && from?.toLowerCase() === eoa
      && value !== undefined
      && value >= minUnits
    )
  })

  if (!matched) {
    throw new Error('TRANSFER_NOT_FOUND')
  }
}
