import type {
  NetworkId,
  StrategyParseLimits,
  StrategyParseResponse,
  StrategyProposal,
} from '../../shared/types/app'
import { normalizeNumericField } from '../../shared/utils/numeric-field'
import { callHermesStrategyAgent } from './hermes-strategy-client'
import { normalizeStrategyProposal, validateStrategyPayload } from './strategy-validator'
import type { AppState } from '../../shared/types/app'

const SYSTEM_PROMPT = `You are YieldAgent strategy parser. Reply with JSON only, no markdown.
Schema:
{
  "network": "base-sepolia",
  "asset": "USDC",
  "targetApy": string optional,
  "riskLevel": "conservative" | "balanced" | "aggressive",
  "maxSpend": string,
  "agentFee": string,
  "userSplit": string,
  "explanation": string,
  "warnings": string[]
}

Rules:
- maxSpend is the TOTAL USDC cap for the entire Pact (not a daily limit).
- If the user gives a per-day amount and a duration (e.g. 1 USDC/day for one week), multiply them for maxSpend (e.g. 7).
- maxSpend must be between 1 and the provided availableUsdc.
- Buying/swapping into ETH or other assets implies riskLevel "aggressive" or "balanced", not conservative.`

function extractJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced?.[1]?.trim() || trimmed
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    return null
  }
}

function parseDurationDays(text: string): number | null {
  if (/一周|1\s*周|七天|7\s*天/.test(text)) return 7
  const dayMatch = text.match(/(\d+)\s*天/)
  if (dayMatch?.[1]) return Number(dayMatch[1])
  return null
}

function inferMaxSpendFromText(text: string): string | null {
  const dailyMatch =
    text.match(/每[日天][^。，,]*?(\d+(?:\.\d+)?)\s*USDC/i)
    || text.match(/每[日天][^。，,]*?最多\s*(\d+(?:\.\d+)?)\s*USDC/i)
  if (dailyMatch?.[1]) {
    const daily = Number(dailyMatch[1])
    const days = parseDurationDays(text) ?? 7
    if (!Number.isNaN(daily) && daily > 0 && days > 0) {
      return String(daily * days)
    }
  }

  const amount =
    text.match(/(\d+(?:\.\d+)?)\s*usdc/i)
    || text.match(/(\d+(?:\.\d+)?)\s*(?:枚|个)?\s*usdc?/i)
  return amount?.[1] ?? null
}

function fallbackRegexParse(text: string, limits: StrategyParseLimits): StrategyProposal | null {
  const lower = text.toLowerCase()
  const proposal: Partial<StrategyProposal> = {
    asset: 'USDC',
    network: limits.network,
    riskLevel: 'conservative',
    agentFee: '15',
    userSplit: '85',
  }

  if (lower.includes('aggressive') || lower.includes('激进')) proposal.riskLevel = 'aggressive'
  else if (lower.includes('balanced') || lower.includes('平衡')) proposal.riskLevel = 'balanced'
  else if (lower.includes('conservative') || lower.includes('保守')) proposal.riskLevel = 'conservative'
  else if (/买入\s*eth|买\s*eth|swap|兑换/i.test(text)) proposal.riskLevel = 'aggressive'

  const maxSpend = inferMaxSpendFromText(text)
  if (maxSpend) proposal.maxSpend = maxSpend

  const apy =
    text.match(/(\d+(?:\.\d+)?)\s*%?\s*apy/i)
    || text.match(/apy\s*(\d+)/i)
    || text.match(/目标\s*(\d+(?:\.\d+)?)\s*%/)
  if (apy?.[1]) proposal.targetApy = apy[1]


  return normalizeStrategyProposal(proposal, limits.network)
}

function validationOptions(limits: StrategyParseLimits) {
  return { availableUsdc: limits.availableUsdc }
}

function firstValidationError(
  state: AppState,
  proposal: StrategyProposal,
  limits: StrategyParseLimits,
): string | null {
  const validation = validateStrategyPayload(state, proposal, validationOptions(limits))
  if (validation.valid) return null
  return Object.values(validation.errors)[0] || '参数校验失败'
}

export async function parseStrategyNaturalLanguage(
  state: AppState,
  text: string,
  limits: StrategyParseLimits,
): Promise<StrategyParseResponse & { fallbackAvailable?: boolean }> {
  const trimmed = text.trim()
  if (!trimmed) {
    throw new Error('策略描述不能为空')
  }

  const endpoint = process.env.HERMES_API_URL?.trim()
  const apiKey = process.env.HERMES_API_KEY?.trim() || process.env.API_SERVER_KEY?.trim()

  if (!endpoint || !apiKey) {
    const proposal = fallbackRegexParse(trimmed, limits)
    if (!proposal) {
      const err = new Error('Hermes 未配置，且无法从描述中提取有效参数') as Error & { fallbackAvailable?: boolean }
      err.fallbackAvailable = true
      throw err
    }
    const validationError = firstValidationError(state, proposal, limits)
    if (validationError) throw new Error(validationError)
    return {
      proposal,
      explanation: '已使用本地规则解析（Hermes 未配置）。',
      warnings: ['Hermes API 未配置，建议配置后获得更准确的策略解析。'],
      fallbackAvailable: true,
    }
  }

  let hermesError: Error | null = null
  let hermesProposal: StrategyProposal | null = null
  let hermesExplanation = '已根据自然语言生成策略提案。'
  let hermesWarnings: string[] = []

  try {
    const result = await callHermesStrategyAgent({
      endpoint,
      apiKey,
      model: process.env.HERMES_STRATEGY_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Limits: network=${limits.network}, availableUsdc=${limits.availableUsdc}. Parse: ${trimmed}`,
        },
      ],
    })

    const parsed = extractJsonObject(result.content)
    if (!parsed) throw new Error('Hermes 返回的内容无法解析为 JSON')

    hermesProposal = normalizeStrategyProposal(
      {
        network: parsed.network as NetworkId,
        asset: String(parsed.asset ?? 'USDC'),
        targetApy: parsed.targetApy ? String(parsed.targetApy) : undefined,
        riskLevel: String(parsed.riskLevel ?? 'conservative'),
        maxSpend: normalizeNumericField(parsed.maxSpend as string | number | undefined, ''),
        agentFee: normalizeNumericField(parsed.agentFee as string | number | undefined, '15'),
        userSplit: normalizeNumericField(parsed.userSplit as string | number | undefined, '85'),
      },
      limits.network,
    )

    if (!hermesProposal) throw new Error('Hermes 未返回有效的 maxSpend')

    hermesExplanation = String(parsed.explanation ?? hermesExplanation)
    hermesWarnings = Array.isArray(parsed.warnings)
      ? parsed.warnings.map((item) => String(item))
      : []
  } catch (err) {
    hermesError = err instanceof Error ? err : new Error('Hermes 策略解析失败')
  }

  if (hermesProposal) {
    const validationError = firstValidationError(state, hermesProposal, limits)
    if (validationError) throw new Error(validationError)
    return {
      proposal: hermesProposal,
      explanation: hermesExplanation,
      warnings: hermesWarnings,
    }
  }

  const proposal = fallbackRegexParse(trimmed, limits)
  if (!proposal) {
    const err = hermesError ?? new Error('无法从描述中提取有效参数')
    ;(err as Error & { fallbackAvailable?: boolean }).fallbackAvailable = true
    throw err
  }

  const validationError = firstValidationError(state, proposal, limits)
  if (validationError) throw new Error(validationError)

  return {
    proposal,
    explanation: 'Hermes 调用失败，已回退到本地规则解析。',
    warnings: [hermesError?.message ?? 'Hermes 调用失败'],
    fallbackAvailable: true,
  }
}
