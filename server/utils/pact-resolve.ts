import type { AppState, Pact } from '../../shared/types/app'
import { CoboNotConfiguredError } from './cobo-client'
import { ensureCoboPactInState } from './cobo-pact-import'
import { findPactById } from './pact-lookup'

export async function resolvePactById(
  state: AppState,
  id: string,
  options?: { importFromCobo?: boolean },
): Promise<Pact | undefined> {
  const existing = findPactById(state, id)
  if (existing) return existing
  if (!options?.importFromCobo) return undefined
  return ensureCoboPactInState(state, id)
}

export function pactResolveHttpError(err: unknown): { statusCode: number, error: string } | null {
  if (err instanceof CoboNotConfiguredError) {
    return {
      statusCode: 400,
      error: '请配置 AGENT_WALLET_API_KEY 以从 Cobo 同步 Pact',
    }
  }
  return null
}
