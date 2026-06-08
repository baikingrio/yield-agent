import { BalanceApi, Configuration, IdentityApi, PactsApi, WalletsApi } from '@cobo/agentic-wallet'
import type { AppState } from '../../shared/types/app'
import { getCoboBasePath } from './cobo-config'

export class CoboNotConfiguredError extends Error {
  constructor() {
    super('COBO_NOT_CONFIGURED')
  }
}

export function getCoboApiKey(state: AppState): string {
  const key = state.settings.coboApiKey?.trim() || process.env.AGENT_WALLET_API_KEY?.trim()
  if (!key) throw new CoboNotConfiguredError()
  return key
}

export function isCoboConfigured(state: AppState): boolean {
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

function createConfiguration(state: AppState): Configuration {
  return new Configuration({
    apiKey: getCoboApiKey(state),
    basePath: getCoboBasePath(),
    baseOptions: {
      timeout: 60_000,
    },
  })
}

export function createCoboWalletsApi(state: AppState): WalletsApi {
  return new WalletsApi(createConfiguration(state))
}

export function createCoboBalanceApi(state: AppState): BalanceApi {
  return new BalanceApi(createConfiguration(state))
}

export function createCoboPactsApi(state: AppState): PactsApi {
  return new PactsApi(createConfiguration(state))
}

export function createCoboIdentityApi(basePath?: string): IdentityApi {
  return new IdentityApi(new Configuration({
    basePath: basePath ?? getCoboBasePath(),
    baseOptions: {
      timeout: 60_000,
    },
  }))
}

function humanizeCoboErrorMessage(message: string): string {
  const normalized = message.trim().toLowerCase()
  if (normalized === 'invalid_api_key' || normalized.includes('invalid api key')) {
    return 'Cobo API Key 无效或已过期。请在设置页更新 Key，或前往 Wallet 重新导入/创建 Agent Wallet 以同步最新凭证。'
  }
  if (normalized.includes('not authorized for this wallet')) {
    return '当前 API Key 无权为该 Agent Wallet 提交 Pact。请确认 Wallet 步骤 2 已完成配对，并使用对应 Agent 的 API Key。'
  }
  if (normalized.includes('recipe_slugs do not exist') || normalized.includes('recipe slug')) {
    return '关联的 Recipe slug 在 Cobo 环境中不存在。默认已省略占位 slug；若需绑定 Recipe，请在 .env 设置 CAW_PACT_RECIPE_SLUGS 为 Cobo 库中存在的 slug（逗号分隔）。'
  }
  if (normalized.includes('not found or not accessible') || normalized.includes('pact not found')) {
    return '无法以 Agent 身份撤销该 Pact。待审批 Pact 请使用「撤回提交」；生效中的 Pact 需由钱包主人在 Cobo Agentic Wallet App 内撤销。'
  }
  if (normalized.includes('validation error') || normalized.includes('pact policies only support effect')) {
    return 'Pact 策略格式不符合 Cobo 要求。请确认 token_in 使用 chain_id + token_id 对象，且策略仅使用 effect=allow（通过 deny_if 限制额度）。'
  }
  return message
}

export function isInvalidApiKeyError(err: unknown): boolean {
  const raw = extractRawCoboError(err).toLowerCase()
  return raw === 'invalid_api_key' || raw.includes('invalid api key')
}

function formatCoboValidationDetail(detail: unknown): string | null {
  if (!Array.isArray(detail) || detail.length === 0) return null
  const parts = detail
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const field = 'loc' in item && Array.isArray((item as { loc?: unknown }).loc)
        ? (item as { loc: unknown[] }).loc.at(-1)
        : null
      const msg = 'msg' in item ? String((item as { msg?: unknown }).msg ?? '') : ''
      if (!field || !msg) return msg || null
      return `${String(field)}: ${msg}`
    })
    .filter((part): part is string => Boolean(part))
  return parts.length ? parts.join('；') : null
}

function extractRawCoboError(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as {
      response?: {
        data?: {
          message?: string
          suggestion?: string
          error?: string | { reason?: string; detail?: unknown }
        }
      }
    }).response?.data
    if (typeof data?.error === 'string') return data.error
    if (data?.error && typeof data.error === 'object') {
      if (data.error.reason) return data.error.reason
      const validation = formatCoboValidationDetail(data.error.detail)
      if (validation) return validation
    }
    if (data?.message) return data.message
    if (data?.suggestion) return data.suggestion
  }
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
    return (err as { message: string }).message
  }
  return ''
}

export function extractCoboErrorMessage(err: unknown): string {
  if (err instanceof CoboNotConfiguredError) {
    return '请先在设置中配置 Cobo API Key，或设置 AGENT_WALLET_API_KEY 环境变量'
  }
  if (isTransientCoboNetworkError(err)) {
    return '连接 Cobo API 被中断（网络不稳定或 TSS Node 暂时不可达）。请确认 `caw node status` 显示 online 后重试「继续初始化」。'
  }
  const raw = extractRawCoboError(err)
  if (raw) return humanizeCoboErrorMessage(raw)
  return 'Cobo API 请求失败'
}
