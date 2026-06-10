import { describe, expect, it } from 'vitest'
import { buildYieldContractCallTargets } from '../server/utils/cobo-config'
import { buildYieldPactDraft, buildYieldPactPolicies, strategyWhitelist } from '../server/utils/cobo-pact'

const basePayload = {
  network: 'base-sepolia' as const,
  asset: 'USDC',
  targetApy: '8',
  riskLevel: 'conservative',
  maxSpend: '10',
  agentFee: '15',
  userSplit: '85',
}

describe('buildYieldPactPolicies', () => {
  it('uses ChainTokenRef objects for token_in', () => {
    const policies = buildYieldPactPolicies(basePayload)
    const transfer = policies.find((policy) => policy.name === 'yieldagent-usdc-transfer-cap')
    expect(transfer?.rules.when.token_in).toEqual([
      { chain_id: 'TBASE_SETH', token_id: 'TBASE_USDC' },
    ])
  })

  it('only emits allow-effect policies (no explicit deny policies)', () => {
    const policies = buildYieldPactPolicies(basePayload)
    expect(policies.every((policy) => policy.rules.effect === 'allow')).toBe(true)
    expect(policies.some((policy) => policy.name.includes('deny'))).toBe(false)
  })

  it('authorizes USDC, Aave Pool, and Compound Comet on Base Sepolia', () => {
    const policies = buildYieldPactPolicies(basePayload)
    const contractCalls = policies.find((policy) => policy.name === 'yieldagent-allowlisted-yield-contract-calls')
    const targets = contractCalls?.rules.when.target_in ?? []
    const addresses = targets.map((t) => t.contract_addr?.toLowerCase())

    expect(addresses).toContain('0x036cbd53842c5426634e7929541ec2318f3dcf7e')
    expect(addresses).toContain('0x8bab6d1b75f19e9ed9fce8b9bd338844ff79ae27')
    expect(addresses).toContain('0x571621ce60cebb0c1d442b5afb38b1663c6bf017')
  })

  it('is wired into buildYieldPactDraft spec', () => {
    const draft = buildYieldPactDraft(basePayload)
    expect(draft.spec.policies).toHaveLength(2)
  })
})

describe('buildYieldContractCallTargets', () => {
  it('includes Compound Comet on Base Sepolia', () => {
    const targets = buildYieldContractCallTargets('base-sepolia', 'conservative')
    const addresses = targets.map((t) => t.contract_addr.toLowerCase())
    expect(addresses).toContain('0x571621ce60cebb0c1d442b5afb38b1663c6bf017')
  })

  it('includes Uniswap router for aggressive Base Sepolia strategies', () => {
    const targets = buildYieldContractCallTargets('base-sepolia', 'aggressive')
    const addresses = targets.map((t) => t.contract_addr.toLowerCase())
    expect(addresses).toContain('0x94cc0aac535ccdb3c01d6787d6413c739ae12bc4')
  })
})

describe('strategyWhitelist', () => {
  it('includes Compound on Base Sepolia', () => {
    expect(strategyWhitelist('conservative', 'base-sepolia')).toEqual(['Aave 存入', 'Compound 存入'])
  })
})
