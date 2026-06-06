import { useConnect, useConnection, useDisconnect } from '@wagmi/vue'
import { arbitrumSepolia, baseSepolia } from '@wagmi/vue/chains'
import { injected } from '@wagmi/vue/connectors'
import type { NetworkId } from '../../shared/types/demo'

const CHAIN_TO_NETWORK: Record<number, NetworkId> = {
  [baseSepolia.id]: 'base-sepolia',
  [arbitrumSepolia.id]: 'arbitrum-sepolia',
}

const NETWORK_LABELS: Record<NetworkId, string> = {
  'base-sepolia': 'Base Sepolia',
  'arbitrum-sepolia': 'Arbitrum Sepolia',
}

function useWalletConnectClient() {
  const store = useDemoStore()
  const pageError = ref<string | null>(null)

  const { address, chainId, isConnected, isConnecting, connector } = useConnection()
  const connectMutation = useConnect()
  const disconnectMutation = useDisconnect()

  const expectedNetwork = computed(
    () => store.preparation?.network ?? store.settings?.network ?? 'base-sepolia',
  )

  const connectedNetwork = computed(() => {
    const id = chainId.value
    return id ? CHAIN_TO_NETWORK[id] : null
  })

  const connectedNetworkLabel = computed(() =>
    connectedNetwork.value ? NETWORK_LABELS[connectedNetwork.value] : null,
  )

  const networkMismatch = computed(() => {
    if (!isConnected.value || !connectedNetwork.value) return false
    return connectedNetwork.value !== expectedNetwork.value
  })

  const busy = computed(
    () =>
      connectMutation.isPending.value
      || disconnectMutation.isPending.value
      || isConnecting.value,
  )

  async function connectWallet() {
    pageError.value = null
    store.clearError()
    try {
      await connectMutation.mutateAsync({ connector: injected() })
    } catch (err) {
      pageError.value = err instanceof Error ? err.message : '连接钱包失败'
    }
  }

  async function syncConnectedEoa() {
    const addr = address.value
    if (!isConnected.value || !addr) return
    const label = connector.value?.name ?? '注入式钱包'
    const current = store.preparation?.eoa.address
    if (current?.toLowerCase() === addr.toLowerCase()) return
    try {
      await store.connectEoa(addr, label)
    } catch {
      pageError.value = store.error
    }
  }

  async function disconnectWallet() {
    pageError.value = null
    store.clearError()
    try {
      if (isConnected.value) {
        await disconnectMutation.mutateAsync()
      }
      await store.disconnectEoa()
    } catch (err) {
      pageError.value = err instanceof Error ? err.message : store.error
    }
  }

  watch(
    [isConnected, address],
    () => {
      if (isConnected.value && address.value) syncConnectedEoa()
    },
  )

  return {
    address,
    isConnected,
    connectedNetwork,
    connectedNetworkLabel,
    expectedNetwork,
    networkMismatch,
    busy,
    pageError,
    connectWallet,
    disconnectWallet,
    NETWORK_LABELS,
  }
}

function useWalletConnectStub() {
  const pageError = ref<string | null>(null)

  return {
    address: ref<`0x${string}` | undefined>(undefined),
    isConnected: ref(false),
    connectedNetwork: computed(() => null),
    connectedNetworkLabel: computed(() => null),
    expectedNetwork: computed(() => 'base-sepolia' as NetworkId),
    networkMismatch: computed(() => false),
    busy: computed(() => false),
    pageError,
    connectWallet: async () => {},
    disconnectWallet: async () => {},
    NETWORK_LABELS,
  }
}

export function useWalletConnect() {
  if (import.meta.server) {
    return useWalletConnectStub()
  }
  return useWalletConnectClient()
}
