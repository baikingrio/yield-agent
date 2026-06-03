const POLL_MS = 15_000

export function useDashboardPoll() {
  const store = useDemoStore()
  let timer: ReturnType<typeof setInterval> | null = null

  function poll() {
    store.fetchLogs({ limit: 10 }).catch(() => {})
    store.fetchYieldSeries().catch(() => {})
  }

  onMounted(() => {
    poll()
    timer = setInterval(poll, POLL_MS)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })
}
