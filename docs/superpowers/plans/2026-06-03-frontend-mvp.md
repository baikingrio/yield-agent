# 前端 MVP 实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补全 YieldAgent 前端 MVP（控制台含收益图、Pact、历史、设置），数据来自 Nitro mock API，并与现有「创建策略」页打通。

**Architecture:** 资源型 Nitro 路由读写内存 `demo-store`；Pinia 封装 `$fetch`；页面遵循 DESIGN.md 中文控制台。Chart.js 仅客户端渲染。Agent/Cobo 仍为 fixture，不接真链。

**Tech Stack:** Nuxt 4、TypeScript、Tailwind、Pinia、`@pinia/nuxt`、`chart.js`、`vue-chartjs`、`zod`

**Spec:** [docs/superpowers/specs/2026-06-03-frontend-mvp-design.md](../specs/2026-06-03-frontend-mvp-design.md)

---

## 文件结构（实施前锁定）

| 路径 | 职责 |
|------|------|
| `shared/types/demo.ts` | 全部 DTO 类型 |
| `server/fixtures/initial-state.ts` | 种子数据（含 yield 7d/30d） |
| `server/utils/demo-store.ts` | 内存读写、克隆、变更 |
| `server/utils/api-error.ts` | `createError` 辅助（可选） |
| `server/api/**/*.ts` | Nitro 路由 |
| `app/stores/demo.ts` | Pinia：fetch actions + state |
| `app/composables/useDashboardPoll.ts` | 15s 轮询 logs + yield |
| `app/components/dashboard/*` | 控制台区块 |
| `app/components/pacts/*` | Pact 主从 |
| `app/components/history/*` | 时间线 + 筛选 |
| `app/components/settings/*` | 设置表单 |
| `app/components/ui/*` | StatusChip、TxLink、PageAlert |
| `app/pages/*.vue` | 五页入口 |

---

## Chunk 1: 依赖与类型基础

### Task 1: 安装依赖并配置 Pinia

**Files:**
- Modify: `package.json`
- Modify: `nuxt.config.ts`

- [ ] **Step 1:** 安装依赖

```bash
cd /Users/quinn/Github/ruogu/yield_agent
pnpm add pinia zod chart.js vue-chartjs
pnpm add -D @pinia/nuxt
```

- [ ] **Step 2:** 在 `nuxt.config.ts` 的 `modules` 中加入 `@pinia/nuxt`

```ts
modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
```

- [ ] **Step 3:** 验证

```bash
./node_modules/.bin/nuxt prepare
```

Expected: 无报错，`.nuxt` 生成 Pinia 类型。

---

### Task 2: 共享类型 `shared/types/demo.ts`

**Files:**
- Create: `shared/types/demo.ts`

- [ ] **Step 1:** 创建类型（与 spec §3.3 一致）

```ts
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
```

- [ ] **Step 2:** `nuxt.config` 无需改 alias；Nitro 用相对路径 `../../shared/types/demo` 导入。

---

### Task 3: 种子数据与 demo-store

**Files:**
- Create: `server/fixtures/initial-state.ts`
- Create: `server/utils/demo-store.ts`

- [ ] **Step 1:** `initial-state.ts` 导出 `createInitialState(): DemoState`

  - 钱包地址 `0x` + 40 hex  
  - 2 strategies、2 pacts、≥5 logs（三类各一）  
  - `yieldSeries7d` 7 点、`yieldSeries30d` 30 点，单调上升  
  - 固定 demo tx hash（与 create-strategy 现用一致）

- [ ] **Step 2:** `demo-store.ts`

```ts
import type { DemoState } from '../../shared/types/demo'
import { createInitialState } from '../fixtures/initial-state'

let state: DemoState = createInitialState()

export function getState(): DemoState {
  return state
}

export function resetState(): void {
  state = createInitialState()
}

export function setState(next: DemoState): void {
  state = next
}
```

- [ ] **Step 3:** 手动验证（临时路由或 `node -e` 不适用）；留到 Task 4 第一个 API 验证。

---

## Chunk 2: Nitro API（只读路由）

### Task 4: GET 路由 wallet / strategies / logs / yield-series

**Files:**
- Create: `server/api/wallet.get.ts`
- Create: `server/api/strategies/index.get.ts`
- Create: `server/api/logs/index.get.ts`
- Create: `server/api/yield-series.get.ts`

- [ ] **Step 1:** `wallet.get.ts` → `return getState().wallet`

- [ ] **Step 2:** `strategies/index.get.ts` → `return getState().strategies`

- [ ] **Step 3:** `logs/index.get.ts` 解析 query `type`、`limit`（默认 50），过滤 `logs`

- [ ] **Step 4:** `yield-series.get.ts` 解析 `range`（默认 `7d`），组装 `YieldSeries`：

```ts
const range = (getQuery(event).range === '30d' ? '30d' : '7d') as YieldRange
const points = range === '30d' ? state.yieldSeries30d : state.yieldSeries7d
return { range, points, totalUsdc: points.at(-1)?.cumulativeUsdc ?? 0 }
```

- [ ] **Step 5:** 启动 dev，curl 验证

```bash
curl -s http://localhost:3000/api/wallet | head
curl -s 'http://localhost:3000/api/yield-series?range=7d' | head
```

Expected: JSON 200。

---

### Task 5: GET pacts + GET settings

**Files:**
- Create: `server/api/pacts/index.get.ts`
- Create: `server/api/pacts/[id].get.ts`
- Create: `server/api/settings/index.get.ts`

- [ ] **Step 1:** `pacts/index.get.ts` 可选 query `status` 过滤

- [ ] **Step 2:** `[id].get.ts` 找不到返回 404 `{ error: 'Pact not found' }`

- [ ] **Step 3:** `settings/index.get.ts` 返回 settings（永不含 apiKey 明文）

- [ ] **Step 4:** curl `http://localhost:3000/api/pacts` 与 `/api/pacts/<id>`

---

## Chunk 3: Nitro API（写操作）

### Task 6: POST strategies（Zod）

**Files:**
- Create: `server/api/strategies/index.post.ts`

- [ ] **Step 1:** Zod schema 对齐 `CreateStrategyPayload`

- [ ] **Step 2:** 创建 `strategy` + `pact`（`pending` 或 `awaiting-approval`），`push` 到 state；可选 `push` 一条 log

- [ ] **Step 3:** 返回 `{ strategy, pact }` 201

- [ ] **Step 4:** curl POST 测试

```bash
curl -s -X POST http://localhost:3000/api/strategies \
  -H 'Content-Type: application/json' \
  -d '{"network":"base-sepolia","asset":"USDC","riskLevel":"conservative","maxSpend":"500","agentFee":"15","userSplit":"85"}'
```

---

### Task 7: Pact approve / terminate + PUT settings

**Files:**
- Create: `server/api/pacts/[id]/approve.post.ts`
- Create: `server/api/pacts/[id]/terminate.post.ts`
- Modify: `server/api/settings/index.put.ts`（或 `settings.put.ts` 按 Nitro 约定）

- [ ] **Step 1:** approve → `status = 'active'`

- [ ] **Step 2:** terminate → `status = 'terminated'`

- [ ] **Step 3:** PUT settings 更新字段；body 有 `apiKey` 则 `apiKeyConfigured: true`

- [ ] **Step 4:** curl 验证 approve/terminate

---

## Chunk 4: Pinia 与 UI 基础组件

### Task 8: `app/stores/demo.ts`

**Files:**
- Create: `app/stores/demo.ts`

- [ ] **Step 1:** state：`wallet`, `strategies`, `pacts`, `selectedPact`, `logs`, `yieldSeries`, `settings`, `loading`, `error`

- [ ] **Step 2:** 实现 spec §6.1 全部 actions（`$fetch`）

- [ ] **Step 3:** 在任意页面临时 `console.log` 或后续 Dashboard 验证加载

---

### Task 9: 共用 UI 组件

**Files:**
- Create: `app/components/ui/StatusChip.vue`
- Create: `app/components/ui/TxLink.vue`
- Create: `app/components/ui/PageAlert.vue`

- [ ] **Step 1:** `StatusChip`：props `label`, `tone: 'active' | 'pending' | 'paused' | 'error' | 'neutral'`

- [ ] **Step 2:** `TxLink`：props `hash`, `network`；链接 `https://sepolia.basescan.org/tx/${hash}`（arbitrum 时换 explorer）

- [ ] **Step 3:** `PageAlert`：错误 + 重试 emit

---

## Chunk 5: 控制台 Dashboard

### Task 10: Dashboard 子组件

**Files:**
- Create: `app/components/dashboard/WalletBar.vue`
- Create: `app/components/dashboard/StrategyList.vue`
- Create: `app/components/dashboard/RecentLogsTable.vue`

- [ ] **Step 1:** `WalletBar`：地址复制（`navigator.clipboard`）、三列小字指标

- [ ] **Step 2:** `StrategyList`：空态 CTA；卡片点击 `navigateTo('/pacts?id=' + pactId)`

- [ ] **Step 3:** `RecentLogsTable`：table + `TxLink` + skeleton

---

### Task 11: YieldChart（Chart.js）

**Files:**
- Create: `app/components/dashboard/YieldChart.vue`

- [ ] **Step 1:** 注册 Chart.js 组件（Line），`import { Chart as ChartJS, ... } from 'chart.js'`

- [ ] **Step 2:** props：`series: YieldSeries | null`, `loading`, `range`, emit `update:range`

- [ ] **Step 3:** 7d/30d segmented control；配色见 spec §5.1.1（`#0ecb81` 线，`#2b3139` 网格）

- [ ] **Step 4:** `<ClientOnly>` 包裹；`sr-only` 最近 3 点表格

- [ ] **Step 5:** `prefers-reduced-motion` 时 `animation: false`

---

### Task 12: 页面 `app/pages/index.vue` + 轮询

**Files:**
- Create: `app/composables/useDashboardPoll.ts`
- Modify: `app/pages/index.vue`

- [ ] **Step 1:** `useDashboardPoll`：`onMounted` + `setInterval(15000)` 调 `fetchLogs` + `fetchYieldSeries`；`onUnmounted` clear

- [ ] **Step 2:** `index.vue` 布局：WalletBar → YieldChart → StrategyList → RecentLogsTable

- [ ] **Step 3:** `route.query.created === '1'` 显示顶部成功条「策略已创建」（非 modal）

- [ ] **Step 4:** 浏览器验证 `/` 中文、图表切换、无控制台 Vue warn

---

## Chunk 6: Pact 管理页

### Task 13: Pact 主从 UI

**Files:**
- Create: `app/components/pacts/PactList.vue`
- Create: `app/components/pacts/PactDetail.vue`
- Modify: `app/pages/pacts.vue`

- [ ] **Step 1:** `pacts.vue`：`onMounted` fetchPacts；`route.query.id` 选中

- [ ] **Step 2:** lg 网格主从；按钮「模拟审批」「终止 Pact」调 store actions 后 refresh

- [ ] **Step 3:** 验证深链 `/pacts?id=<pactId>`

---

## Chunk 7: 交易历史页

### Task 14: History 时间线

**Files:**
- Create: `app/components/history/LogTypeFilter.vue`
- Create: `app/components/history/LogTimeline.vue`
- Modify: `app/pages/history.vue`

- [ ] **Step 1:** 筛选 chips 映射 `LogType | 'all'`

- [ ] **Step 2:** 时间线样式：左 mono 时间，右 action + TxLink

- [ ] **Step 3:** 与 Dashboard 同源 `store.logs`（进入页 `fetchLogs` 全量）

---

## Chunk 8: 设置页

### Task 15: Settings 表单

**Files:**
- Create: `app/pages/settings.vue`
- Create: `app/components/settings/SettingsForm.vue`

- [ ] **Step 1:** 新建 `settings.vue`（当前可能无路由文件）

- [ ] **Step 2:** 表单字段见 spec §5.4；保存调 `updateSettings`

- [ ] **Step 3:** 成功显示「已保存」内联文案

---

## Chunk 9: 创建策略对接 API

### Task 16: 修改 `useCreateStrategy` + 页面

**Files:**
- Modify: `app/composables/useCreateStrategy.ts`
- Modify: `app/pages/create-strategy.vue`

- [ ] **Step 1:** `submitPact` 在 `submitting` 时调用 `useDemoStore().createStrategy(payload)`（映射表单字段）

- [ ] **Step 2:** API 失败：`pipeline = 'failed'`，`pipelineError` 显示 server message

- [ ] **Step 3:** 成功：保留动画 → 最终 `navigateTo('/?created=1')`（可在 success 或动画结束后跳转）

- [ ] **Step 4:** 端到端：创建策略 → 控制台见新策略

---

## Chunk 10: 打磨与验证

### Task 17: 全站验证

- [ ] **Step 1:** 生产构建

```bash
./node_modules/.bin/nuxt build
```

Expected: exit 0。

- [ ] **Step 2:** 手动 Demo 脚本（spec §10）

  1. `/` 查看钱包、收益图 7d/30d、日志表  
  2. `/create-strategy` 提交 → 回控制台  
  3. `/pacts` 审批 → 状态变化  
  4. `/history` 筛选 revenue  
  5. `/settings` 保存  

- [ ] **Step 3:** 检查 DESIGN 约束：无 hero APY、无 section eyebrow 泛滥

- [ ] **Step 4:** （可选）提交 commit，由用户决定是否执行

```bash
git add -A && git status
# 用户确认后再 commit
```

---

## 执行顺序总览

```
Chunk 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17
```

**依赖关系：** Chunk 2–3 阻塞所有 API；Chunk 4 阻塞 Pinia；Chunk 5–8 可并行（不同页面）；Chunk 9 依赖 Chunk 3 + 4；Chunk 10 最后。

---

## 明确不在本计划内

- Vitest 全套（spec 可选）；若时间允许仅加 `demo-store` 纯函数测试  
- Cobo SDK / 真链交易  
- WebSocket  
- `agent-core/` 目录拆分  
