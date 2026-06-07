import type { DemoState, Pact } from '../../shared/types/demo'
import { getCoboApiKey } from './cobo-client'
import { refreshPactCredentialFromCobo, resolvePactExecutionApiKey } from './pact-credentials'

export async function resolveRedeemApiKey(state: DemoState, pact: Pact): Promise<string | null> {
  if (pact.status === 'active') {
    const cached = resolvePactExecutionApiKey(state, pact.id)
    if (cached) return cached
    try {
      return await refreshPactCredentialFromCobo(state, pact.id)
    } catch {
      return null
    }
  }

  if (pact.status === 'terminated' || pact.status === 'completed') {
    try {
      return getCoboApiKey(state)
    } catch {
      const env = process.env.AGENT_WALLET_API_KEY?.trim()
      return env || null
    }
  }

  return null
}
