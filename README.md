# YieldAgent

YieldAgent 是一个面向 AI Web3 School / Cobo Agentic Commerce Hackathon 的 **Pact-first DeFi 收益策略 Agent 控制台**。

项目目标不是让 AI Agent 无限接管用户钱包，而是通过 **Cobo Agentic Wallet（CAW）+ Pact 权限边界**，让用户只把一小块可控测试网资金交给 Agent，并明确限制预算、资产、网络、Recipe、期限、分账比例和审计路径。

当前版本是测试网产品原型，用于展示：

- 用户从 EOA 钱包准备资金到 CAW Agent Wallet 的流程；
- Agent 在 Pact 约束下创建和执行收益策略；
- 允许执行、越权拒绝、tx hash、审计日志和收益看板；
- 测试网 Agent Wallet 资金准备：wagmi EOA 连接、CAW SDK 创建钱包、USDC 转入校验、Cobo 余额同步。

> 核心原则：**Pact before profit**。先展示 Agent 被允许做什么，再展示 Agent 实际做了什么。

## 核心流程

```text
User EOA Wallet
  -> transfer testnet USDC
CAW Agent Wallet
  -> Pact: max budget + allowlist + duration + revenue split
Executor Agent
  -> allowed Recipe only
Aave / Compound / testnet yield action
  -> audit log + tx hash
```

关键边界：

- Agent 不直接控制用户完整 EOA 钱包；
- Agent 只能操作用户主动转入 Agent Wallet 的测试网资金；
- Agent Wallet 有余额，也必须继续受 Pact 预算限制；
- 只有白名单协议和 Recipe 可以执行；
- 越权动作需要被明确拒绝，并留下可解释的审计记录；
- 当前仅面向 Base / Arbitrum Sepolia 测试网，不涉及主网真实资产。

## 技术栈

- 前端：Nuxt 4、Vue 3、TypeScript、Tailwind CSS、shadcn-vue/ui 风格组件
- 钱包连接：wagmi、viem
- 执行层：CAW（Cobo Agentic Wallet）/ Pact
- Agent / 策略层：当前 Hermes Agent 主机上的 Hermes runtime（替代 Z.AI API，用于自然语言策略解析与风险解释）
- 执行 runtime：TSS Node + Hermes 均运行在当前 Hermes Agent 主机，Vercel 通过远程 API / tunnel 调用
- 数据库与日志：SQLite（`.data/yieldagent.db`，持久化策略 / Pact / 审计日志）
- 部署：Vercel 前端 + 远程 Hermes Agent 主机后端 runtime
- 当前原型依赖：Pinia、Zod、Chart.js、vue-chartjs、@cobo/agentic-wallet

## 路由与 Layout

应用使用两套 layout：

- **`default`**：落地页（`/`），顶栏含 Logo、控制台入口与钱包状态，无侧栏
- **`dashboard`**：控制台（`/dashboard/*`），顶栏仅 Logo 与钱包状态，左侧 `DashboardSidebar` + 右侧子页面内容

| 路径 | Layout | 说明 |
|------|--------|------|
| `/` | `default` | 产品落地页；Header / Hero 提供「连接钱包」入口 |
| `/dashboard` | `dashboard` | 控制台概览；未完成 Agent Wallet 设置时仅展示引导流（无侧栏） |
| `/dashboard/create-strategy` | `dashboard` | 创建策略：模板、自然语言、Pact Preview |
| `/dashboard/pacts` | `dashboard` | Pact 管理：状态与权限边界 |
| `/dashboard/history` | `dashboard` | 交易历史 / Audit Trail |
| `/dashboard/settings` | `dashboard` | 网络、分账、Cobo API Key 等测试网设置 |

旧顶层路径（`/wallet`、`/create-strategy`、`/pacts`、`/history`、`/settings`）保留为薄重定向，透传 query 至对应 `/dashboard/*` 路由。

## 文档

- 产品定义：[`PRODUCT.md`](./PRODUCT.md)
- PRD：[`docs/YieldAgent_Collective_PRD.md`](./docs/YieldAgent_Collective_PRD.md)
- 技术架构、目录结构与任务拆解：[`docs/YieldAgent_Technical_Architecture.md`](./docs/YieldAgent_Technical_Architecture.md)
- CAW 接入说明：[`docs/caw-integration.md`](./docs/caw-integration.md)
- Hermes 策略层说明：[`docs/hermes-strategy-agent.md`](./docs/hermes-strategy-agent.md)
- 产品流程决策：[`docs/product-flow-decisions.md`](./docs/product-flow-decisions.md)

## 目录结构

```text
.
├── app/
│   ├── app.vue
│   ├── assets/css/main.css
│   ├── components/
│   │   ├── AppNav.vue
│   │   ├── wallet/                 # EOA / Agent Wallet / funding 三步准备组件
│   │   ├── create-strategy/        # 策略创建与 Pact Preview 组件
│   │   ├── dashboard/              # 控制台卡片、收益图、日志表
│   │   ├── history/                # 审计日志筛选与时间线
│   │   ├── pacts/                  # Pact 列表与详情
│   │   ├── settings/               # 设置表单
│   │   └── ui/                     # 通用 UI 组件
│   ├── composables/
│   │   ├── useWalletConnect.ts     # wagmi EOA 连接
│   │   ├── useUsdcTransfer.ts      # 测试网 USDC 转账
│   │   ├── useWalletPreparation.ts # 钱包准备流程状态
│   │   ├── useCreateStrategy.ts    # 创建策略流程
│   │   └── useDashboardPoll.ts     # 控制台轮询
│   ├── layouts/
│   │   ├── default.vue             # 落地页 layout
│   │   └── dashboard.vue           # 控制台 layout（侧栏 + 内容区）
│   ├── pages/
│   │   ├── dashboard.vue           # 控制台父路由（onboarding 门禁）
│   │   └── dashboard/              # 概览、创建策略、Pact、历史、设置子页
│   ├── plugins/wagmi.client.ts
│   └── stores/app.ts
├── server/
│   ├── api/
│   │   ├── wallet.get.ts
│   │   ├── wallet/preparation/     # 钱包准备 API
│   │   ├── strategies/
│   │   ├── pacts/
│   │   ├── logs/
│   │   ├── settings/
│   │   └── yield-series.get.ts
│   ├── fixtures/initial-state.ts
│   └── utils/
│       ├── app-store.ts
│       ├── wallet-preparation.ts
│       ├── cobo-client.ts
│       ├── cobo-config.ts
│       ├── cobo-preparation.ts
│       ├── deposit-verify.ts
│       └── settings.ts
├── shared/types/app.ts
├── docs/
├── nuxt.config.ts
├── tailwind.config.ts
├── package.json
└── .env.example
```

## 本地开发

推荐使用 pnpm。

```bash
pnpm install
pnpm dev
```

默认开发地址：

```text
http://localhost:3000/
```

如需指定 host/port：

```bash
pnpm dev --host 127.0.0.1 --port 3000
```

## 构建与预览

```bash
pnpm build
pnpm preview
```

也可以生成静态产物：

```bash
pnpm generate
```

> 本地构建已在 pnpm 11.5.1 下通过。`pnpm-workspace.yaml` 已显式允许 `vue-demi` build script，并将 pnpm overrides 放在 workspace 配置中。

## 环境变量

参考 `.env.example`：

```text
AGENT_WALLET_ENV=dev
AGENT_WALLET_API_URL=https://api-core.agenticwallet.dev.cobo.com
# AGENT_WALLET_API_KEY=      # 可选：默认由 YieldAgent 自动 provision
AGENT_WALLET_TSS_RUNTIME=hermes-agent-host
AGENT_WALLET_MAIN_NODE_ID=
HERMES_STRATEGY_MODE=api
HERMES_API_URL=https://<your-hermes-agent-host-or-tunnel>/hermes-api
HERMES_CLI_BIN=hermes        # 仅本机开发 fallback
HERMES_PROFILE=default
```

注意：

- 一般不需要手动配置 `AGENT_WALLET_API_KEY`；YieldAgent 会在创建 Agent Wallet 时自动调用 `POST /api/v1/principals/provision`，并把初始 API Key 仅保存在服务端；
- 如果手动配置 `AGENT_WALLET_API_KEY`，不要提交真实 API Key；
- 不要提交私钥、助记词或主网资产信息；
- Hackathon Demo 默认使用测试网；
- Vercel 不能运行长期 TSS Node，也不能直接调用本机 CLI；生产 Demo 需要把 TSS Node 和 Hermes API 放在当前 Hermes Agent 主机，并通过公网域名或 tunnel 暴露给 Vercel server/API 调用。

## Demo 数据与接口

当前版本使用 SQLite 持久化策略、Pact 与审计日志，并接入真实测试网钱包准备与 Cobo Pact 提交流程：

- `GET /api/wallet`：Agent Wallet 摘要
- `GET /api/wallet/preparation`：钱包准备状态
- `POST /api/wallet/preparation/connect-eoa`：连接 EOA
- `POST /api/wallet/preparation/create-agent`：创建 CAW Agent Wallet
- `GET /api/wallet/preparation/deposit-info`：获取测试网 USDC 转入信息
- `POST /api/wallet/preparation/deposit`：校验转入 tx hash 并同步余额
- `GET /api/strategies`：策略列表
- `POST /api/strategies`：创建策略并提交 Cobo Pact（失败返回 502，不再播放前端 mock 流水线）
- `POST /api/strategy-agent/parse`：Hermes 自然语言策略解析 + 确定性校验
- `GET /api/pacts`：Pact 列表（`?sync=true` 批量同步 Cobo 状态）
- `GET /api/pacts/:id`：Pact 详情（`?sync=true` 同步 Cobo 状态）
- `POST /api/pacts/:id/approve`：Cobo 模式同步审批状态
- `POST /api/pacts/:id/terminate`：终止 Pact（Cobo 模式调用 revoke）
- `POST /api/pacts/:id/execute`：Pact 激活后执行首次 Recipe（Compound/Aave supply）
- `GET /api/pacts/:id/position`：链上协议仓位快照
- `POST /api/pacts/:id/redeem`：从 Compound/Aave 赎回至 Agent Wallet
- `POST /api/pacts/:id/simulate-denial`：服务端模拟越权请求并记录拒绝原因
- `GET /api/wallet/preparation/gas-status`：Agent Wallet Gas 预检
- `GET /api/logs`：执行 / 审计日志
- `GET /api/yield-series`：收益曲线（`?sync=true` 读取 Compound 仓位并累计利息增量；7 日滚动）
- `GET /api/settings` / `PUT /api/settings`：测试网设置

### 创建策略生产路径

```text
连接 EOA（首页/Header）→ 控制台完成 Agent Wallet 设置 → 填写参数（可选 Hermes 解析）→ POST /api/strategies
  → Cobo App 审批（前端轮询 sync）→ Pact ACTIVE
  → POST /api/pacts/:id/execute → 真实 tx hash 写入 logs
```

### Pact 管理生产路径

```text
/pacts（进入时 GET /api/pacts?sync=true）
  → 待审批：PactAppApprovalGuide 引导去 Cobo App 批准
  → 每 4s 轮询 GET /api/pacts/:id?sync=true
  → active：自动尝试 POST /api/pacts/:id/execute（失败可手动重试）
  → 模拟越权：POST /api/pacts/:id/simulate-denial → logs（?pactId= 可筛选）
  → 赎回：GET /api/pacts/:id/position → POST /api/pacts/:id/redeem
  → 终止：POST /api/pacts/:id/terminate（Cobo revoke + 状态回读）
```

Dashboard 策略卡片在 `awaiting-approval` 时显示「待 Cobo App 审批」，点击跳转 `/pacts?id=`。

用户主路径需配置 Cobo API Key。仅本地开发可在 `.env` 设置 `CAW_FORCE_LOCAL_DRAFT=true` 回退 local-draft（无法执行链上 Recipe）。

## 开发任务拆解

详见：[`docs/YieldAgent_Technical_Architecture.md`](./docs/YieldAgent_Technical_Architecture.md#8-开发任务拆解)

优先级建议：

1. 统一 YieldAgent 品牌文案，清理旧项目命名残留；
2. 修复 pnpm / Vercel 构建问题；
3. 将 Pact Preview 映射为真实 CAW Pact；
4. 接入当前 Hermes Agent 主机上的 Hermes 做策略解析，Vercel 通过远程 API / tunnel 调用，并加入确定性校验；
5. 可选：Compound 仓位快照写入收益曲线（当前 Dashboard 在无数据时显示说明）；
6. 准备演示路径和文档。

## 安全边界

YieldAgent 的 Demo 和真实路径都应坚持：

- 用户主动准备资金，Agent 不直接接管用户完整钱包；
- 每次策略执行必须绑定 Pact；
- Agent 只能在预算、资产、协议、Recipe 和期限内行动；
- 拒绝路径和成功路径一样重要，都必须可见、可解释、可审计；
- README、公开文档和 Demo 不应暴露真实私钥、API Key 或主网资产信息。
