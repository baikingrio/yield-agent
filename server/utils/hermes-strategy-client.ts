import type { HermesStrategyPingResult, StrategyAgentReadiness } from '../../shared/types/app'

interface HermesStrategyEnv {
  HERMES_API_URL?: string
  HERMES_API_KEY?: string
  API_SERVER_KEY?: string
  HERMES_STRATEGY_MODEL?: string
}

interface HermesChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface HermesChatResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  error?: {
    message?: string
  }
}

type HermesFetcher = (url: string, init: {
  method: 'POST'
  headers: Record<string, string>
  body: string
}) => Promise<{
  ok: boolean
  status: number
  json: () => Promise<HermesChatResponse>
}>

export interface HermesStrategyCallOptions {
  endpoint: string
  apiKey?: string
  model?: string | null
  messages: HermesChatMessage[]
  fetcher?: HermesFetcher
}

export interface HermesStrategyCallResult {
  ok: boolean
  endpoint: string
  model: string
  content: string
}

export interface HermesStrategyPingOptions {
  env?: HermesStrategyEnv
  fetcher?: HermesFetcher
}

function normalizeBaseUrl(endpoint: string): string {
  const trimmed = endpoint.trim().replace(/\/+$/, '')
  if (!trimmed) throw new Error('Hermes API URL is required')
  return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`
}

function authKey(env: HermesStrategyEnv): string | undefined {
  return env.HERMES_API_KEY?.trim() || env.API_SERVER_KEY?.trim() || undefined
}

export function buildHermesStrategyHeaders(apiKey?: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
  }
}

export function buildHermesStrategyReadinessEnv(env: HermesStrategyEnv = process.env): Pick<StrategyAgentReadiness, 'remoteCallable' | 'deploymentReady' | 'missing'> {
  const missing: string[] = []
  if (!env.HERMES_API_URL?.trim()) missing.push('Hermes API URL')
  if (!authKey(env)) missing.push('Hermes API Key')
  const remoteCallable = missing.length === 0
  return { remoteCallable, deploymentReady: remoteCallable, missing }
}

export async function callHermesStrategyAgent(options: HermesStrategyCallOptions): Promise<HermesStrategyCallResult> {
  const baseUrl = normalizeBaseUrl(options.endpoint)
  const model = options.model?.trim() || 'hermes-agent'
  const fetcher = options.fetcher ?? fetch
  const resp = await fetcher(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: buildHermesStrategyHeaders(options.apiKey),
    body: JSON.stringify({
      model,
      messages: options.messages,
      stream: false,
    }),
  })
  const payload = await resp.json().catch(() => ({}))
  if (!resp.ok) {
    throw new Error(payload.error?.message || `Hermes API call failed with HTTP ${resp.status}`)
  }
  const content = payload.choices?.[0]?.message?.content?.trim()
  if (!content) throw new Error('Hermes API response missing assistant content')
  return {
    ok: true,
    endpoint: baseUrl,
    model,
    content,
  }
}

export async function pingHermesStrategyAgent(options: HermesStrategyPingOptions = {}): Promise<HermesStrategyPingResult> {
  const env = options.env ?? process.env
  const endpoint = env.HERMES_API_URL?.trim()
  if (!endpoint) throw new Error('Hermes API URL is required')

  const result = await callHermesStrategyAgent({
    endpoint,
    apiKey: authKey(env),
    model: env.HERMES_STRATEGY_MODEL,
    fetcher: options.fetcher,
    messages: [
      {
        role: 'system',
        content: 'You are the Hermes strategy runtime for YieldAgent. Reply with a short JSON object only.',
      },
      {
        role: 'user',
        content: 'Return {"status":"ok","purpose":"strategy-runtime"}.',
      },
    ],
  })

  return {
    ok: result.ok,
    endpoint: result.endpoint,
    model: result.model,
    contentPreview: result.content.slice(0, 240),
  }
}
