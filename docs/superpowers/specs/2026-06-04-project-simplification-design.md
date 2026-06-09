# YieldAgent 项目简化优化设计

**日期**：2026-06-04  
**状态**：Phase 1–2 已完成；Phase 3 续篇见 [2026-06-09-project-simplification-phase3-design.md](./2026-06-09-project-simplification-phase3-design.md)  
**目标**：在保持 Cobo 真实主链路的前提下，平衡降低维护成本、用户认知负担与长期可运营性。

---

## 背景

项目已从 MVP mock 演进到 SQLite 持久化 + Cobo SDK 测试网执行，但 `demo-*` 命名、半实现功能（收益图）、`local-draft` 双模式、重复 util 与滞后文档仍增加维护与认知成本。

用户选择 **D（三者平衡）**，并对各节确认如下：

| 节 | 决策 |
|----|------|
| 1 命名 | **同意** |
| 2 收益图 | **同意**（先降级 UI；链上快照写入为可选 Phase 4） |
| 3 双模式 | **用户路径仅 Cobo**（`local-draft` 仅开发降级，不出现在用户主流程） |
| 4 去重/文档/测试 | **同意** |

---

## 非目标（YAGNI）

- 不重写整体架构或合并为单页应用
- 不删除 Cobo 真实执行/赎回路径
- 不一次性补全全部 API route 测试或 E2E
- 不在本迭代实现完整收益 APY 引擎（Phase 4 可选最小快照）

---

## Phase 1：去重、文档、Dashboard 收益图降级

### 1.1 共享常量与 lookup

**新增** `shared/constants/network.ts`：

- 导出 `NETWORK_LABELS: Record<NetworkId, string>`
- 前后端均从此处引用，删除以下文件中的重复定义：
  - `app/composables/useWalletPreparation.ts`
  - `app/composables/useCreateStrategy.ts`
  - `app/composables/useWalletConnect.ts`
  - `app/components/wallet/PrepStepEoa.vue`
  - `app/components/dashboard/StrategyList.vue`
  - `server/utils/agent-gas.ts`

**新增** `server/utils/pact-lookup.ts`：

```ts
export function findPactById(state: AppState, id: string): Pact | undefined
```

匹配规则：`p.id === id || p.coboPactId === id`（与现 handler 行为一致）。

**替换** `server/api/pacts/[id]/` 下全部 handler 的内联查找。

**合并** `server/utils/pact-redeem-credentials.ts` → `server/utils/pact-credentials.ts`：

- `resolveRedeemApiKey` 作为同文件导出
- 更新 `cobo-execution.ts`、`tests/pact-redeem-credentials.test.ts` 的 import
- 删除 `pact-redeem-credentials.ts`

### 1.2 Dashboard 收益图降级（2a）

**文件**：`app/components/dashboard/YieldChart.vue`、`app/pages/dashboard.vue`

**行为**：

- `yieldSeries7d/30d` 为空或全零时：不渲染 Chart.js 画布
- 显示说明块：「收益同步尚未开启。当前可在 Pact 详情查看链上仓位。」
- 可选链接至 `/pacts` 或当前 active Pact
- 有数据时保持现有图表行为

**布局**：Dashboard 区块顺序保持 PRODUCT 优先级——Pact/策略状态与近期日志优先，收益图降为次要折叠区或置底。

### 1.3 文档同步

| 文件 | 更新要点 |
|------|----------|
| `README.md` | 赎回、`position.get`、Gas 预检；删除 balanceOf 预检等过时描述 |
| `PRODUCT.md` | 注资改为 EOA ERC20 + 链上校验 + Cobo 余额同步 |
| `DESIGN.md` | dashboard/pacts/history 为已交付表面；landing 组件 |
| `docs/YieldAgent_Technical_Architecture.md` | SQLite 已落地；执行/赎回模块 |

**归档标注**：`docs/superpowers/2026-06-03-frontend-mvp*.md` 文首增加：

> 历史文档（MVP mock 阶段），勿作当前实现依据。见 `2026-06-04-project-simplification-design.md`。

### 1.4 Phase 1 验收

- [ ] `rg NETWORK_LABELS` 仅命中 `shared/constants/network.ts` 与 re-export（若有）
- [ ] `rg "pact-redeem-credentials"` 无结果
- [ ] Dashboard 无数据时不出现空白图表
- [ ] `npm test` 与 `npm run build` 通过

---

## Phase 2：`demo` → `app` 重命名

机械重命名，**运行时行为不变**。

| 现路径/符号 | 新路径/符号 |
|-------------|-------------|
| `shared/types/demo.ts` | `shared/types/app.ts` |
| `DemoState` 及关联类型 | `AppState` 等（同文件内） |
| `server/utils/demo-store.ts` | `server/utils/app-store.ts` |
| `getState` / `persistCurrentState` 等 | 保留函数名，改 import 路径 |
| `app/stores/demo.ts` | `app/stores/app.ts` |
| `useDemoStore` | `useAppStore` |
| `tests/strip-demo-seed.test.ts` | 可保留或改为 `strip-legacy-seed.test.ts` |

**范围**：全仓库 `grep demo-store|useDemoStore|DemoState|types/demo` 并更新；测试与 server utils 一并替换。

**Pinia store id**：`defineStore('app', ...)`（原为 `demo` 则改之）。

### Phase 2 验收

- [ ] 无 `from '.../demo'` 或 `useDemoStore` 残留（除归档文档中的历史引用）
- [ ] `npm test` + `npm run build` 通过
- [ ] README 不再描述「demo store」

---

## Phase 3：用户路径仅 Cobo

### 3.1 原则

- **用户可见主路径**：Cobo Pact 提交 → App 审批 → 执行 → 赎回
- **`local-draft`**：仅当 `CAW_FORCE_LOCAL_DRAFT=true` 时服务端降级；不在 UI 引导用户进入 draft 流程

### 3.2 代码与 UI 变更

**`server/utils/cobo-pact.ts`**：

- `submitYieldPactToCobo` 在 Cobo 未配置且未 force draft 时：抛出明确错误（含设置页 / `.env` 指引），不静默 `local-draft`

**`app/pages/create-strategy.vue` / `PactPreview.vue`**：

- 移除或隐藏「本地 Draft 批准」面向普通用户的按钮（`approveLocal` 仅 dev 或删除公开入口）

**`app/composables/usePactManagement.ts`**：

- `approveLocalDraft`：若保留，仅 `import.meta.dev` 或 settings 开发开关下可用

**`.env.example`**：

```env
# 仅本地开发、无 Cobo 凭证时使用；生产与用户演示勿开启
# CAW_FORCE_LOCAL_DRAFT=true
```

### 3.3 Phase 3 验收

- [ ] 默认 `.env` 下创建策略失败时错误信息指向 Cobo 配置，不出现「本地 Draft 已批准」成功路径
- [ ] 用户文档无「可选 local-draft 演示」作为主流程
- [ ] `CAW_FORCE_LOCAL_DRAFT=true` 时现有测试/开发路径仍可用

---

## Phase 4（可选后续迭代）：收益快照 + 测试补强

### 4.1 收益快照（2b，可选）

- 执行成功或定时任务：读取 Compound `balanceOf`，与上次快照差值 append 到 `yieldSeries7d`
- 仅 7d 滚动窗口；不计算复杂 APY
- 有数据后 Dashboard 自动展示图表（复用 2a 条件渲染）

### 4.2 测试补强

| 模块 | 用例 |
|------|------|
| `server/utils/pact-lookup.ts` | id / coboPactId 查找 |
| `server/utils/cobo-execution.ts` | request id、withdraw calldata、redeem 前置（mock） |
| `server/utils/yield-position.ts` | Compound 单参 balanceOf（mock viem） |
| `server/utils/pact-credentials.ts` | merge 后 redeem key 解析 |

目标：新增约 8–12 个测试，不覆盖 API handler 层。

---

## 实施顺序

```text
Phase 1  → 去重 + 文档 + Dashboard 降级     （优先，低风险）
Phase 2  → demo→app 重命名                   （机械，全仓）
Phase 3  → 用户路径仅 Cobo                   （行为收紧）
Phase 4  → 收益快照 + 测试（可选，另开 PR）
```

---

## 风险与回滚

| 风险 | 缓解 |
|------|------|
| 重命名漏改导致编译失败 | Phase 2 单次 PR + 全量 grep + build |
| 去掉 local-draft UI 影响无 Cobo 演示 | 文档标明 `CAW_FORCE_LOCAL_DRAFT`；dev 保留 |
| 收益图隐藏后 Dashboard 显空 | 2a 文案 + 链上仓位链接 |

回滚：各 Phase 独立 PR，可逐 PR revert。

---

## 开放问题（已关闭）

- 命名方案：采用 `app` 前缀（用户同意 §1）
- 收益图：先降级（用户同意 §2）
- local-draft：用户路径仅 Cobo（用户 §3）
- 测试范围：第四节同意，不含 E2E

---

## 下一步

用户审阅本文档后，使用 **writing-plans** 技能生成分 Phase 实施计划（任务清单 + 文件级 diff 指引）。
