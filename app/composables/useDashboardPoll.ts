const POLL_MS = 15_000

export function useDashboardPoll() {
  const store = useAppStore()
  let timer: ReturnType<typeof setInterval> | null = null

  function poll() {
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
