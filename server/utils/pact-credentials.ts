import {
  deletePactCredential,
  getPactCredential,
  storePactCredential,
} from '../db/repository'
import type { DemoState } from '../../shared/types/demo'
import { createCoboPactsApi } from './cobo-client'

export function cachePactCredentialFromCobo(
  state: DemoState,
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
  state: DemoState,
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

export function resolvePactExecutionApiKey(state: DemoState, pactId: string): string | null {
  return getPactCredential(pactId)
}

export function revokeStoredPactCredential(pactId: string): void {
  deletePactCredential(pactId)
}
