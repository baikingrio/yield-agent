# YieldAgent

YieldAgent 是一个面向 AI Web3 School / Cobo Agentic Commerce Hackathon 的 **Pact-first DeFi 策略 Agent 控制台**。

项目目标不是让 AI Agent 无限接管用户钱包，而是通过 **Cobo Agentic Wallet（CAW）+ Pact 权限边界**，让 Agent 只能在用户明确授权的预算、资产、网络、协议、期限和审计要求内提出并执行策略动作。

当前版本是 **测试网 / Demo-first Hackathon 原型**：评审可以从落地页点击 **Try Demo** 直接进入控制台，先理解 YieldAgent 的 CAW / Pact 安全模型；真实 EOA 连接、CAW 配对、测试网资金注入和真实执行保留为高级路径。

> 核心原则：**Agent proposes. Policy decides. CAW executes only when allowed.**

## 当前状态

- **Demo-first 已启用**：落地页主 CTA 是 `Try Demo`，无需先连接浏览器钱包即可进入 `/dashboard`。
- **预置 CAW Agent Wallet 模式**：公开评审链接建议使用已有 active CAW wallet UUID，服务端从 Cobo 同步 EVM 地址与 USDC 余额，避免多人访问时重复 `createWallet`。
- **真实 Cobo Pact 路径**：创建策略会提交 Cobo Pact；Pact active 后执行 Recipe；失败不再用前端 mock 流水线伪装成功。
- **执行凭证边界已收紧**：active Pact 执行必须使用 Cobo 返回的 pact-scoped key / Pact 子 Key；缺少子 Key 时会刷新 Pact credential 或停止，不再 silent fallback 到 Agent 主 Key。
- **`src_addr` 显式传入**：Cobo contract call 要求来源地址，执行时使用 Agent Wallet EVM 地址。
- **SQLite 状态存储**：本地默认 `.data/yieldagent.db`；Vercel 未配置持久路径时使用 `/tmp/yieldagent.db`，适合 Demo 但不适合长期多用户生产。
- **重点回归用例**：preset demo wallet、wallet API 与 Pact credential 相关测试覆盖 preset wallet 与 Pact credential 边界。

## 核心流程

```text
Landing Page
  -> Try Demo
  -> Dashboard
  -> Preset CAW Agent Wallet / Demo State
  -> Strategy Proposal
  -> Pact Preview / Policy Boundary
  -> Cobo App Approval
  -> Pact-scoped Execution
  -> Execution / Pending / Denial
  -> SQLite Audit Log
```

真实资金边界：

```text
User EOA Wallet
  -> transfer testnet USDC
CAW Agent Wallet
  -> Pact: max budget + allowlist + duration + revenue split
Executor Agent
  -> allowed Recipe only, with pact-scoped key
Aave / Compound / testnet yield action
  -> audit log + tx hash / pending status / denial reason
```

关键安全边界：

- Agent 不直接控制用户完整 EOA 钱包。
- Agent 只能操作用户主动放入 Agent Wallet 的测试网资金。
- Agent Wallet 有余额，也必须继续受 Pact 预算、资产、协议、Recipe 和期限限制。
- active Pact 执行使用 Pact 子 Key，不把 Agent 主 Key 当成交易执行凭证。
- 越权动作会被拒绝，并留下可解释的审计记录。
- 当前仅面向测试网 Demo，不涉及主网真实资产。

## 技术栈

- 前端：Nuxt 4、Vue 3、TypeScript、Tailwind CSS、shadcn-vue/ui 风格组件
- 状态管理：Pinia
- 钱包 / 链交互：wagmi、viem、Base Sepolia
- 执行层：Cobo Agentic Wallet（CAW）/ Pact
- Agent / 策略层：Hermes runtime（自然语言策略解析与风险解释）+ deterministic validation
- 数据库与日志：SQLite（策略、Pact、钱包准备进度、执行 / 审计日志、Pact credential 缓存）
- 图表：Chart.js、vue-chartjs
- 测试：Vitest
- 部署：Vercel 前端 / Nitro server + 远程 Hermes / CAW runtime

## 路由与 Layout

应用使用两套 layout：

- **`default`**：落地页（`/`），顶栏含 Logo 与 `Try Demo` 入口，无侧栏。
- **`dashboard`**：控制台（`/dashboard/*`），顶栏含 Logo 与钱包状态，左侧 `DashboardSidebar` + 右侧子页面内容。

| 路径 | Layout | 说明 |
|------|--------|------|
| `/` | `default` | 产品落地页；Header / Hero 提供 `Try Demo` 入口 |
| `/dashboard` | `dashboard` | 控制台概览；Demo preset 下可直接进入 |
| `/dashboard/create-strategy` | `dashboard` | 创建策略：模板、自然语言、Pact Preview |
| `/dashboard/pacts` | `dashboard` | Pact 管理：审批状态、执行、拒绝模拟、赎回、终止 |
| `/dashboard/history` | `dashboard` | 交易历史 / Audit Trail |
| `/dashboard/settings` | `dashboard` | 网络、分账、Cobo API Key、开发者模式等测试网设置 |

旧顶层路径（`/wallet`、`/create-strategy`、`/pacts`、`/history`、`/settings`）保留为薄重定向，透传 query 至对应 `/dashboard/*` 路由。

## 文档

- 产品定义：[`PRODUCT.md`](./PRODUCT.md)
- Demo Story：[`docs/demo-story.md`](./docs/demo-story.md)
- PRD：[`docs/YieldAgent_Collective_PRD.md`](./docs/YieldAgent_Collective_PRD.md)
- 技术架构与任务拆解：[`docs/YieldAgent_Technical_Architecture.md`](./docs/YieldAgent_Technical_Architecture.md)
- CAW 接入说明：[`docs/caw-integration.md`](./docs/caw-integration.md)
- Hermes 策略层说明：[`docs/hermes-strategy-agent.md`](./docs/hermes-strategy-agent.md)
- 产品流程决策：[`docs/product-flow-decisions.md`](./docs/product-flow-decisions.md)

## 目录结构

```text
.
├── app/
│   ├── components/
│   │   ├── landing/                # 落地页区块
│   │   ├── wallet/                 # EOA / Agent Wallet / funding 准备组件
│   │   ├── create-strategy/        # 策略创建与 Pact Preview 组件
│   │   ├── dashboard/              # 控制台卡片、收益图、日志表
│   │   ├── history/                # 审计日志筛选与时间线
│   │   ├── pacts/                  # Pact 列表与详情
│   │   ├── settings/               # 设置表单
│   │   └── ui/                     # 通用 UI 组件
│   ├── composables/                # 钱包连接、USDC 转账、轮询等
│   ├── layouts/
│   │   ├── default.vue             # 落地页 layout
│   │   └── dashboard.vue           # 控制台 layout
│   ├── middleware/                 # Dashboard 访问守卫
│   ├── pages/
│   │   ├── index.vue               # 落地页
│   │   ├── dashboard.vue           # 控制台父路由
│   │   └── dashboard/              # 概览、创建策略、Pact、历史、设置子页
│   ├── plugins/wagmi.client.ts
│   └── stores/app.ts
├── server/
│   ├── api/                        # Nitro API routes
│   ├── db/                         # SQLite client / schema / repository
│   ├── fixtures/initial-state.ts
│   └── utils/                      # CAW、Pact、执行、策略、持久化工具
├── shared/
│   ├── constants/
│   ├── types/app.ts
│   └── utils/
├── tests/
├── docs/
├── nuxt.config.ts
├── package.json
├── pnpm-lock.yaml
└── .env.example
```

## 本地开发

推荐 Node.js >= 22.11.0 与 pnpm。

```bash
pnpm install
pnpm dev
```

默认开发地址：

```text
http://localhost:3000/
```

指定 host/port：

```bash
pnpm dev --host 127.0.0.1 --port 3000
```

也可以使用 npm 运行脚本：

```bash
npm test
npm run build
```

## 构建与测试

```bash
pnpm test
pnpm build
pnpm preview
```

针对当前 Demo / Pact credential 边界的快速验证：

```bash
pnpm test -- tests/wallet-api.test.ts tests/pact-credentials.test.ts
```

可选生成静态产物：

```bash
pnpm generate
```

## 环境变量

参考 [`.env.example`](./.env.example)。不要提交真实 API Key、私钥、助记词或主网资产信息。

### Cobo Agentic Wallet

```text
AGENT_WALLET_ENV=dev
AGENT_WALLET_API_URL=https://api-core.agenticwallet.dev.cobo.com
# AGENT_WALLET_API_KEY=      # Vercel + Hermes 分体部署时必填；本地有 caw CLI 时可不填
AGENT_WALLET_TSS_RUNTIME=hermes-agent-host
AGENT_WALLET_MAIN_NODE_ID=
```

说明：

- `AGENT_WALLET_API_KEY` 是 Agent principal / 管理 Key，用于钱包、Pact 提交与状态同步。
- active Pact 执行必须使用 Cobo 返回的 pact-scoped key / Pact 子 Key；代码会缓存并优先使用该执行凭证。
- 如果缺少 Pact 子 Key，系统会尝试从 Cobo Pact 详情刷新；刷新不到时停止执行并提示，不会 fallback 到主 Key 执行交易。

### Hackathon 预置演示钱包模式

公开评审链接推荐启用 preset 模式：只配置已 active 的 CAW wallet UUID，服务端从 Cobo 同步该 wallet 的 EVM 地址和 USDC 余额，不再使用占位地址或手填余额。

```text
PACTTRADER_DEMO_MODE=preset
PACTTRADER_DEMO_CAW_WALLET_ID=<active Cobo Agent Wallet UUID>
# PACTTRADER_DEMO_EOA_ADDRESS=0x...   # 可选：仅用于 UI 展示
```

启用后：

- 初始状态标记为 Hackathon preset mode。
- `POST /api/wallet/preparation/create-agent` 直接返回预置钱包状态，不会创建新的 CAW wallet。
- 钱包 EVM 地址通过 Cobo wallet/address API 回读。
- USDC 可用余额通过 Cobo balance API 同步。
- 如果 Cobo 同步失败，Dashboard 不会伪造占位余额；需要修复 Cobo API Key / wallet 授权。

### Hermes 策略层

```text
HERMES_STRATEGY_MODE=api
HERMES_API_URL=https://<your-hermes-agent-host-or-tunnel>/hermes-api
HERMES_API_KEY=<Bearer key>
HERMES_CLI_BIN=hermes        # 本机开发 fallback
HERMES_PROFILE=default
HERMES_STRATEGY_MODEL=       # 可选，留空使用 Hermes 默认配置
```

Vercel 不能假设能访问 Hermes 主机的 `localhost`。生产 Demo 中，Hermes / TSS Node 应运行在可访问的远程主机或 tunnel 后面。

### SQLite（本地默认）

```text
# 未设置 DATABASE_URL 时使用 SQLite
# 本地默认 .data/yieldagent.db
# DATABASE_PATH=.data/yieldagent.db
```

### Supabase Postgres（Vercel 推荐）

Vercel serverless 实例之间不共享 `/tmp/yieldagent.db`。生产或公开 Demo 应配置 Supabase Postgres，使策略、Pact、审计日志与 `pact_credentials` 在多实例间一致。

1. 在 Supabase Dashboard → **Project Settings → Database** 复制 **Transaction pooler** 连接串（端口 **6543**，需带 `?pgbouncer=true`）。
2. 在 Supabase SQL Editor 或 CLI 执行 [`supabase/migrations/20260610120000_init_yieldagent.sql`](supabase/migrations/20260610120000_init_yieldagent.sql) 初始化表结构。
3. 在 Vercel 设置环境变量：

```text
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

4. Redeploy 后在设置页「部署自检」确认 `databaseBackend` 为 `postgres`，且不再出现 `ephemeral_database` blocker。

本地也可设置 `DATABASE_URL` 联调 Postgres；未设置时仍使用 `.data/yieldagent.db`。

注意：Vercel `/tmp` SQLite 仅适合短期单机 Demo。未配置 `DATABASE_URL` 时可能导致 Pact credential、策略或钱包准备状态不稳定。

### 本地开发 Draft

```text
# 仅供 CI / 本地脚本绕过开发者模式开关
# CAW_FORCE_LOCAL_DRAFT=true
```

用户演示中如果没有 Cobo 配置，可在设置页的「高级 · 开发者」里开启本地 Pact Draft；本地 Draft 不能链上执行 Recipe。

## Vercel + Hermes 部署要点

1. 在 Hermes 主机完成 `caw onboard`，并保持 TSS Node 在线。
2. 在 Vercel 配置 `AGENT_WALLET_API_KEY`、`AGENT_WALLET_MAIN_NODE_ID`、`AGENT_WALLET_TSS_RUNTIME=hermes-agent-host`。
3. 配置 `HERMES_STRATEGY_MODE=api`、`HERMES_API_URL`、`HERMES_API_KEY`，确保 Vercel 可访问 Hermes API。
4. Hackathon 公开链接建议配置 `PACTTRADER_DEMO_MODE=preset` 和 `PACTTRADER_DEMO_CAW_WALLET_ID`。
5. 配置 `DATABASE_URL`（Supabase Transaction pooler）以实现多实例状态共享。
6. Redeploy 后在设置页查看部署自检（`GET /api/caw/deployment-check`）。
7. 进入 `/dashboard`，确认 preset wallet 地址与余额已从 Cobo 同步。

常见问题：

| 现象 | 处理 |
|------|------|
| `403 not authorized for this wallet` | API Key 与 CAW wallet 所属 Agent 不一致；用同一 Agent 的 Key / wallet，或 reset 后重新 import |
| active Pact 执行缺凭证 | 点击同步 / 刷新 Pact 状态，确认 Cobo `getPact` 能返回 pact-scoped key；不要用 Agent 主 Key 执行 active Pact |
| `src_addr: Field required` | contract call 必须显式传 Agent Wallet EVM 地址；确认 Cobo 地址同步成功 |
| 长期 `preparing` | TSS 未参与 MPC；检查 `AGENT_WALLET_MAIN_NODE_ID` 与 Hermes 主机 `caw node status` |
| Vercel 状态丢失 | 配置 Supabase `DATABASE_URL`（Transaction pooler）；或使用 preset wallet 并从 Cobo 回读状态 |

## Demo 数据与 API

当前版本接入真实测试网钱包准备与 Cobo Pact 提交流程，并用 SQLite 保存 UI 状态、Pact、策略和审计日志。

### 钱包 / CAW

- `GET /api/wallet`：Agent Wallet 摘要；默认返回缓存，`?sync=true` 从 Cobo 同步。
- `GET /api/wallet/preparation`：钱包准备状态。
- `POST /api/wallet/preparation/connect-eoa`：连接 EOA。
- `POST /api/wallet/preparation/create-agent`：创建 CAW Agent Wallet；preset 模式下返回预置 wallet。
- `GET /api/wallet/preparation/agent-status`：钱包 bootstrap / TSS 状态。
- `GET /api/wallet/preparation/deposit-info`：测试网 USDC 转入信息。
- `POST /api/wallet/preparation/deposit`：校验转入 tx hash 并同步余额。
- `POST /api/wallet/preparation/import-agent`：导入已 onboard / 已存在 Agent Wallet。
- `POST /api/wallet/preparation/disconnect-eoa`：断开 EOA 状态。
- `POST /api/wallet/preparation/reset`：重置钱包准备状态。
- `GET /api/wallet/preparation/gas-status`：Agent Wallet Gas 预检。
- `GET /api/wallet/withdraw-info` / `POST /api/wallet/withdraw`：钱包资金提取信息与转出。
- `GET /api/caw/deployment-check`：部署自检。
- `GET /api/caw/readiness`、`POST /api/caw/provision`、`POST /api/caw/onboard/start`、`POST /api/caw/onboard/continue`、`GET /api/caw/onboard/status`：CAW onboarding / readiness API。

### 策略 / Pact / 执行

- `GET /api/strategies`：策略列表。
- `POST /api/strategies`：创建策略并提交 Cobo Pact；无 Cobo 或无权限时返回错误，不再伪造成功。
- `POST /api/strategy-agent/parse`：Hermes 自然语言策略解析 + 确定性校验。
- `GET /api/strategy-agent/readiness` / `POST /api/strategy-agent/ping`：策略层可用性检查。
- `GET /api/pacts`：Pact 列表；`?sync=true` 批量同步 Cobo 状态。
- `GET /api/pacts/:id`：Pact 详情；`?sync=true` 同步 Cobo 状态。
- `POST /api/pacts/:id/approve`：同步 Cobo App 审批状态。
- `POST /api/pacts/:id/execute`：Pact active 后执行首次 Recipe（Compound / Aave supply）。
- `GET /api/pacts/:id/position`：链上协议仓位快照。
- `POST /api/pacts/:id/redeem`：从 Compound / Aave 赎回至 Agent Wallet。
- `POST /api/pacts/:id/simulate-denial`：服务端模拟越权请求并记录拒绝原因。
- `POST /api/pacts/:id/terminate`：终止 Pact（Cobo revoke + 状态回读）。

### 日志 / 设置 / 收益

- `GET /api/logs`：执行 / 审计日志。
- `GET /api/yield-series`：收益曲线；`?sync=true` 读取链上仓位并累计利息增量。
- `GET /api/settings` / `PUT /api/settings`：测试网设置、分账、开发者模式等。

## 生产路径说明

### 创建策略

```text
Try Demo / Dashboard
  -> 钱包 ready（preset 或真实 EOA + CAW）
  -> 创建策略（模板或 Hermes 解析）
  -> POST /api/strategies
  -> Cobo App 审批
  -> Pact ACTIVE
  -> POST /api/pacts/:id/execute
  -> tx hash / pending status / denial reason 写入 logs
```

### Pact 管理

```text
/dashboard/pacts
  -> GET /api/pacts?sync=true
  -> awaiting-approval：引导去 Cobo App 批准
  -> active：可执行首次 Recipe / 模拟越权 / 查看仓位 / 赎回 / 终止
  -> completed / terminated：显示最终状态和审计日志
```

Dashboard 策略卡片在 `awaiting-approval` 时显示「待 Cobo App 审批」，点击跳转 `/dashboard/pacts?id=`。

## Hackathon Demo Checklist

- [ ] Vercel 环境变量已配置 `AGENT_WALLET_API_KEY`、`AGENT_WALLET_MAIN_NODE_ID`、`HERMES_API_URL`。
- [ ] 已配置 `PACTTRADER_DEMO_MODE=preset` 与真实 active `PACTTRADER_DEMO_CAW_WALLET_ID`。
- [ ] `/dashboard` 首屏能显示从 Cobo 同步的 Agent Wallet 地址与 USDC 余额。
- [ ] 能创建策略并提交真实 Cobo Pact。
- [ ] Cobo App 审批后能同步到 `active`。
- [ ] active Pact 执行使用 pact-scoped key；缺 key 时不会 fallback 到 Agent 主 Key。
- [ ] 至少展示一次拒绝路径（超预算 / 未授权协议 / 模拟越权）。
- [ ] History / Audit Trail 能看到 allowed、denied、pending、failed 等事件。
- [ ] README、Demo 和公开材料不暴露 `.env`、API Key、私钥、助记词或真实资金敏感信息。

## 安全边界

YieldAgent 的 Demo 和真实路径都应坚持：

- 用户主动准备资金，Agent 不直接接管用户完整钱包。
- 每次策略执行必须绑定 Pact。
- active Pact 执行只使用 Pact 子 Key / pact-scoped key。
- Agent 只能在预算、资产、协议、Recipe 和期限内行动。
- 拒绝路径和成功路径一样重要，都必须可见、可解释、可审计。
- 公开文档和 Demo 不应暴露真实私钥、API Key、助记词、主网资产信息或敏感会议链接。
