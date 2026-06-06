import { describe, expect, it } from 'vitest'
import { fetchUsdcBalanceOnChain } from '../server/utils/cobo-preparation'

describe('fetchUsdcBalanceOnChain', () => {
  it('reads the known Base Sepolia USDC balance for the demo agent wallet', async () => {
    const balance = await fetchUsdcBalanceOnChain(
      'base-sepolia',
      '0xfbdc1f77d3ab2d42192fdd3962f4848efc0dc6bc',
    )

    expect(balance).toBeGreaterThanOrEqual(10)
  }, 30_000)
})
