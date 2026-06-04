import type { DemoState, YieldPoint } from '../../shared/types/demo'
import { createInitialWalletPreparation } from '../utils/wallet-preparation'

export const DEMO_TX_HASH =
  '0x8f3a91c2e4b1076d5a9c3f812e7b4c9a1d0e5f6a8b2c3d4e5f60718293a4b5c6'

function buildYieldSeries(days: number, start: number, step: number): YieldPoint[] {
  const points: YieldPoint[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - i)
    const date = d.toISOString().slice(0, 10)
    const cumulativeUsdc = Math.round((start + (days - 1 - i) * step) * 100) / 100
    points.push({ date, cumulativeUsdc })
  }
  return points
}

export function createInitialState(): DemoState {
  const yield7 = buildYieldSeries(7, 12.4, 1.85)
  const yield30 = buildYieldSeries(30, 4.2, 1.12)

  return {
    wallet: {
      address: '',
      totalAssetsUsdc: 0,
      currentApy: 4.82,
      cumulativeYieldUsdc: yield7.at(-1)?.cumulativeUsdc ?? 0,
    },
    walletPreparation: createInitialWalletPreparation('base-sepolia'),
    strategies: [
      {
        id: 'str-demo-1',
        name: '保守型 USDC 收益',
        network: 'base-sepolia',
        asset: 'USDC',
        riskLevel: 'conservative',
        maxSpend: 5000,
        status: 'active',
        pactId: 'pact-demo-1',
        createdAt: '2026-05-28T10:00:00.000Z',
      },
      {
        id: 'str-demo-2',
        name: '平衡型 Aave 存入',
        network: 'arbitrum-sepolia',
        asset: 'USDC',
        riskLevel: 'balanced',
        maxSpend: 2500,
        status: 'paused',
        pactId: 'pact-demo-2',
        createdAt: '2026-05-20T14:30:00.000Z',
      },
    ],
    pacts: [
      {
        id: 'pact-demo-1',
        strategyId: 'str-demo-1',
        intent: '保守型收益 · USDC（Base Sepolia 测试网）',
        status: 'active',
        maxSpend: 5000,
        whitelist: ['Aave 存入', 'Compound 存入'],
        durationDays: 7,
        agentFeePercent: 15,
        userSplitPercent: 85,
      },
      {
        id: 'pact-demo-2',
        strategyId: 'str-demo-2',
        intent: '平衡型收益 · USDC（Arbitrum Sepolia 测试网）',
        status: 'awaiting-approval',
        maxSpend: 2500,
        whitelist: ['Aave 存入', 'Compound 存入'],
        durationDays: 7,
        agentFeePercent: 12,
        userSplitPercent: 88,
      },
    ],
    logs: [
      {
        id: 'log-1',
        timestamp: '2026-06-03T08:12:00.000Z',
        action: 'USDC → Aave 存入',
        type: 'supply',
        txHash: DEMO_TX_HASH,
        status: '成功',
      },
      {
        id: 'log-2',
        timestamp: '2026-06-02T16:45:00.000Z',
        action: 'ETH → USDC 兑换',
        type: 'swap',
        txHash: DEMO_TX_HASH,
        status: '成功',
      },
      {
        id: 'log-3',
        timestamp: '2026-06-01T09:30:00.000Z',
        action: '收益分账 · 用户 85%',
        type: 'revenue',
        txHash: DEMO_TX_HASH,
        status: '成功',
      },
      {
        id: 'log-4',
        timestamp: '2026-05-31T11:00:00.000Z',
        action: 'Compound 存入 USDC',
        type: 'supply',
        txHash: DEMO_TX_HASH,
        status: '成功',
      },
      {
        id: 'log-5',
        timestamp: '2026-05-30T07:20:00.000Z',
        action: 'Agent 绩效费结算',
        type: 'revenue',
        txHash: DEMO_TX_HASH,
        status: '成功',
      },
    ],
    yieldSeries7d: yield7,
    yieldSeries30d: yield30,
    settings: {
      network: 'base-sepolia',
      apiKeyConfigured: false,
      defaultAgentFee: 15,
      userSplit: 85,
    },
  }
}
