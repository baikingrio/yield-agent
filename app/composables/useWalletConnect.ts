import { useAccount, useChainId, useConnect, useDisconnect } from '@wagmi/vue'
import { arbitrumSepolia, baseSepolia } from '@wagmi/vue/chains'
import type { NetworkId } from '../../shared/types/demo'

const CHAIN_TO_NETWORK: Record<number, NetworkId> = {
  [baseSepolia.id]: 'base-sepolia',
  [arbitrumSepolia.id]: 'arbitrum-sepolia',
}

const NETWORK_LABELS: Record<NetworkId, string> = {
  'base-sepolia': 'Base Sepolia',
  'arbitrum-sepolia': 'Arbitrum Sepolia',
}

export function useWalletConnect() {
  const store = useDemoStore()
  const pageError = ref<string | null>(null)

  const { address, isConnected, connector, status } = useAccount()
  const chainId = useChainId()
  const { connect, connectors, isPending: connectPending, error: connectError } = useConnect()
  const { disconnect, isPending: disconnectPending } = useDisconnect()

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
    () => connectPending.value || disconnectPending.value || status.value === 'connecting',
  )

  async function connectWallet() {
    pageError.value = null
    store.clearError()
    const target = connectors.value.find((c) => c.id === 'injected') ?? connectors.value[0]
    if (!target) {
      pageError.value = '未检测到浏览器钱包，请安装 MetaMask 等扩展'
      return
    }
    connect({ connector: target })
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
    if (isConnected.value) disconnect()
    try {
      await store.disconnectEoa()
    } catch {
      pageError.value = store.error
    }
  }

  watch(
    [isConnected, address],
    () => {
      if (isConnected.value && address.value) syncConnectedEoa()
    },
  )

  watch(connectError, (err) => {
    if (err) pageError.value = err.message
  })

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
