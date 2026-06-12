import type { LogEntry } from '../types/app'

export interface FetchLogsOptions {
  /** Keep showing existing rows when a background refresh returns an empty list. */
  background?: boolean
  /** Replace the list even when the response is empty (filters / history page). */
  allowEmpty?: boolean
}

export function shouldReplaceLogs(
  current: LogEntry[],
  next: LogEntry[],
  options?: FetchLogsOptions,
): boolean {
  if (next.length > 0) return true
  if (options?.allowEmpty) return true
  if (options?.background && current.length > 0) return false
  return current.length === 0
}
