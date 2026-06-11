import {
  deletePactCredential,
  getPactCredential,
  storePactCredential,
} from '../db/repository'
import type { AppState, Pact } from '../../shared/types/app'
import { createCoboPactsApi, getCoboApiKey, preferEnvCoboApiKey } from './cobo-client'

export type ExecutionCredentialMode = 'principal' | 'pact-scoped'

export interface ExecutionCredentials {
  apiKey: string
  mode: ExecutionCredentialMode
}

export function resolveExecutionCredentials(state: AppState, pact: Pact): ExecutionCredentials | null {
  const pactKey = resolvePactExecutionApiKey(state, pact.id)
  if (pactKey) {
    return { apiKey: pactKey, mode: 'pact-scoped' }
  }

  try {
    return { apiKey: getCoboApiKey(state), mode: 'principal' }
  } catch {
    return null
  }
}

export function executionCredentialErrorMessage(
  state: AppState,
  pact: Pact,
): string {
  if (preferEnvCoboApiKey()) {
    return 'Vercel/Hermes 分体部署需配置 AGENT_WALLET_API_KEY（Hermes 上 caw wallet current --show-api-key 的 Agent 主 Key，不是 Pact 子 Key）'
  }
  if (pact.status === 'completed') {
    return 'Pact 已在 Cobo 侧完成，无法继续执行。请重新创建策略与 Pact。'
  }
  return '未找到 pact-scoped 执行凭证。请在 Cobo App 完成审批后，于 Pact 管理页点击「我已批准，刷新状态」再试。'
}

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
  const creds = resolveExecutionCredentials(state, pact)
  if (creds) return creds.apiKey

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
