import { describe, expect, it, vi } from 'vitest'

const readContract = vi.hoisted(() => vi.fn())

vi.mock('viem', async () => {
  const actual = await vi.importActual<typeof import('viem')>('viem')
  return {
    ...actual,
    createPublicClient: () => ({ readContract }),
    http: () => ({}),
  }
})

import { readYieldSuppliedAmount } from '../server/utils/yield-position'
import { getNetworkChainConfig } from '../server/utils/cobo-config'

describe('readYieldSuppliedAmount', () => {
  it('reads Compound single-arg balanceOf on Base Sepolia', async () => {
    readContract.mockResolvedValueOnce(10_000_000n)
    const chainConfig = getNetworkChainConfig('base-sepolia')
    const raw = await readYieldSuppliedAmount(
      'base-sepolia',
      chainConfig,
      '0xfbdc1f77d3ab2d42192fdd3962f4848efc0dc6bc',
    )
    expect(raw).toBe(10_000_000n)
    expect(readContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: 'balanceOf',
        args: ['0xfbdc1f77d3ab2d42192fdd3962f4848efc0dc6bc'],
      }),
    )
  })
})
