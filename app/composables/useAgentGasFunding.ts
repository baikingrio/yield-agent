import { useConnection, useSendTransaction, useSwitchChain } from '@wagmi/vue'
import { arbitrumSepolia, baseSepolia } from '@wagmi/vue/chains'
import { createPublicClient, http, parseEther } from 'viem'
import type { NetworkId } from '#shared/types/app'

const CHAIN_BY_NETWORK = {
  'base-sepolia': baseSepolia,
  'arbitrum-sepolia': arbitrumSepolia,
} as const

function useAgentGasFundingClient() {
  const fundingError = ref<string | null>(null)
  const funding = ref(false)
  const { isConnected, chainId } = useConnection()
  const switchChain = useSwitchChain()
  const sendTransaction = useSendTransaction()

  async function fundAgentGas(
    agentAddress: string,
    network: NetworkId,
    amountEth = 0.001,
  ): Promise<`0x${string}`> {
    fundingError.value = null
    if (!isConnected.value) {
      throw new Error('请先在钱包准备页连接 EOA')
    }

    const chain = CHAIN_BY_NETWORK[network]
    if (chainId.value !== chain.id) {
      await switchChain.switchChainAsync({ chainId: chain.id })
    }

    funding.value = true
    try {
      const hash = await sendTransaction.mutateAsync({
        to: agentAddress as `0x${string}`,
        value: parseEther(String(amountEth)),
        chainId: chain.id,
      })
      const client = createPublicClient({ chain, transport: http() })
      const receipt = await client.waitForTransactionReceipt({ hash, timeout: 120_000 })
      if (receipt.status !== 'success') {
        throw new Error('Gas 充值交易失败')
      }
      return hash
    } catch (err) {
      fundingError.value = err instanceof Error ? err.message : 'Gas 充值失败'
      throw err
    } finally {
      funding.value = false
    }
  }

  return {
    fundAgentGas,
    funding,
    fundingError,
    eoaConnected: isConnected,
  }
}

function useAgentGasFundingStub() {
  return {
    fundAgentGas: async () => {
      throw new Error('Gas 充值仅可在浏览器中执行')
    },
    funding: ref(false),
    fundingError: ref<string | null>(null),
    eoaConnected: ref(false),
  }
}

export function useAgentGasFunding() {
  if (import.meta.server) return useAgentGasFundingStub()
  return useAgentGasFundingClient()
}
