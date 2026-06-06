import { BalanceApi, Configuration, PactsApi, WalletsApi } from '@cobo/agentic-wallet'
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

const TRANSIENT_NETWORK_ERROR_CODES = new Set([
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNABORTED',
  'ENOTFOUND',
  'EAI_AGAIN',
])

export function isTransientCoboNetworkError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const code = 'code' in err ? String((err as { code?: unknown }).code) : ''
  if (TRANSIENT_NETWORK_ERROR_CODES.has(code)) return true
  const message = err instanceof Error ? err.message : String(err)
  return /ECONNRESET|ETIMEDOUT|ECONNABORTED|socket hang up|network error/i.test(message)
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function withCoboRetry<T>(
  operation: () => Promise<T>,
  options: { maxAttempts?: number; baseDelayMs?: number } = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3
  const baseDelayMs = options.baseDelayMs ?? 1000
  let lastErr: unknown

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await operation()
    } catch (err) {
      lastErr = err
      const canRetry = isTransientCoboNetworkError(err) && attempt < maxAttempts - 1
      if (!canRetry) throw err
      await sleep(baseDelayMs * (attempt + 1))
    }
  }

  throw lastErr
}

function createConfiguration(state: DemoState): Configuration {
  return new Configuration({
    apiKey: getCoboApiKey(state),
    basePath: getCoboBasePath(),
    baseOptions: {
      timeout: 60_000,
    },
  })
}

export function createCoboWalletsApi(state: DemoState): WalletsApi {
  return new WalletsApi(createConfiguration(state))
}

export function createCoboBalanceApi(state: DemoState): BalanceApi {
  return new BalanceApi(createConfiguration(state))
}

export function createCoboPactsApi(state: DemoState): PactsApi {
  return new PactsApi(createConfiguration(state))
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
  if (isTransientCoboNetworkError(err)) {
    return '连接 Cobo API 被中断（网络不稳定或 TSS Node 暂时不可达）。请确认 `caw node status` 显示 online 后重试「继续初始化」。'
  }
  if (err instanceof Error && err.message) return err.message
  return 'Cobo API 请求失败'
}
