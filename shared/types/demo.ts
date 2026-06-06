export type NetworkId = 'base-sepolia' | 'arbitrum-sepolia'
export type PrepStep = 'eoa' | 'agent_wallet' | 'funding'
export type PrepStepStatus = 'pending' | 'in_progress' | 'completed'
export type FundingStatus = 'idle' | 'processing' | 'ready'
export type StrategyStatus = 'active' | 'paused' | 'completed'
export type PactStatus = 'pending' | 'active' | 'completed' | 'terminated' | 'awaiting-approval'
export type LogType = 'swap' | 'supply' | 'revenue' | 'pact'
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
}

export interface LogEntry {
  id: string
  timestamp: string
  action: string
  type: LogType
  txHash: string
  status: string
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

export interface DemoSettings {
  network: NetworkId
  apiKeyConfigured: boolean
  defaultAgentFee: number
  userSplit: number
  agentId?: string
  /** 仅服务端会话内存，不返回给客户端 */
  coboApiKey?: string
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

export interface WalletPreparation {
  network: NetworkId
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

export interface DemoState {
  wallet: WalletSummary
  walletPreparation: WalletPreparation
  strategies: Strategy[]
  pacts: Pact[]
  logs: LogEntry[]
  yieldSeries7d: YieldPoint[]
  yieldSeries30d: YieldPoint[]
  settings: DemoSettings
}
