# YieldAgent 产品改进（路线 A）Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在保持 Vercel + Hermes 分体架构下，通过凭证硬化、部署自检与 UX 引导，使测试网产品可稳定复现 Agent Wallet → 策略 → Pact 全流程。

**Architecture:** 强制执行「单 Agent 凭证链」——`AGENT_WALLET_API_KEY` 与 Hermes `caw onboard` 对齐，生产路径禁止 auto-provision；新增 `deployment-check` 供设置页与 Wallet 引导消费；Dashboard 首屏强化 Active Pact 边界与拒绝演示入口。

**Tech Stack:** Nuxt 4, Nitro, Vue 3, Pinia, `@cobo/agentic-wallet`, Vitest, SQLite

**Spec:** [docs/superpowers/specs/2026-06-10-product-improvement-design.md](../specs/2026-06-10-product-improvement-design.md)

---

## File Map

| 文件 | 职责 |
|------|------|
| `server/utils/caw-deployment-check.ts` | 纯函数：汇总 API Key 来源、MAIN_NODE_ID、TSS/钱包一致性 |
| `server/api/caw/deployment-check.get.ts` | 暴露自检（无 secret） |
| `server/utils/caw-wallet-bootstrap.ts` | `ensureCawCredentials` 硬化；bootstrap message 已有部分改进 |
| `shared/utils/bootstrap-user-copy.ts` | phase + message → 用户可见标题/说明/nextAction |
| `shared/types/app.ts` | `CawDeploymentCheck` 类型 |
| `app/composables/useWalletPreparation.ts` | 轮询进度 N/24、超时运维清单 |
| `app/components/wallet/PrepStepAgent.vue` | 消费 user copy；import 优先布局 |
| `app/components/settings/CawDeploymentCheckCard.vue` | 设置页部署自检 UI |
| `app/components/dashboard/DashboardActivePactCard.vue` | Active Pact 边界首屏卡 |
| `app/components/dashboard/DashboardDenialDemoCard.vue` | 拒绝演示引导卡 |
| `app/pages/dashboard/index.vue` | 调整信息架构顺序 |
| `README.md`, `docs/caw-integration.md`, `.env.example` | 部署与故障排查文档 |

---

## Chunk 1: A0 — 凭证硬化与 deployment-check

### Task 1: `CawDeploymentCheck` 类型与纯函数

**Files:**
- Create: `shared/types/app.ts`（追加 interface）
- Create: `server/utils/caw-deployment-check.ts`
- Create: `tests/caw-deployment-check.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// tests/caw-deployment-check.test.ts
import { describe, expect, it, vi } from 'vitest'
import { buildCawDeploymentCheck } from '../server/utils/caw-deployment-check'
import type { AppState } from '../shared/types/app'

function baseState(): AppState {
  return {
    wallet: { address: '', totalAssetsUsdc: 0, currentApy: 0, cumulativeYieldUsdc: 0 },
    walletPreparation: {
      network: 'base-sepolia',
      eoa: { connected: true, address: '0xEoa', label: 'EOA' },
      agentWallet: { created: false, address: '', coboWalletId: 'wallet-1' },
      funding: { status: 'idle', depositedUsdc: 0, availableUsdc: 0, lastTxHash: null },
      steps: { eoa: 'completed', agent_wallet: 'in_progress', funding: 'pending' },
      ready: false,
      updatedAt: new Date(0).toISOString(),
    },
    strategies: [], pacts: [], logs: [], yieldSeries7d: [], yieldSeries30d: [],
    settings: { network: 'base-sepolia', apiKeyConfigured: false, defaultAgentFee: 10, userSplit: 90 },
  }
}

describe('buildCawDeploymentCheck', () => {
  it('flags missing api key on hermes-agent-host runtime', () => {
    vi.stubEnv('AGENT_WALLET_TSS_RUNTIME', 'hermes-agent-host')
    vi.stubEnv('AGENT_WALLET_API_KEY', '')
    const check = buildCawDeploymentCheck(baseState(), { tssOnline: null, tssNodeId: null })
    expect(check.apiKeyConfigured).toBe(false)
    expect(check.blockers).toContain('missing_api_key')
  })
})
```

- [ ] **Step 2: 运行测试确认 FAIL**

Run: `pnpm test tests/caw-deployment-check.test.ts`  
Expected: FAIL — module not found

- [ ] **Step 3: 实现 `buildCawDeploymentCheck`**

`server/utils/caw-deployment-check.ts` 返回：

```ts
export interface CawDeploymentCheck {
  runtime: 'hermes-agent-host' | 'local' | 'unknown'
  apiKeyConfigured: boolean
  apiKeySource: 'env' | 'settings' | 'missing'
  preferEnvKey: boolean  // Vercel 应为 true
  mainNodeConfigured: boolean
  mainNodeId: string | null
  tssOnline: boolean | null
  boundTssNodeId: string | null
  mainNodeMatchesBound: boolean | null
  walletId: string | null
  walletStatus: string | null
  blockers: Array<'missing_api_key' | 'missing_main_node' | 'tss_offline' | 'node_id_mismatch' | 'wallet_preparing'>
  nextActions: string[]
  envTemplate: string  // 占位符模板，无真实 key
}
```

逻辑要点：
- `apiKeySource` 复用 `caw-readiness.ts` 判定
- `preferEnvKey`: `process.env.VERCEL === '1'` 或 `AGENT_WALLET_TSS_RUNTIME=hermes-agent-host`
- `blockers` 从 state + 可选 `tssProbe` 参数推导
- `envTemplate` 生成多行占位文本

- [ ] **Step 4: 测试 PASS**

Run: `pnpm test tests/caw-deployment-check.test.ts`

- [ ] **Step 5: Commit**

```bash
git add shared/types/app.ts server/utils/caw-deployment-check.ts tests/caw-deployment-check.test.ts
git commit -m "feat: add CAW deployment check utility for split Vercel/Hermes ops"
```

---

### Task 2: deployment-check API

**Files:**
- Create: `server/api/caw/deployment-check.get.ts`
- Modify: `app/stores/app.ts` — 添加 `fetchDeploymentCheck()`

- [ ] **Step 1: 实现 GET handler**

```ts
// server/api/caw/deployment-check.get.ts
import { getState } from '../../utils/app-store'
import { buildCawDeploymentCheck } from '../../utils/caw-deployment-check'
import { checkTssReadiness, getWalletStatusFromSdk } from '../../utils/caw-wallet-bootstrap'
// 注：getWalletStatusFromSdk 若未 export，在 Task 5 拆分时 export，或在本 task 内联只读 getWallet
```

Handler 流程：
1. `getState()`
2. 若有 `coboWalletId` 且 `isCoboConfigured`，调用 `checkTssReadiness` + `getWallet` status
3. `return buildCawDeploymentCheck(state, probe)`

- [ ] **Step 2: store 方法**

```ts
async function fetchDeploymentCheck() {
  return await $fetch<CawDeploymentCheck>('/api/caw/deployment-check')
}
```

- [ ] **Step 3: 手动验证**

Run: `pnpm dev`，curl `http://localhost:3000/api/caw/deployment-check`

- [ ] **Step 4: Commit**

```bash
git add server/api/caw/deployment-check.get.ts app/stores/app.ts
git commit -m "feat: expose CAW deployment-check API for ops UI"
```

---

### Task 3: 禁止 Hermes 分体下的 auto-provision

**Files:**
- Modify: `server/utils/caw-wallet-bootstrap.ts` — `ensureCawCredentials`
- Modify: `tests/caw-wallet-bootstrap.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
it('throws when hermes-agent-host runtime has no api key', async () => {
  vi.stubEnv('AGENT_WALLET_TSS_RUNTIME', 'hermes-agent-host')
  vi.stubEnv('AGENT_WALLET_API_KEY', '')
  const state = createState()
  await expect(bootstrap.ensureCawCredentials(state)).rejects.toThrow(/AGENT_WALLET_API_KEY/)
  expect(provisionCawPrincipal).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: 实现**

```ts
export async function ensureCawCredentials(state: AppState): Promise<void> {
  if (currentCoboApiKey(state)) return
  if (await syncCredentialsFromCli(state)) return
  if (state.settings.agentId) return

  const splitRuntime = process.env.AGENT_WALLET_TSS_RUNTIME === 'hermes-agent-host'
    || process.env.VERCEL === '1'
  if (splitRuntime) {
    throw new Error('AGENT_WALLET_API_KEY_REQUIRED')
  }
  await provisionCawPrincipal(state, { name: 'YieldAgent Dev' })
}
```

- [ ] **Step 3: API 错误文案**

Modify `server/api/wallet/preparation/create-agent.post.ts` 与 `agent-status.get.ts`：捕获 `AGENT_WALLET_API_KEY_REQUIRED`，返回 400 + 中文指引。

- [ ] **Step 4: 测试 PASS + 全量**

Run: `pnpm test tests/caw-wallet-bootstrap.test.ts && pnpm test`

- [ ] **Step 5: Commit**

```bash
git commit -m "fix: block auto-provision on Vercel/Hermes split deploy without API key"
```

---

### Task 4: Bootstrap 用户文案映射

**Files:**
- Create: `shared/utils/bootstrap-user-copy.ts`
- Create: `tests/bootstrap-user-copy.test.ts`
- Modify: `app/composables/useWalletPreparation.ts`
- Modify: `app/components/wallet/PrepStepAgent.vue`

- [ ] **Step 1: 纯函数测试**

```ts
// mapBootstrapUserCopy({ phase: 'tss_check', tssOnline: false, message: '...' })
// → { title, body, severity, ctaLabel?, ctaHref? }
```

覆盖 spec §3.4.1 表格中 5 种场景（可用 message 子串匹配）。

- [ ] **Step 2: composable 暴露**

```ts
const bootstrapUserCopy = computed(() =>
  mapBootstrapUserCopy({
    phase: bootstrap.value?.phase,
    tssOnline: bootstrap.value?.tssOnline,
    message: bootstrap.value?.message,
    pollAttempt: agentPollAttempt.value,
    maxPollAttempts: MAX_AGENT_POLL_ATTEMPTS,
  }),
)
```

- [ ] **Step 3: PrepStepAgent 使用 title/body 替代裸 `bootstrapMessage`**

保留技术 message 于 `<details>` 折叠「技术详情」。

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: map bootstrap phases to actionable user-facing copy"
```

---

## Chunk 2: A0 — Wallet 轮询 UX 与部署文档

### Task 5: 轮询进度与超时运维清单

**Files:**
- Modify: `app/composables/useWalletPreparation.ts`
- Modify: `app/components/wallet/PrepStepAgent.vue`

- [ ] **Step 1: 暴露 `agentPollAttempt` ref**

`pollAgentUntilDone` 内递增，模板显示 `第 {{ attempt }}/{{ max }} 次检查`。

- [ ] **Step 2: 超时展开 `WalletOpsChecklist` 内联块**

4 条清单（来自 spec）：
1. Vercel 已设 `AGENT_WALLET_API_KEY`（与 Hermes onboard 相同）
2. `AGENT_WALLET_MAIN_NODE_ID` 与 Hermes `caw node status` 一致
3. Hermes 上 `caw node start` 运行中
4. 若钱包长期 preparing → 重置后「导入已 onboard 钱包」

链接：`/dashboard/settings` + README 锚点。

- [ ] **Step 3: import 优先按钮顺序**

当 `AGENT_WALLET_TSS_RUNTIME=hermes-agent-host`（通过 deployment-check 或 settings 只读 flag），主按钮为「导入已 onboard 钱包」，次按钮为「创建 Agent Wallet」。

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: improve wallet bootstrap polling UX and ops checklist on timeout"
```

---

### Task 6: 部署文档

**Files:**
- Modify: `README.md`
- Modify: `docs/caw-integration.md`
- Modify: `.env.example`

- [ ] **Step 1: README 新增「Vercel + Hermes 生产部署」**

含 env 表、禁止 auto-provision 说明、403 排查树、import 优先流程。

- [ ] **Step 2: `.env.example` 标注 `AGENT_WALLET_API_KEY` 分体部署必填**

- [ ] **Step 3: Commit**

```bash
git commit -m "docs: add Vercel+Hermes split deployment guide and env requirements"
```

---

## Chunk 3: A1 — Dashboard 可信度

### Task 7: Active Pact 边界卡

**Files:**
- Create: `app/components/dashboard/DashboardActivePactCard.vue`
- Create: `app/utils/active-pact.ts`（纯选取逻辑）
- Create: `tests/active-pact.test.ts`
- Modify: `app/pages/dashboard/index.vue`

- [ ] **Step 1: `pickActivePact(pacts, strategies)` 测试**

优先 `status === 'active'`，其次 `awaiting-approval`；返回 maxSpend、whitelist、durationDays、remaining 估算。

- [ ] **Step 2: 组件 UI**

展示：Pact 名称/intent、maxSpend、已用/余量（若有 position API 则 fetch，否则仅 maxSpend）、允许 Recipes chip、到期时间、状态 chip。无 active 时显示「暂无 Active Pact」+ CTA 创建策略。

- [ ] **Step 3: dashboard/index.vue 置于 WalletBar 之后、StrategyList 之前**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: surface active Pact boundaries on dashboard home"
```

---

### Task 8: 拒绝演示引导卡

**Files:**
- Create: `app/components/dashboard/DashboardDenialDemoCard.vue`
- Modify: `app/pages/dashboard/index.vue`
- Modify: `app/pages/dashboard/pacts.vue`（可选：接收 query `demo=denial` 高亮 simulate 按钮）

- [ ] **Step 1: 卡片逻辑**

显示条件：`pacts.length > 0` 且用户未 dismiss（localStorage `denial-demo-dismissed`）且存在可 simulate 的 pact（active 或 pending）。

CTA：`router.push({ path: DASHBOARD_PACTS, query: { highlight: pactId } })`

- [ ] **Step 2: PactDetail 已有 simulate-denial 按钮 — 确保 query highlight 时 scrollIntoView**

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: add guided Pact boundary denial demo entry on dashboard"
```

---

### Task 9: 设置页部署自检 UI

**Files:**
- Create: `app/components/settings/CawDeploymentCheckCard.vue`
- Modify: `app/pages/dashboard/settings.vue`

- [ ] **Step 1: 组件消费 `/api/caw/deployment-check`**

展示 blockers 为红色列表、nextActions、env 模板「复制」按钮（`navigator.clipboard`）。

- [ ] **Step 2: 若 `preferEnvKey && apiKeySource === 'settings'` 显示警告**

「会话内 Key 可能在 Vercel 实例重启后丢失，请改用环境变量。」

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: add deployment self-check card on settings page"
```

---

### Task 10: 策略创建后 Cobo App 审批引导

**Files:**
- Modify: `app/pages/dashboard/create-strategy.vue`
- Reuse: `app/components/pacts/PactAppApprovalGuide.vue`

- [ ] **Step 1: pipeline `awaiting-approval` 阶段显示 modal / inline 引导**

复用现有 `PactAppApprovalGuide`，附链接到 `/dashboard/pacts?id=...`。

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: guide users to Cobo App approval after strategy submit"
```

---

## Chunk 4: A2 — 工程卫生（可选，A0/A1 完成后）

### Task 11: 拆分 caw-wallet-bootstrap

**Files:**
- Create: `server/utils/caw-tss-readiness.ts`
- Create: `server/utils/caw-sdk-wallet.ts`
- Modify: `server/utils/caw-wallet-bootstrap.ts` — re-export 保持对外 API 不变

- [ ] **Step 1: 移动 `checkTssReadiness` + `buildSdkPreparingMessage` → caw-tss-readiness.ts**

- [ ] **Step 2: 移动 `bootstrapViaSdkCreate`, `getWalletStatusFromSdk`, `resolveEvmAddressFromSdk` → caw-sdk-wallet.ts**

- [ ] **Step 3: 全量测试**

Run: `pnpm test`

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor: split caw-wallet-bootstrap into focused modules"
```

---

### Task 12: 拆分 useCreateStrategy

**Files:**
- Create: `app/composables/strategy-templates.ts`
- Create: `app/composables/useStrategyPipeline.ts`
- Modify: `app/composables/useCreateStrategy.ts`

- [ ] **Step 1: 移出 `TEMPLATE_PRESETS` / `STRATEGY_TEMPLATES`**

- [ ] **Step 2: 移出 pipeline stage 转换逻辑**

- [ ] **Step 3: useCreateStrategy 仅组合上述模块**

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor: extract strategy templates and pipeline from useCreateStrategy"
```

---

## Verification Checklist（全 Chunk 完成后）

- [ ] `pnpm test` 全绿
- [ ] `pnpm build` 成功（含 devtools patch）
- [ ] 本地 `.env` 配置 Hermes Key + MAIN_NODE_ID 后，Wallet 引导显示正确 user copy
- [ ] 无 Key 时 create-agent 返回明确 400，不触发 provision
- [ ] Dashboard 首屏可见 Active Pact 卡（有 active pact 时）
- [ ] 设置页 deployment-check 可复制 env 模板
- [ ] README 部署章节可被新运营者独立跟随

---

## Execution Order

1. Chunk 1（Task 1–3）— 阻塞性后端逻辑
2. Chunk 2（Task 4–6）— UX + 文档
3. Chunk 3（Task 7–10）— 产品可信度
4. Chunk 4（Task 11–12）— 仅时间充裕时

**Handoff:** Plan complete. Execute with @superpowers:executing-plans or subagent-driven-development per task.
