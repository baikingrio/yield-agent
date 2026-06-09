# YieldAgent 项目简化 Phase 3 + 命名清理设计

**日期**：2026-06-09  
**状态**：已评审（用户确认方案 1、§1–§5）  
**前置**：[2026-06-04-project-simplification-design.md](./2026-06-04-project-simplification-design.md)（Phase 1–2 已完成）  
**目标**：收尾用户主路径仅 Cobo、引入设置页开发者模式、完成遗留命名清理与文档对齐。不含 Phase 4（收益快照）。

---

## 背景与进度

| 阶段 | 状态 |
|------|------|
| Phase 1 去重 + 收益图降级 + 部分文档 | 已完成 |
| Phase 2 `demo` → `app` 重命名 | 已完成 |
| **Phase 3 用户路径仅 Cobo** | **部分完成**（服务端 `cobo-pact` 已有显式报错；UI / readiness 文案仍引导 local-draft） |
| Phase 4 收益快照 + 测试补强 | **本轮不做** |

用户决策：

| 项 | 选择 |
|----|------|
| 范围 | 收尾 Phase 3 + 命名清理 + 文档（不做 Phase 4） |
| 本地 Draft UI | 设置页「开发者模式」开关 |
| 校验层级 | 服务端 + UI 双向校验 |
| 交付方式 | 单 PR 一次交付 |

---

## 非目标（YAGNI）

- Phase 4 收益链上快照与 APY 引擎
- E2E 测试
- 主网 / 生产资金相关改动
- 修改内部类型 `CawPactMode` 枚举值（仅改用户可见文案）
- 删除 `CAW_FORCE_LOCAL_DRAFT` 环境变量（保留给 CI / 本地脚本）

---

## §1 开发者模式（核心行为）

### 1.1 数据模型

在 `AppSettings` 增加：

```ts
developerMode?: boolean  // 默认 false，经 PUT /api/settings 持久化到 SQLite
```

`server/api/settings/index.put.ts` 的 Zod schema 增加可选字段 `developerMode: z.boolean().optional()`。

### 1.2 统一判定

新建 `server/utils/local-draft-policy.ts`：

```ts
export function isLocalDraftAllowed(state: AppState): boolean {
  return state.settings.developerMode === true
    || process.env.CAW_FORCE_LOCAL_DRAFT === 'true'
}
```

- **用户面向**：设置页开关控制 `developerMode`
- **CI / 脚本**：`CAW_FORCE_LOCAL_DRAFT=true` 仍可绕过，现有 `cobo-pact-submit.test.ts` 等无需大改

### 1.3 服务端变更

| 模块 | 行为 |
|------|------|
| `server/utils/cobo-pact.ts` — `submitYieldPactToCobo` | Cobo 未配置或提交失败回退时：仅 `isLocalDraftAllowed(state)` 为真才返回 `mode: 'local-draft'`，否则 `throw` 含设置页指引的错误 |
| `server/api/pacts/[id]/approve.post.ts` | `submissionMode === 'local-draft'` 且 `!isLocalDraftAllowed(state)` → `403`，文案说明需开启开发者模式 |
| `server/utils/caw-readiness.ts` | `nextAction` 在缺 API Key 时不再写「只能创建本地 Pact Draft」；改为引导完成 Cobo 配置 |

### 1.4 UI 变更

| 模块 | 行为 |
|------|------|
| `app/components/settings/SettingsForm.vue` | 底部增加「开发者模式」折叠区：`checkbox` + 警告（仅用于无 Cobo 时的本地 Draft 调试，无法链上执行） |
| `app/pages/dashboard/settings.vue` | `save` 时透传 `developerMode` |
| `app/components/pacts/PactDetail.vue` | `canApproveLocal`：`store.settings.developerMode && isLocalDraft && status in pending/awaiting-approval`（**移除** `import.meta.dev` 门控） |
| `app/composables/usePactManagement.ts` | `approveLocalDraft` 行为不变；按钮由 `PactDetail` 门控 |
| `app/composables/useCreateStrategy.ts` | 提交结果 `submissionMode === 'local-draft'`：未开开发者模式 → error banner；已开启 → info 提示 |

### 1.5 设置页开关 UX

- 默认折叠在「高级 / 开发者」区块，避免普通用户误触
- 开启时无需二次弹窗（用户已确认）；文案明确说明无法执行链上 Recipe

---

## §2 用户可见文案

内部类型 `CawPactMode`、`submissionMode` 枚举值**保持不变**。

| 位置 | 现文案 | 新文案 |
|------|--------|--------|
| `CawReadinessCard` modeLabel | `本地 Pact Draft` | `配置未完成` |
| `caw-readiness.ts` nextAction（缺 API Key） | `只能创建本地 Pact Draft` | `请完成 Cobo API Key 配置（Provision 或设置页）` |
| `PactDetail` 批准按钮 | `本地模拟批准` | `开发者：本地模拟批准`（仅 `developerMode` 时显示） |
| `CawReadinessCard` 描述段 | 提及「创建本地 Draft」为主路径 | 改为「检查是否可提交真实 Cobo Pact」 |

`docs/caw-integration.md` 同步：`local-draft` 对用户为「配置未完成」状态，非主流程。

---

## §3 命名清理

机械重命名，**运行时行为不变**（除 §1 开发者模式外）。

| 现路径 / 符号 | 新路径 / 符号 |
|---------------|---------------|
| `server/utils/strip-demo-seed.ts` | `server/utils/strip-legacy-seed.ts` |
| `stripDemoSeedData` | `stripLegacySeedData` |
| `tests/strip-demo-seed.test.ts` | `tests/strip-legacy-seed.test.ts` |
| `shared/types/app.ts` 内 `NETWORK_LABELS` | `shared/constants/network.ts`（`app.ts` 可 re-export 一版以保持 import 兼容，或全量改 import） |
| `.data/demo-session.json` 路径常量 | `app-session.json`（`server/utils/app-state-persistence.ts`） |
| `demoTxHash`（create-strategy 相关） | `previewTxHash` |

**有意保留**：

- `strip-legacy-prep.ts` 中 `0xdemo`、`demo eoa` 等历史 fixture 检测
- `strip-legacy-seed.ts` 中 `pact-demo-*`、`str-demo-*` 前缀（识别旧种子数据）

---

## §4 文档同步

| 文件 | 更新要点 |
|------|----------|
| `README.md` | 开发者模式说明；用户主路径仅 Cobo；`CAW_FORCE_LOCAL_DRAFT` 仅供 CI |
| `PRODUCT.md` | 同上；移除 demo store 等过时描述 |
| `docs/caw-integration.md` | local-draft 与开发者模式关系 |
| `docs/YieldAgent_Technical_Architecture.md` | `AppSettings.developerMode`、`local-draft-policy` |
| `.env.example` | 注释 `CAW_FORCE_LOCAL_DRAFT` 为 CI/脚本用途 |
| `2026-06-04-project-simplification-design.md` 文首 | 标注 Phase 1–2 已完成，Phase 3 见本文档 |

---

## §5 测试与验收

### 5.1 新增 / 更新测试

| 文件 | 用例 |
|------|------|
| `tests/local-draft-policy.test.ts` | `developerMode` / `CAW_FORCE_LOCAL_DRAFT` 组合 |
| `tests/cobo-pact-submit.test.ts` | 无 developerMode 且无 env 时 throw；`CAW_FORCE_LOCAL_DRAFT` 或 settings 开启时 local-draft |
| `tests/pact-approve.test.ts`（新建或扩展现有） | local-draft approve 在无 developerMode 时 403 |
| `tests/caw-readiness.test.ts` | 更新 nextAction / 展示相关断言 |
| `tests/strip-legacy-seed.test.ts` | 自 `strip-demo-seed` 迁移 |

### 5.2 验收清单

- [ ] 默认设置：创建策略失败提示指向 Cobo 配置，不出现「本地 Draft 已成功」用户路径
- [ ] 设置页开启开发者模式：可创建 local-draft，Pact 详情显示「开发者：本地模拟批准」
- [ ] 关闭开发者模式后：local-draft approve API 返回 403
- [ ] `rg "useDemoStore|demo-store|types/demo"` 无结果（归档文档除外）
- [ ] `rg "const NETWORK_LABELS"` 仅 `shared/constants/network.ts`
- [ ] `rg "strip-demo-seed"` 无结果
- [ ] `npm test` 与 `npm run build` 通过

---

## 实施顺序

```text
1. local-draft-policy + AppSettings.developerMode + settings API
2. cobo-pact / approve / caw-readiness 服务端
3. SettingsForm + PactDetail + useCreateStrategy UI
4. 命名清理（strip-legacy-seed、network.ts、previewTxHash、app-session.json）
5. 文档 + 测试
6. npm test && npm run build
```

---

## 风险与回滚

| 风险 | 缓解 |
|------|------|
| Vercel 演示环境误开开发者模式 | 文案警告；默认 false；可在答辩前确认设置 |
| 重命名漏改 | 单次 PR + `rg` 全量检查 + build |
| 测试依赖 `CAW_FORCE_LOCAL_DRAFT` | `isLocalDraftAllowed` 保留 env OR 分支 |

回滚：单 PR revert 即可。

---

## 下一步

使用 **writing-plans** 技能生成分任务实施计划。
