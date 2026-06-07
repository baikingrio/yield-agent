import { describe, expect, it } from 'vitest'
import { buildAgentGasRequiredMessage } from '../server/utils/agent-gas'

describe('agent-gas helpers', () => {
  it('builds actionable gas message with faucet link', () => {
    const message = buildAgentGasRequiredMessage('base-sepolia', '0xabc', 0n)
    expect(message).toContain('0xabc')
    expect(message).toContain('Base Sepolia ETH')
    expect(message).toContain('coinbase.com/faucets')
  })

  it('includes wrong-chain hint in gas message', () => {
    const message = buildAgentGasRequiredMessage('base-sepolia', '0xabc', 0n, {
      chainLabel: 'Ethereum Sepolia',
      tokenLabel: 'SETH',
      balance: '0.01',
      message: 'SETH 不能用于 Base Sepolia。',
    })
    expect(message).toContain('SETH 不能用于 Base Sepolia')
  })

})
