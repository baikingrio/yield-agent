import { canEnterDashboard } from '#shared/utils/demo-access'

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

  if (!canEnterDashboard({ preparation: store.preparation, browserWalletConnected: isConnected.value })) {
    return navigateTo('/', { replace: true })
  }
})
