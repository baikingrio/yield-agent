import type { AppState } from '../../shared/types/app'
import { schedulePersistAppState } from './app-state-persistence'
import { provisionCawPrincipal } from './caw-provision'
import {
  defaultCawRunner,
  runCawJson,
  str,
  type CawCliRunner,
} from './caw-cli'

export const AGENT_WALLET_API_KEY_REQUIRED = 'AGENT_WALLET_API_KEY_REQUIRED'

function currentCoboApiKey(state: AppState): string | null {
  return state.settings.coboApiKey?.trim() || process.env.AGENT_WALLET_API_KEY?.trim() || null
}

function isSplitDeployRuntime(): boolean {
  return process.env.AGENT_WALLET_TSS_RUNTIME === 'hermes-agent-host'
    || process.env.VERCEL === '1'
}

export async function syncCredentialsFromCli(
  state: AppState,
  runner: CawCliRunner = defaultCawRunner,
): Promise<boolean> {
  if (currentCoboApiKey(state)) return true
  try {
    const wallet = await runCawJson(['wallet', 'current', '--show-api-key'], runner)
    if (Array.isArray(wallet)) return false
    const apiKey = str(wallet.api_key)
    const agentId = str(wallet.agent_id)
    if (!apiKey) return false
    state.settings.coboApiKey = apiKey
    state.settings.apiKeyConfigured = true
    if (agentId) state.settings.agentId = agentId
    schedulePersistAppState(state)
    return true
  } catch {
    return false
  }
}

export async function ensureCawCredentials(state: AppState): Promise<void> {
  if (currentCoboApiKey(state)) return
  if (await syncCredentialsFromCli(state)) return
  if (state.settings.agentId) return
  if (isSplitDeployRuntime()) {
    throw new Error(AGENT_WALLET_API_KEY_REQUIRED)
  }
  await provisionCawPrincipal(state, { name: 'YieldAgent Dev' })
}
