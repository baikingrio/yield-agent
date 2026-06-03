export type NetworkId = 'base-sepolia' | 'arbitrum-sepolia'
export type StrategyStatus = 'active' | 'paused' | 'completed'
export type PactStatus = 'pending' | 'active' | 'terminated' | 'awaiting-approval'
export type LogType = 'swap' | 'supply' | 'revenue'
export type YieldRange = '7d' | '30d'

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
  strategies: Strategy[]
  pacts: Pact[]
  logs: LogEntry[]
  yieldSeries7d: YieldPoint[]
  yieldSeries30d: YieldPoint[]
  settings: DemoSettings
}
