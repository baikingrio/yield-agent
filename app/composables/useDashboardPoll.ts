import { DASHBOARD_HISTORY } from '#shared/constants/dashboard-routes'

const POLL_MS = 15_000

export function useDashboardPoll() {
  const route = useRoute()
  const store = useAppStore()
  let timer: ReturnType<typeof setInterval> | null = null

  function poll() {
    if (route.path === DASHBOARD_HISTORY) return
    store.fetchLogs({ limit: 10 }, { background: true }).catch(() => {})
    store.fetchYieldSeries(undefined, { sync: true }).catch(() => {})
    store.fetchWallet({ sync: true }).catch(() => {})
  }

  onMounted(() => {
    timer = setInterval(poll, POLL_MS)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })
}
