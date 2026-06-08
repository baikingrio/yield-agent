import type { LogType } from '../../../shared/types/app'
import { getState } from '../../utils/app-store'

const LOG_TYPES: LogType[] = ['swap', 'supply', 'revenue', 'pact']

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const type = typeof query.type === 'string' ? query.type : undefined
  const pactId = typeof query.pactId === 'string' ? query.pactId.trim() : undefined
  const limitRaw = typeof query.limit === 'string' ? Number(query.limit) : 50
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50

  let logs = [...getState().logs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )

  if (type && LOG_TYPES.includes(type as LogType)) {
    logs = logs.filter((l) => l.type === type)
  }

  if (pactId) {
    logs = logs.filter((l) => l.pactId === pactId)
  }

  return logs.slice(0, limit)
})
