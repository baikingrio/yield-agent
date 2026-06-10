export type { NetworkId } from '../constants/network'
export { DEFAULT_NETWORK, NETWORK_LABELS, normalizeNetwork } from '../constants/network'

/** 测试网允许小额策略；maxSpend 为 Pact 总支出上限（非单日）。 */
export const MIN_MAX_SPEND_USDC = 1
export const MAX_MAX_SPEND_USDC = 1_000_000

export type PrepStep = 'eoa' | 'agent_wallet' | 'funding'
export type PrepStepStatus = 'pending' | 'in_progress' | 'completed'
export type AgentBootstrapMode = 'cli-onboard' | 'sdk-create' | null
export type AgentBootstrapPhase =
  | 'idle'
  | 'tss_check'
  | 'bootstrapping'
  | 'active'
  | 'pairing'
  | 'paired'
  | 'failed'
export type FundingStatus = 'idle' | 'processing' | 'ready'
export type StrategyStatus = 'active' | 'paused' | 'completed'
export type PactStatus = 'pending' | 'active' | 'completed' | 'terminated' | 'awaiting-approval'
export type LogType = 'swap' | 'supply' | 'revenue' | 'pact' | 'withdraw'
export type YieldRange = '7d' | '30d'
export type CawEnvironment = 'dev' | 'prod' | 'custom'
export type CawPactMode = 'local-draft' | 'cobo-pact' | 'pact-execution-ready'
export type StrategyAgentProvider = 'hermes'
export type StrategyAgentMode = 'cli' | 'api'

export interface WalletSummary {
  address: string
  totalAssetsUsdc: number
  currentApy: number
  cumulativeYieldUsdc: number
}

export interface Strategy {
  id: string
  name: string
  network: NetworkId
  asset: string
  riskLevel: string
  maxSpend: number
  status: StrategyStatus
  pactId: string
  createdAt: string
}

export interface Pact {
  id: string
  strategyId: string
  intent: string
  status: PactStatus
  maxSpend: number
  whitelist: string[]
  durationDays: number
  agentFeePercent: number
  userSplitPercent: number
  submissionMode?: 'cobo' | 'local-draft'
  coboPactId?: string
  approvalId?: string
  coboStatus?: string
  submissionMessage?: string
  /** 服务端已缓存 pact-scoped key，不暴露具体 key */
  executionCredentialStored?: boolean
  firstExecutionAt?: string
  firstExecutionTxHash?: string
  firstExecutionCompleted?: boolean
  /** 每次重试递增，用于生成新的 Cobo request_id */
  firstExecutionAttempt?: number
  redeemCompleted?: boolean
  redeemTxHash?: string
  redeemAttempt?: number
}

export interface StrategyParseLimits {
  availableUsdc: number
  network: NetworkId
}

export interface StrategyProposal {
  network: NetworkId
  asset: string
  targetApy?: string
  riskLevel: string
  maxSpend: string
  agentFee: string
  userSplit: string
}

export interface StrategyParseResponse {
  proposal: StrategyProposal
  explanation: string
  warnings: string[]
}

export interface PactExecutionResult {
  txHash: string
  status: string
  coboTransactionId?: string
  action: string
}

export interface PactRedeemResult {
  txHash: string
  status: string
  amountUsdc: number
  action: string
}

export interface YieldPositionSnapshot {
  protocol: string
  suppliedUsdc: number
  redeemable: boolean
}

export interface PactDenialResult {
  action: string
  reason: string
  status: string
}

export interface LogEntry {
  id: string
  timestamp: string
  action: string
  type: LogType
  txHash: string
  status: string
  pactId?: string
}

export interface YieldPoint {
  date: string
  cumulativeUsdc: number
}

export interface YieldSeries {
  range: YieldRange
  points: YieldPoint[]
  totalUsdc: number
}

export interface AppSettings {
  network: NetworkId
  apiKeyConfigured: boolean
  defaultAgentFee: number
  userSplit: number
  agentId?: string
  /** 开启后允许本地 Pact Draft 调试路径（无法链上执行 Recipe） */
  developerMode?: boolean
  /** 仅服务端会话内存，不返回给客户端 */
  coboApiKey?: string
}

export type CawDeploymentBlocker =
  | 'missing_api_key'
  | 'missing_main_node'
  | 'tss_offline'
  | 'node_id_mismatch'
  | 'wallet_preparing'
  | 'prefer_env_api_key'
  | 'ephemeral_database'

export interface CawDeploymentCheck {
  runtime: 'hermes-agent-host' | 'local' | 'unknown'
  apiKeyConfigured: boolean
  apiKeySource: 'settings' | 'env' | 'missing'
  preferEnvKey: boolean
  mainNodeConfigured: boolean
  mainNodeId: string | null
  tssOnline: boolean | null
  boundTssNodeId: string | null
  mainNodeMatchesBound: boolean | null
  walletId: string | null
  walletStatus: string | null
  blockers: CawDeploymentBlocker[]
  nextActions: string[]
  envTemplate: string
}

export interface CawReadiness {
  environment: CawEnvironment
  apiBaseUrl: string
  apiKeyConfigured: boolean
  apiKeySource: 'settings' | 'env' | 'missing'
  mainNodeConfigured: boolean
  tssRuntime: 'hermes-agent-host'
  remoteRuntimeRequired: boolean
  agentId: string | null
  agentWalletConfigured: boolean
  agentWalletAddress: string | null
  walletReady: boolean
  fundingReady: boolean
  pactMode: CawPactMode
  missing: string[]
  nextAction: string
}

export interface StrategyAgentReadiness {
  provider: StrategyAgentProvider
  mode: StrategyAgentMode
  localExecution: boolean
  runtimeHost: 'hermes-agent-host'
  remoteCallable: boolean
  deploymentReady: boolean
  configured: boolean
  command: string | null
  endpoint: string | null
  profile: string
  model: string | null
  missing: string[]
  nextAction: string
}

export interface CawOnboardPrompt {
  id: string
  label?: string
  type?: string
  required?: boolean
  secret?: boolean
  description?: string
}

export interface CawOnboardStatus {
  healthy: boolean
  walletStatus: string | null
  walletPaired: boolean
  agentId: string | null
  agentName: string | null
  walletUuid: string | null
  walletName: string | null
  apiUrl: string | null
  phase: 'unknown' | 'active' | 'needs_input' | 'running' | 'error'
  sessionId: string | null
  needsInput: boolean
  prompts: CawOnboardPrompt[]
  nextAction: string | null
  lastError: string | null
}

export interface HermesStrategyPingResult {
  ok: boolean
  endpoint: string
  model: string
  contentPreview: string
}

export interface DepositInfo {
  agentAddress: string
  usdcContract: string
  decimals: number
  chainId: number
  coboChainId: string
  coboTokenId: string
  minAmount: number
}

export interface WithdrawInfo {
  eoaAddress: string
  agentAddress: string
  network: NetworkId
  coboChainId: string
  coboTokenId: string
  liquidUsdc: number
  suppliedUsdc: number
  maxWithdrawUsdc: number
  minAmount: number
  maxAmount: number
}

export interface WithdrawResult {
  txHash: string | null
  amountUsdc: number
  status: string
  liquidUsdc: number
}

export interface AgentGasWrongChainHint {
  chainLabel: string
  tokenLabel: string
  balance: string
  message: string
}

export interface AgentGasStatus {
  network: NetworkId
  networkLabel: string
  nativeTokenLabel: string
  agentAddress: string
  ethBalance: string
  ready: boolean
  minEth: number
  recommendedFundEth: number
  faucetUrl: string
  wrongChainHint?: AgentGasWrongChainHint | null
}

export interface AgentBootstrapState {
  mode: AgentBootstrapMode
  phase: AgentBootstrapPhase
  sessionId: string | null
  walletStatus: string | null
  tssOnline: boolean | null
  message: string | null
}

export interface AgentBootstrapStatusResponse {
  preparation: WalletPreparation
  bootstrap: AgentBootstrapState
  done: boolean
}

export interface WalletPreparation {
  network: NetworkId
  /** Hackathon mode uses one pre-paired operator wallet instead of per-judge onboarding. */
  demoMode?: 'preset'
  agentBootstrap?: AgentBootstrapState
  eoa: {
    connected: boolean
    address: string | null
    label: string
  }
  agentWallet: {
    created: boolean
    address: string
    coboWalletId: string | null
    pairing?: {
      status: 'unpaired' | 'pairing' | 'paired'
      code: string | null
      expiresAt: string | null
    }
  }
  funding: {
    status: FundingStatus
    depositedUsdc: number
    availableUsdc: number
    lastTxHash: string | null
  }
  steps: Record<PrepStep, PrepStepStatus>
  ready: boolean
  updatedAt: string
}

export interface CreateStrategyPayload {
  network: NetworkId
  asset: string
  targetApy?: string
  riskLevel: string
  maxSpend: string
  agentFee: string
  userSplit: string
}

export interface AppState {
  wallet: WalletSummary
  walletPreparation: WalletPreparation
  strategies: Strategy[]
  pacts: Pact[]
  logs: LogEntry[]
  yieldSeries7d: YieldPoint[]
  yieldSeries30d: YieldPoint[]
  /** 上次链上协议仓位（USDC），用于计算利息增量 */
  yieldSnapshotLastSuppliedUsdc?: number | null
  settings: AppSettings
}
