import { useConnect, useConnection, useDisconnect } from '@wagmi/vue'
import { arbitrumSepolia, baseSepolia } from '@wagmi/vue/chains'
import { injected } from '@wagmi/vue/connectors'
import { DASHBOARD_HOME } from '#shared/constants/dashboard-routes'
import { NETWORK_LABELS } from '#shared/types/app'
import type { NetworkId } from '#shared/types/app'

const CHAIN_TO_NETWORK: Record<number, NetworkId> = {
  [baseSepolia.id]: 'base-sepolia',
  [arbitrumSepolia.id]: 'arbitrum-sepolia',
}

function useWalletConnectClient() {
  const store = useAppStore()
  const route = useRoute()
  const pageError = ref<string | null>(null)
  const shouldRedirectAfterSync = ref(false)

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

  function shortAddr(addr: string) {
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`
  }

  const displayAddress = computed(() => {
    const addr = address.value ?? store.preparation?.eoa.address
    return addr ? shortAddr(addr) : null
  })

  const displayLabel = computed(() => {
    if (store.preparation?.eoa.label?.trim()) return store.preparation.eoa.label
    return connector.value?.name ?? '注入式钱包'
  })

  async function connectWallet(options?: { redirect?: boolean }) {
    pageError.value = null
    store.clearError()
    shouldRedirectAfterSync.value = options?.redirect !== false
    try {
      await connectMutation.mutateAsync({ connector: injected() })
    } catch (err) {
      shouldRedirectAfterSync.value = false
      pageError.value = err instanceof Error ? err.message : '连接钱包失败'
    }
  }

  async function syncConnectedEoa() {
    const addr = address.value
    if (!isConnected.value || !addr) return
    const label = connector.value?.name ?? '注入式钱包'
    const current = store.preparation?.eoa.address
    const currentLabel = store.preparation?.eoa.label?.trim()
    const needsSync =
      current?.toLowerCase() !== addr.toLowerCase()
      || currentLabel !== label

    if (!needsSync) {
      if (shouldRedirectAfterSync.value) {
        shouldRedirectAfterSync.value = false
        if (!route.path.startsWith(DASHBOARD_HOME)) await navigateTo(DASHBOARD_HOME)
      }
      return
    }

    try {
      await store.connectEoa(addr, label)
      if (shouldRedirectAfterSync.value) {
        shouldRedirectAfterSync.value = false
        if (!route.path.startsWith(DASHBOARD_HOME)) await navigateTo(DASHBOARD_HOME)
      }
    } catch {
      shouldRedirectAfterSync.value = false
      pageError.value = store.error
    }
  }

  async function disconnectWallet() {
    pageError.value = null
    store.clearError()
    shouldRedirectAfterSync.value = false
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
    displayAddress,
    displayLabel,
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
    displayAddress: computed(() => null),
    displayLabel: computed(() => ''),
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
