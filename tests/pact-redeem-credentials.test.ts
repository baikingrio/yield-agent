import { describe, expect, it } from 'vitest'
import type { DemoState, Pact } from '../shared/types/demo'
import { resolveRedeemApiKey } from '../server/utils/pact-redeem-credentials'
import { storePactCredential } from '../server/db/repository'

function makeState(pact: Partial<Pact> & { id: string }): DemoState {
  return {
    wallet: { address: '0xAgent', totalAssetsUsdc: 10, currentApy: 0, cumulativeYieldUsdc: 0 },
    walletPreparation: {
      network: 'base-sepolia',
      eoa: { connected: true, address: '0xEoa', label: 'EOA' },
      agentWallet: { created: true, address: '0xAgent', coboWalletId: 'wallet-1' },
      funding: { status: 'ready', depositedUsdc: 10, availableUsdc: 10, lastTxHash: null },
      steps: { eoa: 'completed', agent_wallet: 'completed', funding: 'completed' },
      ready: true,
      updatedAt: new Date(0).toISOString(),
    },
    strategies: [],
    pacts: [{
      id: pact.id,
      strategyId: 'str-1',
      intent: 'test',
      status: pact.status ?? 'active',
      maxSpend: 10,
      whitelist: ['Compound 存入'],
      durationDays: 7,
      agentFeePercent: 10,
      userSplitPercent: 90,
      submissionMode: 'cobo',
      ...pact,
    } as Pact],
    logs: [],
    yieldSeries7d: [],
    yieldSeries30d: [],
    settings: { network: 'base-sepolia', apiKeyConfigured: true, defaultAgentFee: 10, userSplit: 90, coboApiKey: 'owner-key' },
  }
}

describe('resolveRedeemApiKey', () => {
  it('uses cached pact credential when pact is active', async () => {
    storePactCredential('pact-1', 'pact-key')
    const key = await resolveRedeemApiKey(makeState({ id: 'pact-1', status: 'active' }), makeState({ id: 'pact-1' }).pacts[0])
    expect(key).toBe('pact-key')
  })

  it('uses owner api key when pact is terminated', async () => {
    const key = await resolveRedeemApiKey(makeState({ id: 'pact-1', status: 'terminated' }), makeState({ id: 'pact-1', status: 'terminated' }).pacts[0])
    expect(key).toBe('owner-key')
  })
})
