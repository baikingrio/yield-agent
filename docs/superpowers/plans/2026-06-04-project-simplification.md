# YieldAgent 项目简化优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 降低 YieldAgent 维护与用户认知成本：去重共享模块、Dashboard 收益图降级、`demo`→`app` 重命名、用户主路径仅 Cobo，并同步文档。

**Architecture:** 分三个独立可验收 Phase 交付；每 Phase 结束 `npm test` + `npm run build` 必须通过。Phase 1 用 `DemoState` 类型，Phase 2 统一改为 `AppState`。Phase 4（收益快照）本计划不实施，留作后续 PR。

**Tech Stack:** Nuxt 4, Nitro, Pinia, Vitest, SQLite, @cobo/agentic-wallet, viem

**Spec:** `docs/superpowers/specs/2026-06-04-project-simplification-design.md`

---

## File Map

| 操作 | 路径 | 职责 |
|------|------|------|
| Create | `shared/constants/network.ts` | 唯一 `NETWORK_LABELS` 源 |
| Create | `server/utils/pact-lookup.ts` | `findPactById` |
| Create | `tests/pact-lookup.test.ts` | lookup 单测 |
| Modify | `server/utils/pact-credentials.ts` | 合并 `resolveRedeemApiKey` |
| Delete | `server/utils/pact-redeem-credentials.ts` | 并入上者 |
| Modify | `server/api/pacts/[id]/*.ts` (7 files) | 使用 `findPactById` |
| Modify | `app/components/dashboard/YieldChart.vue` | 无数据降级 UI |
| Modify | `app/pages/dashboard.vue` | 收益图置底 |
| Modify | 6+ 文件 | 删除本地 `NETWORK_LABELS` |
| Rename | `shared/types/demo.ts` → `app.ts` | 类型 + `AppState` |
| Rename | `server/utils/demo-store.ts` → `app-store.ts` | 服务端状态 |
| Rename | `app/stores/demo.ts` → `app.ts` | Pinia `useAppStore` |
| Modify | `server/utils/cobo-pact.ts` | Cobo 未配置时显式报错 |
| Modify | `PactDetail.vue`, `usePactManagement.ts` | 隐藏 local-draft UI |
| Modify | `.env.example`, `README.md`, `PRODUCT.md`, `DESIGN.md` | 文档 |

---

## Phase 1：去重、Dashboard 降级、文档

### Task 1: `NETWORK_LABELS` 共享常量

**Files:**
- Create: `shared/constants/network.ts`
- Modify: `app/composables/useWalletPreparation.ts`
- Modify: `app/composables/useCreateStrategy.ts`
- Modify: `app/composables/useWalletConnect.ts`
- Modify: `app/components/wallet/PrepStepEoa.vue`
- Modify: `app/components/dashboard/StrategyList.vue`
- Modify: `server/utils/agent-gas.ts`

- [ ] **Step 1: 创建共享常量**

```ts
// shared/constants/network.ts
import type { NetworkId } from '../types/demo'

export const NETWORK_LABELS: Record<NetworkId, string> = {
  'base-sepolia': 'Base Sepolia',
  'arbitrum-sepolia': 'Arbitrum Sepolia',
}
```

- [ ] **Step 2: 各文件删除本地 `NETWORK_LABELS`，改为 import**

```ts
import { NETWORK_LABELS } from '../../shared/constants/network'
// 或相对路径按文件深度调整
```

`useWalletConnect.ts` 若 export `NETWORK_LABELS` 给外部，改为 re-export：

```ts
export { NETWORK_LABELS } from '../../shared/constants/network'
```

`agent-gas.ts` 保留 `export { NETWORK_LABELS }` re-export 或改为从 shared import 后不再 export（`gas-status.get.ts` 改 import 源）。

- [ ] **Step 3: 验证无重复定义**

Run: `rg "const NETWORK_LABELS" --glob '*.{ts,vue}'`
Expected: 仅 `shared/constants/network.ts`

- [ ] **Step 4: 测试**

Run: `npm test && npm run build`

---

### Task 2: `findPactById` + pact API handlers

**Files:**
- Create: `server/utils/pact-lookup.ts`
- Create: `tests/pact-lookup.test.ts`
- Modify: `server/api/pacts/[id].get.ts`
- Modify: `server/api/pacts/[id]/approve.post.ts`
- Modify: `server/api/pacts/[id]/execute.post.ts`
- Modify: `server/api/pacts/[id]/terminate.post.ts`
- Modify: `server/api/pacts/[id]/simulate-denial.post.ts`
- Modify: `server/api/pacts/[id]/position.get.ts`
- Modify: `server/api/pacts/[id]/redeem.post.ts`

- [ ] **Step 1: 写失败测试**

```ts
// tests/pact-lookup.test.ts
import { describe, expect, it } from 'vitest'
import type { DemoState, Pact } from '../shared/types/demo'
import { findPactById } from '../server/utils/pact-lookup'

function stateWith(pact: Pact): DemoState {
  return {
    wallet: { address: '', totalAssetsUsdc: 0, currentApy: 0, cumulativeYieldUsdc: 0 },
    walletPreparation: {} as DemoState['walletPreparation'],
    strategies: [],
    pacts: [pact],
    logs: [],
    yieldSeries7d: [],
    yieldSeries30d: [],
    settings: {} as DemoState['settings'],
  }
}

describe('findPactById', () => {
  it('finds by internal id', () => {
    const pact = { id: 'p1', coboPactId: 'cobo-1' } as Pact
    expect(findPactById(stateWith(pact), 'p1')?.id).toBe('p1')
  })

  it('finds by coboPactId', () => {
    const pact = { id: 'p1', coboPactId: 'cobo-1' } as Pact
    expect(findPactById(stateWith(pact), 'cobo-1')?.id).toBe('p1')
  })

  it('returns undefined when missing', () => {
    expect(findPactById(stateWith({ id: 'p1' } as Pact), 'missing')).toBeUndefined()
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `npm test -- tests/pact-lookup.test.ts`
Expected: FAIL module not found

- [ ] **Step 3: 实现**

```ts
// server/utils/pact-lookup.ts
import type { DemoState, Pact } from '../../shared/types/demo'

export function findPactById(state: DemoState, id: string): Pact | undefined {
  return state.pacts.find((p) => p.id === id || p.coboPactId === id)
}
```

- [ ] **Step 4: 替换各 handler**

将形如：

```ts
const pact = state.pacts.find((p) => p.id === id || p.coboPactId === id)
```

替换为：

```ts
import { findPactById } from '../../../utils/pact-lookup'
// ...
const pact = findPactById(state, id)
```

注意 `[id].get.ts` 路径为 `../../utils/pact-lookup`。

- [ ] **Step 5: 测试通过**

Run: `npm test`

---

### Task 3: 合并 `pact-redeem-credentials` → `pact-credentials`

**Files:**
- Modify: `server/utils/pact-credentials.ts`
- Modify: `server/utils/cobo-execution.ts`
- Modify: `tests/pact-redeem-credentials.test.ts`
- Delete: `server/utils/pact-redeem-credentials.ts`

- [ ] **Step 1: 将 `resolveRedeemApiKey` 函数体移入 `pact-credentials.ts` 并 export**

保持 `tests/pact-redeem-credentials.test.ts` 逻辑不变，仅改 import：

```ts
import { resolveRedeemApiKey } from '../server/utils/pact-credentials'
```

- [ ] **Step 2: 更新 `cobo-execution.ts` import**

```ts
import { resolveRedeemApiKey, ... } from './pact-credentials'
```

- [ ] **Step 3: 删除 `pact-redeem-credentials.ts`**

Run: `rg pact-redeem-credentials`
Expected: 无匹配

- [ ] **Step 4: `npm test`**

---

### Task 4: Dashboard 收益图降级

**Files:**
- Modify: `app/components/dashboard/YieldChart.vue`
- Modify: `app/pages/dashboard.vue`

- [ ] **Step 1: `YieldChart.vue` 增加 `hasData` computed**

```ts
const hasData = computed(() => {
  const pts = props.series?.points ?? []
  return pts.length > 0 && pts.some((p) => p.cumulativeUsdc !== 0)
})
```

- [ ] **Step 2: 替换空状态模板**

将 `v-else-if="!series?.points.length"` 改为 `v-else-if="!hasData"`，文案更新为：

```html
<div class="mt-4 rounded-md border border-hairline bg-canvas px-4 py-5">
  <p class="text-sm text-body">收益同步尚未开启。</p>
  <p class="mt-2 text-sm text-[var(--color-muted-strong)]">
    可在
    <NuxtLink to="/pacts" class="text-primary no-underline hover:underline">Pact 管理</NuxtLink>
    查看链上仓位与赎回状态。
  </p>
</div>
```

有数据时保留 Chart；`loading` skeleton 不变。

- [ ] **Step 3: `dashboard.vue` 将 `DashboardYieldChart` 区块移到页面底部**（在 `RecentLogsTable` 之后），确保首屏为 WalletBar + StrategyList + Logs。

- [ ] **Step 4: 手动验证 + build**

Run: `npm run build`

---

### Task 5: 文档同步（Phase 1）

**Files:**
- Modify: `README.md`
- Modify: `PRODUCT.md`
- Modify: `DESIGN.md`
- Modify: `docs/YieldAgent_Technical_Architecture.md`
- Modify: `docs/superpowers/specs/2026-06-03-frontend-mvp-design.md`（及 plans 若存在）

- [ ] **Step 1: README** — 补充 `POST /api/pacts/:id/redeem`、`GET .../position`、Gas 预检；删除「balanceOf 预检即完成」；`stores/demo.ts` 暂保留文件名（Phase 2 再改）。

- [ ] **Step 2: PRODUCT.md** — 注资段落改为：EOA ERC20 转账 + `deposit-verify` 链上校验 + Cobo `listBalances` 同步。

- [ ] **Step 3: DESIGN.md** — 更新 routes 列表含 landing、`/pacts` 生产态；去掉 dashboard placeholder 表述。

- [ ] **Step 4: Technical Architecture** — §持久化改为 SQLite 已落地；增加 redeem/position 模块一句。

- [ ] **Step 5: MVP 历史文档** — 文首加归档声明（spec 中模板）。

---

### Phase 1 完成检查

- [ ] `npm test`
- [ ] `npm run build`
- [ ] `rg "const NETWORK_LABELS"` 仅 shared
- [ ] `rg pact-redeem-credentials` 无结果

---

## Phase 2：`demo` → `app` 重命名

### Task 6: 重命名类型文件

**Files:**
- Rename: `shared/types/demo.ts` → `shared/types/app.ts`
- Modify: `shared/types/app.ts` — `DemoState` → `AppState`（及文件内所有 `Demo*` 前缀类型若存在；`LogEntry` 等无 Demo 前缀保持不变）

- [ ] **Step 1: `git mv shared/types/demo.ts shared/types/app.ts`**

- [ ] **Step 2: 文件内 `export type DemoState` → `export type AppState`**

- [ ] **Step 3: 全仓替换 import**

Run 批量替换（完成后人工 spot-check）：

```bash
rg -l "shared/types/demo" | xargs sed -i '' 's|shared/types/demo|shared/types/app|g'
rg -l "from '\.\./\.\./shared/types/demo'" # 按实际深度逐层替换
```

同时替换 `DemoState` → `AppState`（`rg DemoState` 确认范围，排除归档 md）。

- [ ] **Step 4: 更新 `server/utils/pact-lookup.ts` 签名为 `AppState`**

- [ ] **Step 5: `npm test && npm run build`**

---

### Task 7: 重命名服务端 store

**Files:**
- Rename: `server/utils/demo-store.ts` → `server/utils/app-store.ts`
- Modify: `server/utils/demo-state-persistence.ts` — import 路径（文件名可保留，仅改 import）

- [ ] **Step 1: `git mv server/utils/demo-store.ts server/utils/app-store.ts`**

- [ ] **Step 2: 全仓 `demo-store` → `app-store` import 替换**

- [ ] **Step 3: `npm test && npm run build`**

---

### Task 8: 重命名 Pinia store

**Files:**
- Rename: `app/stores/demo.ts` → `app/stores/app.ts`
- Modify: 全仓 `useDemoStore` → `useAppStore`

- [ ] **Step 1: 移动并重命名 store 文件**

```ts
// app/stores/app.ts
export const useAppStore = defineStore('app', () => { ... })
```

- [ ] **Step 2: Nuxt 自动导入会识别 `stores/app.ts`；全仓替换 `useDemoStore`**

- [ ] **Step 3: README 删除「demo store」表述，改为 `useAppStore` / `app-store`**

- [ ] **Step 4: `npm test && npm run build`**

---

### Task 9: 测试与 strip 文件命名（可选）

**Files:**
- Optional rename: `tests/strip-demo-seed.test.ts` → `tests/strip-legacy-seed.test.ts`
- Modify: `server/utils/strip-demo-seed.ts` 注释更新

- [ ] **Step 1: 若重命名测试文件，更新 import 路径**

- [ ] **Step 2: `rg "useDemoStore|demo-store|types/demo|DemoState"` 应仅剩 docs 历史引用**

---

### Phase 2 完成检查

- [ ] `npm test && npm run build`
- [ ] README / PRODUCT 无 demo store 主路径描述

---

## Phase 3：用户路径仅 Cobo

### Task 10: 服务端禁止静默 local-draft

**Files:**
- Modify: `server/utils/cobo-pact.ts`
- Modify: `tests/cobo-pact-submit.test.ts`

- [ ] **Step 1: 在 `submitYieldPactToCobo` 入口明确分支**

当 `!isCoboConfigured()` 且 `process.env.CAW_FORCE_LOCAL_DRAFT !== 'true'`：

```ts
throw new Error(
  'Cobo API 未配置。请在设置页填写 Cobo API Key，或配置 AGENT_WALLET_API_KEY。本地开发可设置 CAW_FORCE_LOCAL_DRAFT=true。',
)
```

移除或收窄「未配置时自动返回 local-draft」的静默分支（仅 `CAW_FORCE_LOCAL_DRAFT=true` 时保留现有 local-draft 返回）。

- [ ] **Step 2: 更新 `cobo-pact-submit.test.ts`**

- 无 env 时期望 throw（或 API 层 502），而非 `mode: 'local-draft'`
- 保留 `CAW_FORCE_LOCAL_DRAFT=true` 用例

- [ ] **Step 3: `npm test`**

---

### Task 11: UI 隐藏 local-draft 批准

**Files:**
- Modify: `app/components/pacts/PactDetail.vue`
- Modify: `app/pages/pacts.vue`
- Modify: `app/composables/usePactManagement.ts`
- Modify: `app/composables/useCreateStrategy.ts`（local-draft 成功提示）

- [ ] **Step 1: `PactDetail.vue` — `canApproveLocal` 增加 dev 门控**

```ts
const canApproveLocal = computed(
  () => import.meta.dev
    && isLocalDraft.value
    && props.pact
    && ['pending', 'awaiting-approval'].includes(props.pact.status),
)
```

生产构建下按钮不渲染。

- [ ] **Step 2: `useCreateStrategy.ts` — 提交结果 `local-draft` 时改为错误 banner**（非生产路径；若 force draft 仅 dev 可保留 info 提示）

- [ ] **Step 3: 确认 `pacts.vue` 无用户可见「本地 Draft」主流程文案**

- [ ] **Step 4: `npm run build`**

---

### Task 12: `.env.example` 与文档

**Files:**
- Modify: `.env.example`
- Modify: `README.md`（Cobo 配置必需说明）

- [ ] **Step 1: 添加注释块**

```env
# 仅本地开发、无 Cobo 凭证时使用；用户演示与生产勿开启
# CAW_FORCE_LOCAL_DRAFT=true
```

- [ ] **Step 2: README 本地开发章节说明双模式**

---

### Phase 3 完成检查

- [ ] 默认 env 创建策略 → 明确 Cobo 配置错误
- [ ] `CAW_FORCE_LOCAL_DRAFT=true` 测试仍绿
- [ ] `npm test && npm run build`

---

## Phase 4（本计划不实施，后续 PR）

- 收益快照写入 `yieldSeries7d`
- `cobo-execution.ts` / `yield-position.ts` 扩展单测

---

## Spec Coverage Self-Review

| Spec 要求 | 任务 |
|-----------|------|
| NETWORK_LABELS 去重 | Task 1 |
| findPactById | Task 2 |
| pact-credentials 合并 | Task 3 |
| Dashboard 2a | Task 4 |
| 文档同步 | Task 5, 12 |
| demo→app 重命名 | Task 6–9 |
| 用户路径仅 Cobo | Task 10–12 |
| Phase 4 测试/收益 | 标注延后 |

无 TBD 步骤；类型 Phase 1 用 `DemoState`，Phase 2 统一 `AppState`。

---

## 建议提交粒度

```text
commit 1: feat: shared NETWORK_LABELS and pact lookup helpers
commit 2: feat: merge pact redeem credentials module
commit 3: fix: dashboard yield chart empty state
commit 4: docs: sync README PRODUCT DESIGN architecture
commit 5: refactor: rename demo types and app store (Phase 2)
commit 6: feat: require Cobo config for user pact submission (Phase 3)
```

用户未要求时勿自动 push。
