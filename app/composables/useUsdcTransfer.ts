import { useWriteContract } from '@wagmi/vue'
import { erc20Abi } from 'viem'
import type { DepositInfo } from '../../shared/types/demo'

function useUsdcTransferClient() {
  const writeMutation = useWriteContract()
  const transferError = ref<string | null>(null)

  async function transferUsdc(info: DepositInfo): Promise<`0x${string}`> {
    transferError.value = null
    const amount = BigInt(Math.round(info.minAmount * 10 ** info.decimals))
    try {
      const hash = await writeMutation.mutateAsync({
        address: info.usdcContract as `0x${string}`,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [info.agentAddress as `0x${string}`, amount],
      })
      return hash
    } catch (err) {
      transferError.value = err instanceof Error ? err.message : '链上转账失败'
      throw err
    }
  }

  return {
    transferUsdc,
    isWriting: writeMutation.isPending,
    transferError,
  }
}

function useUsdcTransferStub() {
  const transferError = ref<string | null>(null)
  const isWriting = ref(false)

  return {
    transferUsdc: async () => {
      throw new Error('链上转账仅可在浏览器中执行')
    },
    isWriting,
    transferError,
  }
}

export function useUsdcTransfer() {
  if (import.meta.server) {
    return useUsdcTransferStub()
  }
  return useUsdcTransferClient()
}
