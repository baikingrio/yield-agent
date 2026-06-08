import type { AppState } from '../../shared/types/app'
import { getCoboBasePath } from './cobo-config'
import { schedulePersistAppState } from './app-state-persistence'

interface ProvisionResponse {
  success?: boolean
  message?: string
  suggestion?: string
  result?: {
    agent_id?: string
    api_key?: string
    status?: string
  }
}

type ProvisionFetcher = (url: string, init: {
  method: 'POST'
  headers: Record<string, string>
  body: string
}) => Promise<ProvisionResponse>

export interface ProvisionCawPrincipalOptions {
  name: string
  baseUrl?: string
  fetcher?: ProvisionFetcher
}

export interface ProvisionCawPrincipalResult {
  agentId: string
  status: string
}

function joinApiPath(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}${path}`
}

async function defaultFetcher(url: string, init: Parameters<ProvisionFetcher>[1]): Promise<ProvisionResponse> {
  const resp = await fetch(url, init)
  const payload = await resp.json().catch(() => ({})) as ProvisionResponse
  if (!resp.ok) {
    throw new Error(payload.message || payload.suggestion || `CAW provision failed with HTTP ${resp.status}`)
  }
  return payload
}

export async function provisionCawPrincipal(
  state: AppState,
  options: ProvisionCawPrincipalOptions,
): Promise<ProvisionCawPrincipalResult> {
  const name = options.name.trim()
  if (!name) throw new Error('Agent name is required')

  const fetcher = options.fetcher ?? defaultFetcher
  const baseUrl = options.baseUrl ?? getCoboBasePath()
  const payload = await fetcher(joinApiPath(baseUrl, '/api/v1/principals/provision'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })

  if (payload.success === false) {
    throw new Error(payload.message || payload.suggestion || 'CAW Principal provision failed')
  }

  const agentId = payload.result?.agent_id
  const apiKey = payload.result?.api_key
  const status = payload.result?.status ?? 'unknown'
  if (!agentId || !apiKey) {
    throw new Error('CAW Principal provision response missing agent_id or api_key')
  }

  state.settings.agentId = agentId
  state.settings.coboApiKey = apiKey
  state.settings.apiKeyConfigured = true
  schedulePersistAppState(state)

  return { agentId, status }
}
