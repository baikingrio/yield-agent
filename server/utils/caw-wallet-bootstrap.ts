import { execFile } from 'node:child_process'
import { access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { promisify } from 'node:util'
import type {
  AgentBootstrapMode,
  AgentBootstrapPhase,
  AgentBootstrapState,
  AgentBootstrapStatusResponse,
  AppState,
  WalletPreparation,
} from '../../shared/types/app'
import { getCoboBasePath, getNetworkChainConfig } from './cobo-config'
import {
  createCoboWalletsApi,
  isTransientCoboNetworkError,
  withCoboRetry,
} from './cobo-client'
import { runCawOnboardStep } from './caw-onboard'
import { provisionCawPrincipal } from './caw-provision'
import { schedulePersistAppState } from './app-state-persistence'
import {
  markAgentWalletCreated,
  markAgentWalletPreparing,
  touchPreparation,
} from './wallet-preparation'

const execFileAsync = promisify(execFile)

export interface CawCliRunner {
  (args: string[]): Promise<{ stdout: string; stderr?: string }>
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function bool(value: unknown): boolean {
  return value === true
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function defaultBootstrapState(): AgentBootstrapState {
  return {
    mode: null,
    phase: 'idle',
    sessionId: null,
    walletStatus: null,
    tssOnline: null,
    message: null,
  }
}

function getBootstrapState(prep: WalletPreparation): AgentBootstrapState {
  return prep.agentBootstrap ?? defaultBootstrapState()
}

function setBootstrapState(state: AppState, patch: Partial<AgentBootstrapState>): AgentBootstrapState {
  const prep = state.walletPreparation
  const next = { ...getBootstrapState(prep), ...patch }
  prep.agentBootstrap = next
  touchPreparation(prep, state)
  return next
}

function isBootstrapDone(prep: WalletPreparation): boolean {
  return prep.steps.agent_wallet === 'completed'
    && prep.agentWallet.created
    && prep.agentWallet.pairing?.status === 'paired'
}

type PairingInfo = {
  status: 'unpaired' | 'pairing' | 'paired'
  code: string | null
  expiresAt: string | null
}

export async function resolveCawCliBin(): Promise<string | null> {
  const configured = process.env.CAW_CLI_BIN?.trim()
  if (configured) {
    try {
      await access(configured, constants.X_OK)
      return configured
    } catch {
      return null
    }
  }
  try {
    const { stdout } = await execFileAsync('which', ['caw'])
    return stdout.trim() || null
  } catch {
    return null
  }
}

async function defaultCawRunner(args: string[]): Promise<{ stdout: string; stderr?: string }> {
  const cawBin = await resolveCawCliBin()
  if (!cawBin) throw new Error('CAW_CLI_NOT_FOUND')
  const { stdout, stderr } = await execFileAsync(cawBin, args, {
    timeout: 120_000,
    maxBuffer: 1024 * 1024,
    env: {
      ...process.env,
      PATH: `/usr/local/bin:${process.env.PATH ?? ''}`,
    },
  })
  return { stdout, stderr }
}

export async function runCawJson(
  args: string[],
  runner: CawCliRunner = defaultCawRunner,
): Promise<Record<string, unknown> | unknown[]> {
  const { stdout } = await runner(args)
  const parsed = JSON.parse(stdout || '{}')
  if (Array.isArray(parsed)) return parsed
  return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {}
}

async function runCawJsonBestEffort(
  args: string[],
  runner: CawCliRunner = defaultCawRunner,
): Promise<Record<string, unknown> | unknown[]> {
  try {
    return await runCawJson(args, runner)
  } catch (err) {
    const stdout = err && typeof err === 'object' && 'stdout' in err
      ? (err as { stdout?: unknown }).stdout
      : null
    if (typeof stdout === 'string' && stdout.trim()) {
      const parsed = JSON.parse(stdout)
      if (Array.isArray(parsed)) return parsed
      return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {}
    }
    throw err
  }
}

export async function detectBootstrapMode(
  runner: CawCliRunner = defaultCawRunner,
): Promise<AgentBootstrapMode | 'unavailable'> {
  const cawBin = await resolveCawCliBin()
  if (cawBin) {
    try {
      const health = await runCawJson(['node', 'health'], runner)
      if (bool((health as Record<string, unknown>).healthy)) {
        return 'cli-onboard'
      }
    } catch {
      // Fall through to SDK mode when local TSS is not healthy.
    }
  }

  const mainNodeId = process.env.AGENT_WALLET_MAIN_NODE_ID?.trim()
  if (mainNodeId) return 'sdk-create'
  return 'unavailable'
}

export async function checkTssReadiness(
  state: AppState,
  walletId?: string | null,
  runner: CawCliRunner = defaultCawRunner,
): Promise<{ online: boolean; nodeId: string | null; source: 'cli-local' | 'sdk-remote' | 'none'; message: string }> {
  const cawBin = await resolveCawCliBin()
  if (cawBin) {
    try {
      const status = await runCawJsonBestEffort(['node', 'status'], runner) as Record<string, unknown>
      const remote = status.remote as Record<string, unknown> | undefined
      const local = status.local as Record<string, unknown> | undefined
      const online = bool(remote?.online) || bool(local?.running)
      return {
        online,
        nodeId: str(remote?.tss_node_id),
        source: 'cli-local',
        message: online ? 'TSS Node 在线' : 'TSS Node 未在线，请运行 caw node start',
      }
    } catch {
      // Fall through to SDK remote check.
    }
  }

  const targetWalletId = walletId ?? state.walletPreparation.agentWallet.coboWalletId
  if (targetWalletId && state.settings.coboApiKey?.trim()) {
    try {
      const walletsApi = createCoboWalletsApi(state)
      const nodeResp = await withCoboRetry(() => walletsApi.getWalletNodeStatus(targetWalletId))
      const online = nodeResp.data.result?.online === true
      return {
        online,
        nodeId: str(nodeResp.data.result?.tss_node_id) ?? process.env.AGENT_WALLET_MAIN_NODE_ID?.trim() ?? null,
        source: 'sdk-remote',
        message: online ? '远程 TSS Node 在线' : '远程 TSS Node 未在线',
      }
    } catch {
      return {
        online: false,
        nodeId: process.env.AGENT_WALLET_MAIN_NODE_ID?.trim() ?? null,
        source: 'sdk-remote',
        message: '无法查询远程 TSS Node 状态',
      }
    }
  }

  return {
    online: false,
    nodeId: process.env.AGENT_WALLET_MAIN_NODE_ID?.trim() ?? null,
    source: 'none',
    message: '请先配置 TSS Node 或完成 CAW onboard',
  }
}

function currentCoboApiKey(state: AppState): string | null {
  return state.settings.coboApiKey?.trim() || process.env.AGENT_WALLET_API_KEY?.trim() || null
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
  await provisionCawPrincipal(state, { name: 'YieldAgent Dev' })
}

interface PairInitiateResponse {
  success?: boolean
  message?: string
  suggestion?: string
  result?: {
    token?: string
    expires_at?: string
    expire_at?: string
    expired_at?: string
  }
}

async function initiateWalletPairingApi(
  state: AppState,
  walletId: string,
): Promise<{ status: 'pairing'; code: string | null; expiresAt: string | null } | undefined> {
  const apiKey = currentCoboApiKey(state)
  if (!apiKey) return undefined

  const { resp, payload } = await withCoboRetry(async () => {
    const response = await fetch(`${getCoboBasePath()}/api/v1/wallets/pairs/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({ wallet_id: walletId }),
    })
    const body = await response.json().catch(() => ({})) as PairInitiateResponse
    return { resp: response, payload: body }
  })

  if (!resp.ok || payload.success === false) {
    throw new Error(payload.message || payload.suggestion || `CAW wallet pairing failed with HTTP ${resp.status}`)
  }

  return {
    status: 'pairing',
    code: payload.result?.token ?? null,
    expiresAt: payload.result?.expires_at ?? payload.result?.expire_at ?? payload.result?.expired_at ?? null,
  }
}

async function initiateWalletPairingCli(
  runner: CawCliRunner,
): Promise<{ status: 'pairing'; code: string | null; expiresAt: string | null } | undefined> {
  try {
    const payload = await runCawJson(['wallet', 'pair', '--code-only'], runner)
    if (Array.isArray(payload)) return undefined
    const code = str(payload.token) ?? str(payload.code) ?? str(payload.pairing_code)
    return {
      status: 'pairing',
      code,
      expiresAt: str(payload.expires_at) ?? str(payload.expire_at) ?? null,
    }
  } catch {
    return undefined
  }
}

export function parsePairStatusPayload(
  payload: Record<string, unknown>,
): 'paired' | 'pairing' | 'unpaired' {
  const tokenStatus = str(payload.token_status)?.toLowerCase()
  if (tokenStatus === 'completed') return 'paired'

  if (payload.paired === true || payload.wallet_paired === true) return 'paired'

  const status = str(payload.status)?.toLowerCase() ?? str(payload.pair_status)?.toLowerCase()
  if (status === 'paired' || status === 'completed') return 'paired'
  if (status === 'pairing' || status === 'pending' || status === 'active') return 'pairing'

  if (tokenStatus === 'pending' || tokenStatus === 'active') return 'pairing'
  if (str(payload.token) || str(payload.code) || str(payload.pairing_code)) return 'pairing'

  return 'unpaired'
}

async function pollPairStatusCli(
  runner: CawCliRunner,
): Promise<'paired' | 'pairing' | 'unpaired'> {
  try {
    const payload = await runCawJson(['wallet', 'pair-status'], runner)
    if (Array.isArray(payload)) return 'unpaired'
    return parsePairStatusPayload(payload as Record<string, unknown>)
  } catch {
    return 'unpaired'
  }
}

async function pollPairStatusApi(
  state: AppState,
  walletId: string,
): Promise<'paired' | 'pairing' | 'unpaired'> {
  const apiKey = currentCoboApiKey(state)
  if (!apiKey) return 'unpaired'

  try {
    const { resp, payload } = await withCoboRetry(async () => {
      const response = await fetch(`${getCoboBasePath()}/api/v1/wallets/pairs/info/${walletId}`, {
        headers: { 'X-API-Key': apiKey },
      })
      const body = await response.json().catch(() => ({})) as Record<string, unknown>
      return { resp: response, payload: body }
    })
    if (!resp.ok) return 'unpaired'

    const result = (payload.result ?? payload) as Record<string, unknown>
    return parsePairStatusPayload(result)
  } catch {
    return 'unpaired'
  }
}

async function pollPairStatus(
  state: AppState,
  walletId: string,
  runner: CawCliRunner = defaultCawRunner,
): Promise<'paired' | 'pairing' | 'unpaired'> {
  const mode = getBootstrapState(state.walletPreparation).mode
  if (mode === 'cli-onboard') {
    const cliStatus = await pollPairStatusCli(runner)
    if (cliStatus !== 'unpaired') return cliStatus
  }
  return pollPairStatusApi(state, walletId)
}

async function resolvePairingStatus(
  state: AppState,
  walletUuid: string,
  runner: CawCliRunner = defaultCawRunner,
): Promise<PairingInfo> {
  const prep = state.walletPreparation
  const pairStatus = await pollPairStatus(state, walletUuid, runner)
  if (pairStatus === 'paired') {
    return { status: 'paired', code: null, expiresAt: null }
  }

  const existing = prep.agentWallet.pairing
  if (existing?.status === 'pairing' && existing.code) {
    return existing
  }

  const mode = getBootstrapState(prep).mode
  const initiated = mode === 'cli-onboard'
    ? await initiateWalletPairingCli(runner) ?? await initiateWalletPairingApi(state, walletUuid)
    : await initiateWalletPairingApi(state, walletUuid)

  return initiated ?? { status: 'unpaired', code: null, expiresAt: null }
}

async function pollPairingForReadyWallet(state: AppState): Promise<AgentBootstrapStatusResponse> {
  const prep = state.walletPreparation
  const walletUuid = prep.agentWallet.coboWalletId
  const address = prep.agentWallet.address
  if (!walletUuid || !address) {
    return buildStatusResponse(state, false)
  }

  const pairing = await resolvePairingStatus(state, walletUuid)
  if (pairing.status === 'paired') {
    setBootstrapState(state, { phase: 'paired', message: 'CAW App 配对已完成' })
  } else if (pairing.status === 'pairing') {
    setBootstrapState(state, { phase: 'pairing', message: '请在 CAW App 输入配对码' })
  } else {
    setBootstrapState(state, { phase: 'active', message: '钱包已 active，可生成配对码' })
  }

  markAgentWalletCreated(state, { address, coboWalletId: walletUuid, pairing })
  return buildStatusResponse(state, pairing.status === 'paired')
}

async function resolveEvmAddressFromCli(
  state: AppState,
  walletUuid: string,
  runner: CawCliRunner,
): Promise<string | null> {
  const networkConfig = getNetworkChainConfig(state.walletPreparation.network)
  try {
    const payload = await runCawJson(['address', 'list'], runner)
    if (!Array.isArray(payload)) return null
    const match = payload.find((item) => {
      if (!item || typeof item !== 'object') return false
      const obj = item as Record<string, unknown>
      const compatibleChains = obj.compatible_chains
      return (
        str(obj.wallet_id) === walletUuid
        && str(obj.address)
        && (
          (isStringArray(compatibleChains) && compatibleChains.includes(networkConfig.coboChainId))
          || str(obj.chain_type) === 'ETH'
        )
      )
    }) as Record<string, unknown> | undefined
    return str(match?.address) ?? null
  } catch {
    return null
  }
}

async function resolveEvmAddressFromSdk(
  state: AppState,
  walletUuid: string,
): Promise<string | null> {
  const networkConfig = getNetworkChainConfig(state.walletPreparation.network)
  const walletsApi = createCoboWalletsApi(state)
  try {
    const addrResp = await withCoboRetry(() => walletsApi.createWalletAddress(walletUuid, {
      chain_id: networkConfig.coboChainId,
    }))
    const created = addrResp.data.result?.address
    if (created) return created
  } catch {
    // Fall back to list.
  }
  try {
    const listResp = await withCoboRetry(() => walletsApi.listWalletAddresses(walletUuid))
    const addresses = listResp.data.result ?? []
    const match = addresses.find((item) =>
      item.compatible_chains?.includes(networkConfig.coboChainId)
      || item.chain_type === 'ETH',
    )
    return match?.address ?? addresses[0]?.address ?? null
  } catch {
    return null
  }
}

async function getWalletStatusFromSdk(state: AppState, walletUuid: string): Promise<string | null> {
  try {
    const walletsApi = createCoboWalletsApi(state)
    const detail = (await withCoboRetry(() => walletsApi.getWallet(walletUuid))).data.result
    return detail.status ?? null
  } catch {
    return null
  }
}

function rememberPendingAgentWallet(state: AppState, walletUuid: string): void {
  const prep = state.walletPreparation
  prep.agentWallet.coboWalletId = walletUuid
  touchPreparation(prep, state)
}

async function bootstrapViaSdkCreate(state: AppState): Promise<void> {
  const prep = state.walletPreparation
  if (prep.agentWallet.coboWalletId) return

  await ensureCawCredentials(state)
  const walletsApi = createCoboWalletsApi(state)
  const mainNodeId = process.env.AGENT_WALLET_MAIN_NODE_ID?.trim()
  const createResp = await withCoboRetry(() => walletsApi.createWallet({
    wallet_type: 'MPC',
    name: `YieldAgent-${Date.now()}`,
    group_type: 'agent',
    ...(mainNodeId ? { main_node_id: mainNodeId } : {}),
  }))
  rememberPendingAgentWallet(state, createResp.data.result.uuid)
}

async function bootstrapViaCliOnboardStep(state: AppState): Promise<void> {
  const prep = state.walletPreparation
  const bootstrap = getBootstrapState(prep)
  const result = await runCawOnboardStep({
    agentName: 'YieldAgent',
    sessionId: bootstrap.sessionId ?? undefined,
  })
  setBootstrapState(state, {
    sessionId: result.sessionId,
    walletStatus: result.walletStatus,
    phase: result.phase === 'active' ? 'active' : 'bootstrapping',
    message: result.nextAction ?? result.lastError,
  })
  if (result.agentId) state.settings.agentId = result.agentId
  await syncCredentialsFromCli(state)
  if (result.walletUuid) {
    prep.agentWallet.coboWalletId = result.walletUuid
    touchPreparation(prep, state)
  }
}

export async function syncPreparationFromCawCli(
  state: AppState,
  runner: CawCliRunner = defaultCawRunner,
): Promise<WalletPreparation> {
  const prep = state.walletPreparation
  await syncCredentialsFromCli(state, runner)

  const walletPayload = await runCawJson(['wallet', 'current'], runner)
  if (Array.isArray(walletPayload)) throw new Error('CAW_CURRENT_WALLET_NOT_FOUND')

  const walletUuid = str(walletPayload.wallet_uuid)
  if (!walletUuid) throw new Error('CAW_CURRENT_WALLET_NOT_FOUND')

  const walletStatus = str(walletPayload.status) ?? 'active'
  const address = await resolveEvmAddressFromCli(state, walletUuid, runner)
  if (!address) throw new Error('CAW_ADDRESS_NOT_FOUND')

  setBootstrapState(state, {
    mode: 'cli-onboard',
    phase: walletStatus === 'active' ? 'active' : 'bootstrapping',
    walletStatus,
    message: '已从 CAW CLI 导入 onboard 钱包',
  })

  let pairing: PairingInfo | undefined
  if (walletStatus === 'active') {
    pairing = await resolvePairingStatus(state, walletUuid, runner)
  }

  return markAgentWalletCreated(state, {
    address,
    coboWalletId: walletUuid,
    pairing,
  })
}

function buildStatusResponse(state: AppState, done?: boolean): AgentBootstrapStatusResponse {
  const prep = state.walletPreparation
  return {
    preparation: prep,
    bootstrap: getBootstrapState(prep),
    done: done ?? isBootstrapDone(prep),
  }
}

export async function startAgentBootstrap(state: AppState): Promise<AgentBootstrapStatusResponse> {
  const prep = state.walletPreparation
  if (prep.steps.eoa !== 'completed') throw new Error('EOA_NOT_CONNECTED')

  const mode = await detectBootstrapMode()
  if (mode === 'unavailable') throw new Error('TSS_NOT_CONFIGURED')

  const tss = await checkTssReadiness(state, prep.agentWallet.coboWalletId)
  setBootstrapState(state, {
    mode,
    phase: tss.online ? 'bootstrapping' : 'tss_check',
    tssOnline: tss.online,
    message: tss.message,
  })

  if (!tss.online) {
    return buildStatusResponse(state, false)
  }

  if (mode === 'cli-onboard') {
    await bootstrapViaCliOnboardStep(state)
  } else {
    await bootstrapViaSdkCreate(state)
    setBootstrapState(state, {
      phase: 'bootstrapping',
      walletStatus: 'preparing',
      message: '正在通过 SDK 创建 MPC 钱包并等待 vault 就绪',
    })
  }

  return pollAgentBootstrap(state)
}

export async function pollAgentBootstrap(state: AppState): Promise<AgentBootstrapStatusResponse> {
  const prep = state.walletPreparation
  const bootstrap = getBootstrapState(prep)

  if (isBootstrapDone(prep)) {
    setBootstrapState(state, { phase: 'paired', message: '已完成配对' })
    return buildStatusResponse(state, true)
  }

  if (prep.agentWallet.address && prep.agentWallet.coboWalletId) {
    return pollPairingForReadyWallet(state)
  }

  try {
    const tss = await checkTssReadiness(state, prep.agentWallet.coboWalletId)
    setBootstrapState(state, { tssOnline: tss.online, message: tss.message })
    if (!tss.online) {
      setBootstrapState(state, { phase: 'tss_check' })
      return buildStatusResponse(state, false)
    }

    if (bootstrap.mode === 'cli-onboard') {
      await bootstrapViaCliOnboardStep(state)
      await syncCredentialsFromCli(state)

      const walletUuid = prep.agentWallet.coboWalletId
      const currentBootstrap = getBootstrapState(prep)
      if (!walletUuid) {
        return buildStatusResponse(state, false)
      }

      const walletStatus = currentBootstrap.walletStatus
      if (walletStatus !== 'active' && currentBootstrap.phase !== 'active') {
        setBootstrapState(state, {
          phase: 'bootstrapping',
          message: 'CAW onboard 正在进行，等待 vault 变为 active',
        })
        markAgentWalletPreparing(state, {
          coboWalletId: walletUuid,
          pairing: { status: 'unpaired', code: null, expiresAt: null },
        })
        return buildStatusResponse(state, false)
      }

      const address = await resolveEvmAddressFromCli(state, walletUuid)
      if (!address) {
        markAgentWalletPreparing(state, {
          coboWalletId: walletUuid,
          pairing: { status: 'unpaired', code: null, expiresAt: null },
        })
        setBootstrapState(state, { phase: 'bootstrapping', message: '等待链上地址生成' })
        return buildStatusResponse(state, false)
      }

      const pairing = await resolvePairingStatus(state, walletUuid)
      if (pairing.status === 'paired') {
        setBootstrapState(state, { phase: 'paired', message: 'CAW App 配对已完成' })
      } else if (pairing.status === 'pairing') {
        setBootstrapState(state, { phase: 'pairing', message: '请在 CAW App 输入配对码' })
      } else {
        setBootstrapState(state, { phase: 'active', message: '钱包已 active，可重新生成配对码' })
      }

      markAgentWalletCreated(state, { address, coboWalletId: walletUuid, pairing })
      return buildStatusResponse(state, pairing.status === 'paired')
    }

    // sdk-create path
    await ensureCawCredentials(state)
    const walletUuid = prep.agentWallet.coboWalletId
    if (!walletUuid) {
      await bootstrapViaSdkCreate(state)
      return buildStatusResponse(state, false)
    }

    const walletStatus = await getWalletStatusFromSdk(state, walletUuid)
    setBootstrapState(state, { walletStatus })

    if (walletStatus !== 'active') {
      if (walletStatus === 'archived') throw new Error('WALLET_ARCHIVED')
      const tssCheck = await checkTssReadiness(state, walletUuid)
      if (!tssCheck.online) throw new Error('TSS_NODE_OFFLINE')
      markAgentWalletPreparing(state, {
        coboWalletId: walletUuid,
        pairing: { status: 'unpaired', code: null, expiresAt: null },
      })
      setBootstrapState(state, {
        phase: 'bootstrapping',
        message: 'SDK 钱包仍在 preparing，等待 vault 初始化',
      })
      return buildStatusResponse(state, false)
    }

    const address = await resolveEvmAddressFromSdk(state, walletUuid)
    if (!address) {
      markAgentWalletPreparing(state, {
        coboWalletId: walletUuid,
        pairing: { status: 'unpaired', code: null, expiresAt: null },
      })
      setBootstrapState(state, { phase: 'bootstrapping', message: '等待链上地址生成' })
      return buildStatusResponse(state, false)
    }

    const pairing = await resolvePairingStatus(state, walletUuid)
    if (pairing.status === 'paired') {
      setBootstrapState(state, { phase: 'paired', message: 'CAW App 配对已完成' })
    } else if (pairing.status === 'pairing') {
      setBootstrapState(state, { phase: 'pairing', message: '请在 CAW App 输入配对码' })
    } else {
      setBootstrapState(state, { phase: 'active', message: '钱包已 active' })
    }
    markAgentWalletCreated(state, {
      address,
      coboWalletId: walletUuid,
      pairing,
    })
    return buildStatusResponse(state, pairing.status === 'paired')
  } catch (err) {
    if (isTransientCoboNetworkError(err) && prep.agentWallet.coboWalletId) {
      markAgentWalletPreparing(state, {
        coboWalletId: prep.agentWallet.coboWalletId,
        pairing: { status: 'unpaired', code: null, expiresAt: null },
      })
      setBootstrapState(state, {
        phase: 'bootstrapping',
        message: '网络波动，稍后将继续初始化',
      })
      return buildStatusResponse(state, false)
    }
    throw err
  }
}

export async function regenerateAgentPairing(state: AppState): Promise<WalletPreparation> {
  const prep = state.walletPreparation
  if (!prep.agentWallet.coboWalletId || !prep.agentWallet.address) {
    throw new Error('AGENT_WALLET_NOT_READY')
  }

  const walletStatus = prep.agentWallet.coboWalletId
    ? await getWalletStatusFromSdk(state, prep.agentWallet.coboWalletId)
    : null
  if (walletStatus && walletStatus !== 'active') {
    throw new Error('WALLET_STILL_PREPARING')
  }

  const mode = getBootstrapState(prep).mode
  const pairing = mode === 'cli-onboard'
    ? await initiateWalletPairingCli() ?? await initiateWalletPairingApi(state, prep.agentWallet.coboWalletId)
    : await initiateWalletPairingApi(state, prep.agentWallet.coboWalletId)

  return markAgentWalletCreated(state, {
    address: prep.agentWallet.address,
    coboWalletId: prep.agentWallet.coboWalletId,
    pairing,
  })
}
