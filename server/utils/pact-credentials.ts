import {
  deletePactCredential,
  getPactCredential,
  storePactCredential,
} from '../db/repository'
import type { AppState, Pact } from '../../shared/types/app'
import { createCoboPactsApi, getCoboApiKey } from './cobo-client'

export function cachePactCredentialFromCobo(
  state: AppState,
  pactId: string,
  coboPactId: string,
  apiKey?: string,
): boolean {
  if (apiKey?.trim()) {
    storePactCredential(pactId, apiKey.trim())
    const pact = state.pacts.find((item) => item.id === pactId || item.coboPactId === coboPactId)
    if (pact) pact.executionCredentialStored = true
    return true
  }
  return false
}

export async function refreshPactCredentialFromCobo(
  state: AppState,
  pactId: string,
): Promise<string | null> {
  const pact = state.pacts.find((item) => item.id === pactId || item.coboPactId === pactId)
  if (!pact?.coboPactId && !pact?.id) return null

  const coboPactId = pact.coboPactId || pact.id
  const pactsApi = createCoboPactsApi(state)
  const resp = await pactsApi.getPact(coboPactId)
  const apiKey = resp.data.result?.api_key
  if (cachePactCredentialFromCobo(state, pact.id, coboPactId, apiKey)) {
    return apiKey!.trim()
  }
  return getPactCredential(pact.id)
}

export function resolvePactExecutionApiKey(state: AppState, pactId: string): string | null {
  return getPactCredential(pactId)
}

export function revokeStoredPactCredential(pactId: string): void {
  deletePactCredential(pactId)
}

export async function resolveRedeemApiKey(state: AppState, pact: Pact): Promise<string | null> {
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
