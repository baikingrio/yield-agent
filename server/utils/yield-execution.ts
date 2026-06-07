import { encodeFunctionData } from 'viem'
import type { Pact } from '../../shared/types/demo'
import type { NetworkChainConfig } from './cobo-config'

export function resolveFirstSupplyAmountUsdc(availableUsdc: number, maxSpend: number): number {
  const amount = Math.min(availableUsdc, maxSpend)
  if (!Number.isFinite(amount) || amount <= 0) return 0
  return amount
}

export function isStaleFirstExecution(pact: Pact): boolean {
  return Boolean(pact.firstExecutionCompleted && !pact.firstExecutionTxHash?.trim())
}

export function needsFirstExecution(pact: Pact): boolean {
  return !pact.firstExecutionCompleted || isStaleFirstExecution(pact)
}

export function nextFirstExecutionAttempt(pact: Pact): number {
  return (pact.firstExecutionAttempt ?? 0) + 1
}

export function buildExecutionRequestId(
  pactId: string,
  step: 'approve' | 'supply',
  attempt: number,
): string {
  return `yieldagent-${pactId}-${step}-a${attempt}`
}

export interface YieldSupplyRoute {
  protocol: 'aave' | 'compound'
  protocolLabel: string
  approveSpender: `0x${string}`
  contractAddr: `0x${string}`
  asset: `0x${string}`
}

const aavePoolSupplyAbi = [{
  type: 'function',
  name: 'supply',
  inputs: [
    { name: 'asset', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'onBehalfOf', type: 'address' },
    { name: 'referralCode', type: 'uint16' },
  ],
  outputs: [],
  stateMutability: 'nonpayable',
}] as const

const compoundSupplyAbi = [{
  type: 'function',
  name: 'supply',
  inputs: [
    { name: 'asset', type: 'address' },
    { name: 'amount', type: 'uint256' },
  ],
  outputs: [],
  stateMutability: 'nonpayable',
}] as const

/** Circle USDC on Base Sepolia is not listed on Aave V3; route to Compound instead. */
export function resolveFirstYieldSupplyRoute(chainConfig: NetworkChainConfig): YieldSupplyRoute {
  const aaveAsset = chainConfig.aaveUsdcContract ?? chainConfig.usdcContract
  const fundingMatchesAave = chainConfig.usdcContract.toLowerCase() === aaveAsset.toLowerCase()

  if (!fundingMatchesAave && chainConfig.yieldProtocols.compoundComet) {
    return {
      protocol: 'compound',
      protocolLabel: 'Compound',
      approveSpender: chainConfig.yieldProtocols.compoundComet,
      contractAddr: chainConfig.yieldProtocols.compoundComet,
      asset: chainConfig.usdcContract,
    }
  }

  return {
    protocol: 'aave',
    protocolLabel: 'Aave',
    approveSpender: chainConfig.yieldProtocols.aavePool,
    contractAddr: chainConfig.yieldProtocols.aavePool,
    asset: aaveAsset,
  }
}

export function encodeYieldSupplyCalldata(
  route: YieldSupplyRoute,
  amount: bigint,
  walletAddress: `0x${string}`,
): `0x${string}` {
  if (route.protocol === 'compound') {
    return encodeFunctionData({
      abi: compoundSupplyAbi,
      functionName: 'supply',
      args: [route.asset, amount],
    })
  }
  return encodeFunctionData({
    abi: aavePoolSupplyAbi,
    functionName: 'supply',
    args: [route.asset, amount, walletAddress, 0],
  })
}

export function formatTransactionFailureMessage(
  step: string,
  statusDisplay?: string,
  status?: number,
  failedReason?: string | null,
): string {
  const detail = failedReason?.trim()
    || (statusDisplay && statusDisplay !== 'Failed' ? statusDisplay : '')
    || (status ? String(status) : '')
  const suffix = detail ? `：${detail}` : ''
  return `${step}失败${suffix}。请检查 Gas、USDC 余额与协议授权后重试。`
}

export function toUsdcBaseUnits(amountUsdc: number, decimals: number): bigint {
  return BigInt(Math.floor(amountUsdc * 10 ** decimals))
}

export function isTerminalTransactionSuccess(status: number, statusDisplay?: string): boolean {
  const display = statusDisplay?.trim().toLowerCase()
  return status === 900 || display === 'success'
}

export function isTerminalTransactionFailure(status: number, statusDisplay?: string): boolean {
  const display = statusDisplay?.trim().toLowerCase()
  return status === 901 || status === 902 || status === 903
    || display === 'failed' || display === 'rejected' || display === 'cancelled'
}
