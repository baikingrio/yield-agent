import type { DemoState } from '../../shared/types/demo'
import { runCawJson, type CawCliRunner } from './caw-wallet-bootstrap'
import { schedulePersistDemoState } from './demo-state-persistence'

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export async function refreshApiKeyFromCli(
  state: DemoState,
  options: { force?: boolean; runner?: CawCliRunner } = {},
): Promise<boolean> {
  const existing = state.settings.coboApiKey?.trim() || process.env.AGENT_WALLET_API_KEY?.trim()
  if (existing && !options.force) return true

  try {
    const wallet = await runCawJson(['wallet', 'current', '--show-api-key'], options.runner)
    if (Array.isArray(wallet)) return false
    const apiKey = str(wallet.api_key)
    const agentId = str(wallet.agent_id)
    if (!apiKey) return false
    state.settings.coboApiKey = apiKey
    state.settings.apiKeyConfigured = true
    if (agentId) state.settings.agentId = agentId
    schedulePersistDemoState(state)
    return true
  } catch {
    return false
  }
}
