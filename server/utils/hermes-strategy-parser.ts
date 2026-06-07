import type { NetworkId, StrategyParseLimits, StrategyParseResponse, StrategyProposal } from '../../shared/types/demo'
import { callHermesStrategyAgent } from './hermes-strategy-client'
import { normalizeStrategyProposal, validateStrategyPayload } from './strategy-validator'
import type { DemoState } from '../../shared/types/demo'

const SYSTEM_PROMPT = `You are YieldAgent strategy parser. Reply with JSON only, no markdown.
Schema:
{
  "network": "base-sepolia" | "arbitrum-sepolia",
  "asset": "USDC",
  "targetApy": string optional,
  "riskLevel": "conservative" | "balanced" | "aggressive",
  "maxSpend": string,
  "agentFee": string,
  "userSplit": string,
  "explanation": string,
  "warnings": string[]
}`

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

  const amount = text.match(/(\d+)\s*usdc/i) || text.match(/(\d+)\s*(?:枚|个)?\s*usdc?/i)
  if (amount?.[1]) proposal.maxSpend = amount[1]

  const apy =
    text.match(/(\d+(?:\.\d+)?)\s*%?\s*apy/i)
    || text.match(/apy\s*(\d+)/i)
    || text.match(/目标\s*(\d+(?:\.\d+)?)\s*%/)
  if (apy?.[1]) proposal.targetApy = apy[1]

  if (lower.includes('arbitrum') || lower.includes('仲裁')) proposal.network = 'arbitrum-sepolia'
  if (lower.includes('base') || lower.includes('基地')) proposal.network = 'base-sepolia'

  return normalizeStrategyProposal(proposal, limits.network)
}

export async function parseStrategyNaturalLanguage(
  state: DemoState,
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
    const validation = validateStrategyPayload(state, proposal)
    if (!validation.valid) {
      const first = Object.values(validation.errors)[0] || '参数校验失败'
      throw new Error(first)
    }
    return {
      proposal,
      explanation: '已使用本地规则解析（Hermes 未配置）。',
      warnings: ['Hermes API 未配置，建议配置后获得更准确的策略解析。'],
      fallbackAvailable: true,
    }
  }

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

    const proposal = normalizeStrategyProposal(
      {
        network: parsed.network as NetworkId,
        asset: String(parsed.asset ?? 'USDC'),
        targetApy: parsed.targetApy ? String(parsed.targetApy) : undefined,
        riskLevel: String(parsed.riskLevel ?? 'conservative'),
        maxSpend: String(parsed.maxSpend ?? ''),
        agentFee: String(parsed.agentFee ?? '15'),
        userSplit: String(parsed.userSplit ?? '85'),
      },
      limits.network,
    )

    if (!proposal) throw new Error('Hermes 未返回有效的 maxSpend')

    const validation = validateStrategyPayload(state, proposal)
    if (!validation.valid) {
      const first = Object.values(validation.errors)[0] || '参数校验失败'
      throw new Error(first)
    }

    return {
      proposal,
      explanation: String(parsed.explanation ?? '已根据自然语言生成策略提案。'),
      warnings: Array.isArray(parsed.warnings)
        ? parsed.warnings.map((item) => String(item))
        : [],
    }
  } catch (err) {
    const proposal = fallbackRegexParse(trimmed, limits)
    if (proposal) {
      const validation = validateStrategyPayload(state, proposal)
      if (validation.valid) {
        return {
          proposal,
          explanation: 'Hermes 调用失败，已回退到本地规则解析。',
          warnings: [err instanceof Error ? err.message : 'Hermes 调用失败'],
          fallbackAvailable: true,
        }
      }
    }
    const error = err instanceof Error ? err : new Error('Hermes 策略解析失败')
    ;(error as Error & { fallbackAvailable?: boolean }).fallbackAvailable = true
    throw error
  }
}
