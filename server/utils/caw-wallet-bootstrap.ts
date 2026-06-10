import type {
  AgentBootstrapMode,
  AgentBootstrapState,
  AgentBootstrapStatusResponse,
  AppState,
  WalletPreparation,
} from '../../shared/types/app'
import { getNetworkChainConfig } from './cobo-config'
import {
  createCoboWalletsApi,
  extractCoboErrorMessage,
  isTransientCoboNetworkError,
  withCoboRetry,
} from './cobo-client'
import { runCawOnboardStep } from './caw-onboard'
import {
  bool,
  defaultCawRunner,
  isStringArray,
  resolveCawCliBin,
  runCawJson,
  str,
  type CawCliRunner,
} from './caw-cli'
import {
  AGENT_WALLET_API_KEY_REQUIRED,
  ensureCawCredentials,
  syncCredentialsFromCli,
} from './caw-credentials'
import {
  bootstrapViaSdkCreate,
  getWalletStatusFromSdk,
  resolveEvmAddressFromSdk,
} from './caw-sdk-wallet'
import { buildSdkPreparingMessage, checkTssReadiness } from './caw-tss-readiness'
import {
  markAgentWalletCreated,
  markAgentWalletPreparing,
  touchPreparation,
} from './wallet-preparation'

export type { CawCliRunner } from './caw-cli'
export { resolveCawCliBin, runCawJson } from './caw-cli'
export {
  AGENT_WALLET_API_KEY_REQUIRED,
  ensureCawCredentials,
  syncCredentialsFromCli,
} from './caw-credentials'
export { getWalletStatusFromSdk } from './caw-sdk-wallet'
export { buildSdkPreparingMessage, checkTssReadiness } from './caw-tss-readiness'

type PairingInfo = {
  status: 'unpaired' | 'pairing' | 'paired'
  code: string | null
  expiresAt: string | null
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

async function initiateWalletPairingApi(
  state: AppState,
  walletId: string,
): Promise<{ status: 'pairing'; code: string | null; expiresAt: string | null } | undefined> {
  const apiKey = state.settings.coboApiKey?.trim() || process.env.AGENT_WALLET_API_KEY?.trim()
  if (!apiKey) return undefined

  try {
    const walletsApi = createCoboWalletsApi(state)
    const resp = await withCoboRetry(() => walletsApi.initiateWalletPair({ wallet_id: walletId }))
    const payload = resp.data

    if (payload.success === false) {
      throw new Error(payload.message || payload.suggestion || 'CAW wallet pairing failed')
    }

    return {
      status: 'pairing',
      code: payload.result?.token ?? null,
      expiresAt: payload.result?.expires_at ?? null,
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('CAW wallet pairing')) {
      throw err
    }
    throw new Error(extractCoboErrorMessage(err))
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
  if (tokenStatus === 'valid' || tokenStatus === 'paired') return 'pairing'
  if (tokenStatus === 'expired' || tokenStatus === 'not_found') return 'unpaired'

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
  const apiKey = state.settings.coboApiKey?.trim() || process.env.AGENT_WALLET_API_KEY?.trim()
  if (!apiKey) return 'unpaired'

  try {
    const walletsApi = createCoboWalletsApi(state)
    const resp = await withCoboRetry(() => walletsApi.getPairInfoByWallet(walletId))
    return parsePairStatusPayload(resp.data.result as unknown as Record<string, unknown>)
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

async function ensureBootstrapMode(state: AppState): Promise<AgentBootstrapMode | null> {
  const bootstrap = getBootstrapState(state.walletPreparation)
  if (bootstrap.mode) return bootstrap.mode

  const detected = await detectBootstrapMode()
  if (detected === 'unavailable') return null

  setBootstrapState(state, { mode: detected })
  return detected
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

  if (isBootstrapDone(prep)) {
    setBootstrapState(state, { phase: 'paired', message: '已完成配对' })
    return buildStatusResponse(state, true)
  }

  if (prep.agentWallet.address && prep.agentWallet.coboWalletId) {
    return pollPairingForReadyWallet(state)
  }

  await ensureBootstrapMode(state)
  const bootstrap = getBootstrapState(prep)

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
      if (!tssCheck.online) {
        setBootstrapState(state, {
          phase: 'tss_check',
          tssOnline: false,
          message: tssCheck.message,
        })
        return buildStatusResponse(state, false)
      }
      markAgentWalletPreparing(state, {
        coboWalletId: walletUuid,
        pairing: { status: 'unpaired', code: null, expiresAt: null },
      })
      setBootstrapState(state, {
        phase: 'bootstrapping',
        walletStatus,
        tssOnline: true,
        message: buildSdkPreparingMessage(walletStatus, tssCheck),
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
