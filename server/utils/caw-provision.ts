import type { IdentityApi } from '@cobo/agentic-wallet'
import type { AppState } from '../../shared/types/app'
import { createCoboIdentityApi, extractCoboErrorMessage } from './cobo-client'
import { schedulePersistAppState } from './app-state-persistence'

export interface ProvisionCawPrincipalOptions {
  name: string
  baseUrl?: string
  identityApi?: Pick<IdentityApi, 'provisionAgent'>
}

export interface ProvisionCawPrincipalResult {
  agentId: string
  status: string
}

export async function provisionCawPrincipal(
  state: AppState,
  options: ProvisionCawPrincipalOptions,
): Promise<ProvisionCawPrincipalResult> {
  const name = options.name.trim()
  if (!name) throw new Error('Agent name is required')

  const identityApi = options.identityApi ?? createCoboIdentityApi(options.baseUrl)

  try {
    const resp = await identityApi.provisionAgent({ name })
    const payload = resp.data

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
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('CAW Principal provision')) {
      throw err
    }
    throw new Error(extractCoboErrorMessage(err))
  }
}
