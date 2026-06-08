export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/dashboard')) return

  const store = useAppStore()

  if (!store.preparation) {
    try {
      await store.fetchPreparation()
    } catch {
      return navigateTo('/', { replace: true })
    }
  }

  const { isConnected } = useWalletConnect()
  const eoaConnected = Boolean(store.preparation?.eoa.connected)

  if (!eoaConnected && !isConnected.value) {
    return navigateTo('/', { replace: true })
  }
})
