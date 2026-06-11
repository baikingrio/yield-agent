import { describe, expect, it } from 'vitest'
import type { Pact } from '../shared/types/app'
import {
  buildExecutionRequestId,
  buildRedeemRequestId,
  encodeYieldWithdrawCalldata,
  nextRedeemAttempt,
  formatTransactionFailureMessage,
  isStaleFirstExecution,
  isTerminalTransactionFailure,
  isTerminalTransactionSuccess,
  isTransactionAwaitingExternalApproval,
  needsFirstExecution,
  nextFirstExecutionAttempt,
  resolveFirstSupplyAmountUsdc,
  resolveFirstYieldSupplyRoute,
  toUsdcBaseUnits,
} from '../server/utils/yield-execution'
import { getNetworkChainConfig } from '../server/utils/cobo-config'

function makePact(overrides: Partial<Pact> = {}): Pact {
  return {
    id: 'pact-1',
    strategyId: 'str-1',
    status: 'active',
    submissionMode: 'cobo',
    firstExecutionCompleted: false,
    firstExecutionTxHash: '',
    ...overrides,
  } as Pact
}

describe('yield-execution helpers', () => {
  it('resolveFirstSupplyAmountUsdc picks min of available and max spend', () => {
    expect(resolveFirstSupplyAmountUsdc(10, 5)).toBe(5)
    expect(resolveFirstSupplyAmountUsdc(3, 10)).toBe(3)
    expect(resolveFirstSupplyAmountUsdc(0, 10)).toBe(0)
  })

  it('toUsdcBaseUnits converts with decimals', () => {
    expect(toUsdcBaseUnits(1.5, 6)).toBe(1_500_000n)
  })

  it('detects stale first execution without tx hash', () => {
    expect(isStaleFirstExecution(makePact({ firstExecutionCompleted: true, firstExecutionTxHash: '' }))).toBe(true)
    expect(isStaleFirstExecution(makePact({ firstExecutionCompleted: true, firstExecutionTxHash: '0xabc' }))).toBe(false)
  })

  it('needsFirstExecution when incomplete or stale', () => {
    expect(needsFirstExecution(makePact())).toBe(true)
    expect(needsFirstExecution(makePact({ firstExecutionCompleted: true, firstExecutionTxHash: '0x1' }))).toBe(false)
    expect(needsFirstExecution(makePact({ firstExecutionCompleted: true, firstExecutionTxHash: '' }))).toBe(true)
  })

  it('classifies terminal transaction status', () => {
    expect(isTerminalTransactionSuccess(900, 'Success')).toBe(true)
    expect(isTerminalTransactionSuccess(300, 'Processing')).toBe(false)
    expect(isTerminalTransactionFailure(901, 'Failed')).toBe(true)
    expect(isTerminalTransactionFailure(300, 'Processing')).toBe(false)
    expect(isTerminalTransactionFailure(901, 'Denied')).toBe(true)
    expect(isTransactionAwaitingExternalApproval('Awaiting Approval')).toBe(true)
  })

  it('builds unique request ids per attempt', () => {
    expect(buildExecutionRequestId('pact-1', 'approve', 2)).toBe('yieldagent-pact-1-approve-a2')
    expect(nextFirstExecutionAttempt(makePact({ firstExecutionAttempt: 1 }))).toBe(2)
  })

  it('formats transaction failure with step label', () => {
    expect(formatTransactionFailureMessage('USDC 授权 Aave', 'Failed', 901)).toContain('USDC 授权 Aave失败')
  })

  it('builds redeem request ids', () => {
    expect(buildRedeemRequestId('pact-1', 1)).toBe('yieldagent-pact-1-redeem-a1')
    expect(nextRedeemAttempt(makePact({ redeemAttempt: 2 }))).toBe(3)
  })

  it('encodes Compound withdraw calldata', () => {
    const route = resolveFirstYieldSupplyRoute(getNetworkChainConfig('base-sepolia'))
    const calldata = encodeYieldWithdrawCalldata(route, 1_000_000n, '0xabc0000000000000000000000000000000000000')
    expect(calldata.startsWith('0x')).toBe(true)
    expect(calldata.length).toBeGreaterThan(10)
  })

  it('routes Base Sepolia Circle USDC to Compound instead of Aave', () => {
    const route = resolveFirstYieldSupplyRoute(getNetworkChainConfig('base-sepolia'))
    expect(route.protocol).toBe('compound')
    expect(route.protocolLabel).toBe('Compound')
    expect(route.asset).toBe('0x036CbD53842c5426634e7929541eC2318f3dCF7e')
  })
})
