import { describe, expect, it, vi } from 'vitest'
import { submitContractCallAndWait } from '../server/utils/cobo-transaction'

vi.mock('../server/utils/yield-execution', () => ({
  formatTransactionFailureMessage: vi.fn(() => 'failed'),
  isTerminalTransactionFailure: vi.fn(() => false),
  isTerminalTransactionSuccess: vi.fn(() => true),
}))

describe('submitContractCallAndWait', () => {
  it('passes explicit src_addr because Cobo contract calls require the source wallet address', async () => {
    const contractCall = vi.fn(async () => ({
      data: {
        result: {
          status: 200,
          status_display: 'Success',
          transaction_hash: '0xabc',
        },
      },
    }))
    const getUserTransactionByRequestId = vi.fn(async () => ({
      data: {
        result: {
          id: 'tx-1',
          status: 200,
          status_display: 'Success',
          transaction_hash: '0xabc',
        },
      },
    }))

    await submitContractCallAndWait(
      { contractCall } as never,
      { getUserTransactionByRequestId } as never,
      'wallet-1',
      '0x382a91e60038085bc07e6f1e32739dcfa816c5a1',
      true,
      {
        chainId: 'TBASE_SETH',
        contractAddr: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
        calldata: '0x1234',
        requestId: 'req-1',
        description: 'test call',
        stepLabel: '测试调用',
      },
    )

    expect(contractCall).toHaveBeenCalledWith('wallet-1', expect.objectContaining({
      src_addr: '0x382a91e60038085bc07e6f1e32739dcfa816c5a1',
    }))
  })
})
