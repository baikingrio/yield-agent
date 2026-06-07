export function extractApiErrorMessage(err: unknown, fallback = '请求失败，请稍后重试'): string {
  if (!err || typeof err !== 'object' || !('data' in err)) return fallback
  const payload = (err as { data?: unknown }).data
  if (!payload || typeof payload !== 'object') return fallback

  const body = payload as { error?: unknown; data?: { error?: unknown } }
  const detail = body.data?.error ?? body.error
  if (typeof detail === 'string' && detail.trim()) return detail
  return fallback
}
