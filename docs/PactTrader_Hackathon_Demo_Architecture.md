# PactTrader Hackathon Demo 架构实施方案

## 1. 目标

Hackathon 评审公开链接默认采用「方案 A：预置演示钱包」。目标不是让每位评委从零完成 CAW `createWallet → vault active → pairing → funding`，而是让评委稳定看到 PactTrader 的核心价值：

- 策略模板与 Z.AI / Hermes 策略解析；
- CAW Pact 权限边界；
- 受限执行与拒绝路径；
- 可审计日志和交易证据。

## 2. 当前架构定位

```text
评委浏览器
  ↓
Vercel Nuxt / Nitro
  ↓
SQLite Demo DB：预置 walletPreparation + 策略 / Pact / logs
  ↓
项目方 Hermes 主机：CAW API Key + TSS Node + 预置 active wallet
  ↓
Cobo Agentic Wallet
```

公开评审主路径不再默认触发新的 Agent Wallet 创建，避免多位评委同时访问时出现全站单例状态串线、重复创建未激活钱包、TSS 单点等待和 pairing code 不稳定等问题。

## 3. Demo 模式环境变量

在 Vercel Production 中配置：

```env
PACTTRADER_DEMO_MODE=preset
PACTTRADER_DEMO_AGENT_WALLET_ADDRESS=<预置 active Agent Wallet EVM 地址>
PACTTRADER_DEMO_CAW_WALLET_ID=<预置 CAW wallet uuid>
PACTTRADER_DEMO_AVAILABLE_USDC=500
PACTTRADER_DEMO_EOA_ADDRESS=<演示 EOA，可选>
```

仍需保留真实 CAW / Hermes 后端变量，供 Pact 提交、执行和状态同步使用：

```env
AGENT_WALLET_ENV=dev
AGENT_WALLET_API_URL=https://api-core.agenticwallet.dev.cobo.com
AGENT_WALLET_API_KEY=<与预置钱包同一 Agent principal 的有效 key>
AGENT_WALLET_MAIN_NODE_ID=<Hermes 主机在线 TSS node id>
AGENT_WALLET_TSS_RUNTIME=hermes-agent-host
HERMES_STRATEGY_MODE=api
HERMES_API_URL=<Hermes API 公网地址>
HERMES_API_KEY=<Bearer key>
DATABASE_PATH=<持久化数据库路径或外部数据库挂载路径>
```

## 4. 已实现的代码策略

- 新增 `server/utils/pacttrader-demo-wallet.ts`：集中解析 Demo 环境变量，并把 `AppState.walletPreparation` 标记为 ready。
- `createInitialState()` 在 preset 模式下直接初始化为：
  - EOA completed；
  - Agent Wallet created + paired；
  - Funding ready；
  - `agentBootstrap.phase = paired`；
  - `wallet.totalAssetsUsdc = PACTTRADER_DEMO_AVAILABLE_USDC`。
- SQLite hydration 时，如果 preset 模式已启用且当前钱包准备状态还未 ready，会自动迁移到预置 Demo Wallet，避免旧的 `preparing` 状态继续挡住评审流程。
- `POST /api/wallet/preparation/create-agent` 在 preset 模式下直接返回现有预置钱包，不再调用 Cobo 创建新钱包。
- Dashboard 增加 Hackathon Demo 模式说明，明确公开评审主路径是预置钱包；真实自助 pairing 留给本地或小范围内测。

## 5. 评审主路径

```text
Landing / Try Demo
  ↓
Dashboard：已看到预置 active Agent Wallet
  ↓
Create Strategy：选择保守 USDC 模板或自然语言解析
  ↓
Pact Preview：展示预算、协议 allowlist、期限、分成
  ↓
Pacts：等待 / 同步 CAW App 审批状态
  ↓
Execute：执行或展示越权拒绝
  ↓
History：查看审计日志、tx hash、拒绝原因
```

## 6. 后续开发任务拆解

### P0：Hackathon 交付

- [x] 预置钱包状态注入；
- [x] preset 模式下阻止重复 `createWallet`；
- [x] Dashboard 增加评审解释文案；
- [x] 增加回归测试；
- [ ] 在 Vercel 配置真实预置 wallet address / wallet uuid；
- [ ] 重新部署并确认 `/dashboard` 默认 ready；
- [ ] 用真实预置 Pact 跑一遍策略创建、审批同步、执行 / 拒绝日志。

### P1：小范围真实自助体验

- [ ] 增加 `Advanced: Create your own Agent Wallet` 二级入口；
- [ ] 按 EOA 或 session 隔离 `walletPreparation`；
- [ ] 同一 EOA 限制重复创建；
- [ ] preparing 超时后标记 expired；
- [ ] TSS / API Key health check 未通过时禁止创建。

### P2：产品化多租户

- [ ] 将全站单例 `AppState` 拆成用户级数据模型；
- [ ] 使用 Postgres / Turso / Supabase 等持久化数据库；
- [ ] 拆出 CAW Adapter Service；
- [ ] 为每个用户维护 wallet、pact、strategy、execution_log；
- [ ] 引入异步任务队列处理 CAW polling 和交易执行。

## 7. 验收标准

- 未启用 `PACTTRADER_DEMO_MODE` 时，原真实 onboarding 流程保持可用；
- 启用 preset 模式后，首次进入 Dashboard 即显示 Agent Wallet / funding ready；
- 点击创建 Agent Wallet 不会产生新的 CAW wallet；
- 创建策略按钮可用；
- 测试和构建通过；
- README / `.env.example` 已说明部署方式。
