import { BalanceApi, Configuration, WalletsApi } from '@cobo/agentic-wallet'
import type { DemoState } from '../../shared/types/demo'
import { getCoboBasePath } from './cobo-config'

export class CoboNotConfiguredError extends Error {
  constructor() {
    super('COBO_NOT_CONFIGURED')
  }
}

export function getCoboApiKey(state: DemoState): string {
  const key = state.settings.coboApiKey?.trim() || process.env.AGENT_WALLET_API_KEY?.trim()
  if (!key) throw new CoboNotConfiguredError()
  return key
}

export function isCoboConfigured(state: DemoState): boolean {
  try {
    getCoboApiKey(state)
    return true
  } catch {
    return false
  }
}

function createConfiguration(state: DemoState): Configuration {
  return new Configuration({
    apiKey: getCoboApiKey(state),
    basePath: getCoboBasePath(),
  })
}

export function createCoboWalletsApi(state: DemoState): WalletsApi {
  return new WalletsApi(createConfiguration(state))
}

export function createCoboBalanceApi(state: DemoState): BalanceApi {
  return new BalanceApi(createConfiguration(state))
}

export function extractCoboErrorMessage(err: unknown): string {
  if (err instanceof CoboNotConfiguredError) {
    return '请先在设置中配置 Cobo API Key，或设置 AGENT_WALLET_API_KEY 环境变量'
  }
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as {
      response?: { data?: { message?: string; error?: { reason?: string } } }
    }).response?.data
    if (data?.message) return data.message
    if (data?.error?.reason) return data.error.reason
  }
  if (err instanceof Error && err.message) return err.message
  return 'Cobo API 请求失败'
}
