# YieldAgent 技术架构文档、目录结构与开发任务拆解

> 更新日期：2026-06-05
> 当前同步代码：本地最新提交，已加入 CAW readiness 与 Hermes strategy readiness
> 项目仓库：`https://github.com/baikingrio/yield-agent`
> 当前定位：AI Web3 School / Cobo Agentic Commerce Hackathon 项目主线

---

## 1. 项目一句话

**YieldAgent 是一个 Pact-first DeFi 收益策略 Agent 控制台：用户先连接自己的 EOA 钱包，创建 / 准备 CAW Agent Wallet，并转入测试网 USDC；Agent 只能在用户批准的 Cobo CAW Pact 边界内执行收益策略、记录审计日志，并展示交易证据。**

项目重点不是“AI 替用户无限制交易”，而是展示：

- Agent 能执行链上收益动作；
- 但执行前必须经过 Pact 授权；
- 资金、网络、Recipe、期限、分账比例都有边界；
- 成功执行和越权拒绝都必须可见、可解释、可审计。

---

## 2. 当前技术栈

### 2.1 前端

- **Nuxt 4**：主应用框架，使用 Nitro server routes。
- **Vue 3 + TypeScript**：页面、组件、组合式逻辑。
- **Tailwind CSS**：全局样式与响应式布局。
- **shadcn-vue/ui 风格组件**：当前以自定义 `app/components/ui` 组件实现类似设计风格。
- **Pinia**：前端 Demo 状态管理。
- **Chart.js + vue-chartjs**：Dashboard 收益曲线。
- **wagmi / viem**：EOA 钱包连接、测试网 ERC20 转账、链上回执读取。

### 2.2 服务端 / API

- **Nuxt Nitro Server API**：`server/api/**`。
- **共享类型**：`shared/types/demo.ts`。
- **当前状态存储**：`server/utils/demo-store.ts` 内存 Demo store。
- **后续目标**：将内存状态迁移到 SQLite，保留审计日志、策略、Pact、钱包准备状态。

### 2.3 执行层

- **CAW / Cobo Agentic Wallet**：通过 `@cobo/agentic-wallet` SDK 接入。
- 当前最新代码已经加入：
  - Cobo SDK client 封装；
  - CAW Agent Wallet 创建；
  - Cobo chain/token 配置；
  - Agent Wallet 地址生成；
  - USDC 转入后的链上校验与 Cobo 余额同步。

### 2.4 Agent / 策略层

- 目标技术栈：**当前 Hermes Agent 主机上的 Hermes runtime**（替代原计划 Z.AI API）。
- 当前新增了 Hermes strategy readiness：`server/utils/strategy-agent-readiness.ts` 与 `GET /api/strategy-agent/readiness`。
- 当前策略创建以表单、模板和 Pact Preview 为主；后续把自然语言策略通过远程 API/tunnel 交给当前 Hermes Agent 主机上的 Hermes 解析为结构化参数，再经过 deterministic validator 后进入 Pact builder。
- Hermes 只负责“解析 / 解释 / 风险说明”，不能绕过 Pact validator 或直接提交交易。

### 2.5 数据库与日志

- 目标技术栈：**SQLite**。
- 当前实现：内存 Demo store + fixture 初始数据。
- 后续应落地：wallets、wallet_preparations、strategies、pacts、execution_logs、settings 等表。

### 2.6 部署

- 目标部署：**Vercel 前端 + 当前 Hermes Agent 主机后端 runtime**。
- 当前 Nuxt 项目结构适合 Vercel 部署，但 Vercel 不能运行长期 TSS Node，也不能直接调用 Hermes CLI；需要通过公网域名或 tunnel 调用当前 Hermes Agent 主机上的 TSS/Hermes runtime。

---

## 3. 核心用户流程

```text
Landing Page
  -> Connect EOA Wallet
  -> Create / Prepare CAW Agent Wallet
  -> Transfer testnet USDC from EOA to Agent Wallet
  -> Choose strategy template / input strategy
  -> Generate Pact Preview
  -> Approve / simulate Pact
  -> Agent executes only inside Pact boundaries
  -> Dashboard shows balance, strategy, logs, tx hash
  -> History / Pact Detail exposes audit trail
```

### 3.1 为什么需要 EOA 钱包

用户不能一上来就把完整钱包交给 Agent。YieldAgent 的设计是：

```text
User EOA Wallet
  -> 用户主动转入测试网 USDC
CAW Agent Wallet
  -> Pact max budget + allowlisted recipes + duration
Executor Agent
  -> allowed DeFi action only
```

也就是说：

- Agent 不直接控制用户 EOA；
- Agent 只能操作用户转入 Agent Wallet 的资金；
- 即使 Agent Wallet 有余额，也还要受 Pact 的预算上限约束；
- 越权动作必须被拒绝并写入日志。

---

## 4. 当前已实现模块

### 4.1 页面

- `/`：产品落地页，解释 YieldAgent 的 Pact-first 价值和测试网路径。
- `/wallet`：钱包准备页，包含 EOA 连接、创建 Agent Wallet、转入测试网 USDC 三步。
- `/create-strategy`：创建策略页，包含策略模板、参数填写、自然语言输入和 Pact Preview。
- `/dashboard`：策略运行后的控制台，展示钱包、策略、日志、收益图。
- `/pacts`：Pact 管理页，查看 Pact 状态和权限边界。
- `/history`：审计日志 / 交易历史。
- `/settings`：网络、分账、Cobo API Key 等测试网配置。

### 4.2 最新代码重点

本次同步后，最新提交重点是 **testnet wallet preparation and funding flow**：

- 新增 `app/plugins/wagmi.client.ts`：前端钱包连接配置。
- 新增 `app/composables/useWalletConnect.ts`：EOA 连接状态管理。
- 新增 `app/composables/useUsdcTransfer.ts`：测试网 USDC 转账逻辑。
- 新增 `app/composables/useWalletPreparation.ts`：钱包准备流程状态封装。
- 新增 `app/components/wallet/*`：钱包准备三步 UI。
- 新增 `server/api/wallet/preparation/*`：连接 EOA、创建 Agent Wallet、查询充值信息、确认充值、重置流程。
- 新增 `server/utils/cobo-client.ts`：Cobo SDK API 封装。
- 新增 `server/utils/cobo-config.ts`：Base / Arbitrum Sepolia 的 Cobo chain/token 配置。
- 新增 `server/utils/cobo-preparation.ts`：创建 CAW Agent Wallet、查询余额、确认转入。
- 新增 `server/utils/deposit-verify.ts`：链上 USDC 转入校验。
- 新增 `.env.example`：Cobo API、Hermes Agent 主机上的 TSS 节点、远程 Hermes strategy runtime 环境变量说明。

---

## 5. 当前目录结构

```text
yield-agent/
├── README.md
├── PRODUCT.md
├── DESIGN.md
├── docs/
│   ├── YieldAgent_Collective_PRD.md
│   ├── YieldAgent_Technical_Architecture.md
│   └── product-flow-decisions.md
├── app/
│   ├── app.vue
│   ├── assets/css/main.css
│   ├── layouts/default.vue
│   ├── pages/
│   │   ├── index.vue
│   │   ├── wallet.vue
│   │   ├── create-strategy.vue
│   │   ├── dashboard.vue
│   │   ├── pacts.vue
│   │   ├── history.vue
│   │   └── settings.vue
│   ├── components/
│   │   ├── AppNav.vue
│   │   ├── ui/
│   │   ├── wallet/
│   │   ├── create-strategy/
│   │   ├── dashboard/
│   │   ├── pacts/
│   │   ├── history/
│   │   └── settings/
│   ├── composables/
│   │   ├── useWalletConnect.ts
│   │   ├── useUsdcTransfer.ts
│   │   ├── useWalletPreparation.ts
│   │   ├── useCreateStrategy.ts
│   │   └── useDashboardPoll.ts
│   ├── plugins/wagmi.client.ts
│   └── stores/demo.ts
├── server/
│   ├── api/
│   │   ├── wallet.get.ts
│   │   ├── yield-series.get.ts
│   │   ├── logs/index.get.ts
│   │   ├── strategies/index.get.ts
│   │   ├── strategies/index.post.ts
│   │   ├── pacts/index.get.ts
│   │   ├── pacts/[id].get.ts
│   │   ├── pacts/[id]/approve.post.ts
│   │   ├── pacts/[id]/terminate.post.ts
│   │   ├── settings/index.get.ts
│   │   ├── settings/index.put.ts
│   │   └── wallet/preparation/
│   │       ├── index.get.ts
│   │       ├── connect-eoa.post.ts
│   │       ├── disconnect-eoa.post.ts
│   │       ├── create-agent.post.ts
│   │       ├── deposit-info.get.ts
│   │       ├── deposit.post.ts
│   │       └── reset.post.ts
│   ├── fixtures/initial-state.ts
│   └── utils/
│       ├── demo-store.ts
│       ├── settings.ts
│       ├── wallet-preparation.ts
│       ├── cobo-client.ts
│       ├── cobo-config.ts
│       ├── cobo-preparation.ts
│       └── deposit-verify.ts
├── shared/types/demo.ts
├── nuxt.config.ts
├── tailwind.config.ts
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── .env.example
```

---

## 6. 前端组件职责

### 6.1 钱包准备模块

- `PrepStepIndicator.vue`：展示 EOA、Agent Wallet、Funding 三步状态。
- `PrepStepEoa.vue`：连接 EOA 钱包，并把地址同步到后端准备状态。
- `PrepStepAgent.vue`：调用后端创建 CAW Agent Wallet。
- `PrepStepFund.vue`：展示 USDC 转入信息，触发 EOA 转账并确认链上回执。
- `PrepSummary.vue`：汇总当前准备状态、Agent Wallet 地址、可用 USDC、最后一笔 tx hash。

### 6.2 创建策略模块

- `StrategyForm.vue`：策略参数输入。
- `PactPreview.vue`：展示允许 / 禁止动作、预算、期限、分账、白名单等边界。
- `useCreateStrategy.ts`：创建策略状态与提交逻辑。

### 6.3 Dashboard / Audit 模块

- `WalletBar.vue`：钱包资产和当前 APY。
- `StrategyList.vue`：策略列表。
- `RecentLogsTable.vue`：近期审计日志。
- `YieldChart.vue`：收益曲线。
- `LogTimeline.vue`：历史时间线。
- `TxLink.vue`：交易哈希展示。

---

## 7. 服务端 API 职责

### 7.1 钱包准备 API

- `GET /api/wallet/preparation`：读取当前钱包准备状态。
- `POST /api/wallet/preparation/connect-eoa`：保存用户连接的 EOA 地址。
- `POST /api/wallet/preparation/disconnect-eoa`：断开 EOA 并重置 Agent Wallet / funding 状态。
- `POST /api/wallet/preparation/create-agent`：调用 Cobo SDK 创建 Agent Wallet 并生成地址。
- `GET /api/wallet/preparation/deposit-info`：返回 Agent Wallet 地址、USDC 合约、chainId、tokenId、最小转入金额。
- `POST /api/wallet/preparation/deposit`：校验 tx hash，确认 USDC 已从 EOA 转入 Agent Wallet，并同步 Cobo 余额。
- `POST /api/wallet/preparation/reset`：重置钱包准备流程。

### 7.2 Demo 业务 API

- `GET /api/wallet`：钱包摘要。
- `GET /api/strategies`：策略列表。
- `POST /api/strategies`：创建策略与 Pact Preview 关联数据。
- `GET /api/pacts`：Pact 列表。
- `GET /api/pacts/:id`：Pact 详情。
- `POST /api/pacts/:id/approve`：Demo 模式批准 Pact。
- `POST /api/pacts/:id/terminate`：终止 Pact。
- `GET /api/logs`：审计日志。
- `GET /api/yield-series`：收益曲线。
- `GET /api/settings` / `PUT /api/settings`：设置读取和更新。

---

## 8. 开发任务拆解

### Phase 0：品牌与文档统一（优先）

- [x] 项目主线确认：YieldAgent。
- [x] 同步最新代码到 `aad1ab7`。
- [x] 整理当前技术架构、目录结构和任务拆解。
- [x] 清理 README / 页面 / 注释中残留的旧项目命名文案。
- [ ] 确认最终命名：`YieldAgent` 还是 `YieldAgent Collective`，并统一导航、页面标题、提交材料。
- [ ] 将公开文档保持 privacy-safe，不暴露 API Key、私钥、真实主网资产信息。

### Phase 1：钱包准备闭环

- [x] wagmi / viem 钱包连接。
- [x] EOA 地址同步到后端准备状态。
- [x] CAW SDK client 封装。
- [x] 创建 CAW Agent Wallet。
- [x] 生成 Agent Wallet 测试网地址。
- [x] 展示 USDC 转入信息。
- [x] 通过 EOA 发起测试网 USDC 转账。
- [x] 校验链上回执与转账目标。
- [x] 同步 Cobo 余额到 Demo state。
- [ ] 增加失败态 UI：网络错误、余额不足、tx 失败、未找到 USDC transfer。
- [ ] 明确 Base Sepolia / Arbitrum Sepolia 的切换提示，避免测试网混用。
- [ ] 加入区块浏览器链接和复制地址体验。

### Phase 2：Pact Preview 到 CAW Pact 映射

- [x] 设计 Pact policy JSON 结构：network、token、maxSpend、duration、allowlisted recipes、recipient / protocol allowlist。
- [x] 将 `PactPreview.vue` 当前展示字段映射到真实 CAW Pact 参数。
- [x] 新增 `server/utils/cobo-pact.ts`，封装 Pact draft 生成与 `PactsApi.submitPact`。
- [x] 创建策略时生成真实 pact draft，并在 Cobo API Key / Agent Wallet UUID 存在时提交到 Cobo。
- [x] 若提交到 Cobo，前端展示 Pact ID、提交消息，并引导用户到 Cobo Agentic Wallet App 审批。
- [ ] 轮询 Pact 状态：pending → active / rejected / expired。
- [ ] 把 Pact 状态写入 Dashboard 和 History。

### Phase 3：Strategy Agent / Hermes Agent 主机 runtime

- [x] 新增 `server/utils/strategy-agent-readiness.ts`，确认策略层调用当前 Hermes Agent 主机上的 Hermes CLI / 远程 API；Vercel 部署要求 API/tunnel 模式。
- [x] 新增 `GET /api/strategy-agent/readiness` 和 Settings 状态卡。
- [ ] 新增 `server/utils/hermes-strategy-parser.ts`，封装 Hermes CLI / API 调用。
- [ ] 定义策略解析 schema：network、asset、maxSpend、riskLevel、targetApy、duration、allowedRecipes、revenueSplit。
- [ ] 将自然语言输入解析为结构化策略参数。
- [ ] 在 LLM 输出后增加 deterministic validator，防止越权参数进入执行层。
- [ ] 对每个策略输出风险解释：为什么允许、为什么拒绝、Pact 边界是什么。
- [ ] 对接保守型 USDC Yield 模板，优先保证 Demo 稳定。

### Phase 4：Recipe 执行与拒绝路径

- [ ] 明确 v0.1 只支持低风险测试网动作，例如 USDC supply / mock yield / allowlisted recipe dry-run。
- [ ] 接入 CAW Recipe 查询或预置 recipe slug。
- [ ] 执行 allowlist 内动作，并返回 tx hash / status。
- [ ] 设计至少一个越权拒绝场景：未知 token、超预算、非白名单协议、Pact 过期。
- [ ] Dashboard 明确展示 “Allowed execution” 和 “Denied execution”。
- [ ] History 记录拒绝原因，作为 Cobo Pact 价值证明。

### Phase 5：SQLite 持久化

- [ ] 选择 SQLite 访问层：Nuxt server sqlite client / better-sqlite3 / libSQL 兼容方案。
- [ ] 设计 schema：
  - `wallets`
  - `wallet_preparations`
  - `strategies`
  - `pacts`
  - `execution_logs`
  - `settings`
- [ ] 将 `server/utils/demo-store.ts` 内存状态替换为 repository。
- [ ] Seed Demo 数据，保证评委打开即可体验。
- [ ] 保留 tx hash、拒绝原因、Agent action、timestamp 的审计可追溯性。

### Phase 6：Vercel 部署与演示

- [ ] 配置 Vercel 项目。
- [ ] 整理环境变量：`AGENT_WALLET_API_URL`、`AGENT_WALLET_TSS_RUNTIME=hermes-agent-host`、`AGENT_WALLET_MAIN_NODE_ID`、`HERMES_STRATEGY_MODE=api`、`HERMES_API_URL`、`HERMES_CLI_BIN`（本机开发 fallback）等；`AGENT_WALLET_API_KEY` 默认由 YieldAgent 自动 provision，仅复用既有 CAW Agent 凭证时手动配置。
- [ ] 确认服务端环境变量不泄漏到客户端。
- [ ] 跑通 `pnpm build`。
- [ ] 准备 Demo 路径：Landing → Wallet → Create Strategy → Pact Preview → Dashboard → History。
- [ ] 准备 2 分钟中文 / 英文演示稿。

---

## 9. 当前风险与注意事项

### 9.1 品牌命名一致性

`README.md` 已更新为 YieldAgent 主线。后续仍需要继续检查页面标题、按钮文案、注释、PRD 和提交材料，避免出现旧项目名 / YieldAgent 混用，影响评委和 WCB proof 理解。

### 9.2 构建检查

已修复本地 pnpm 11 构建阻塞：`pnpm-workspace.yaml` 中将 `vue-demi` build script 显式允许，并把 pnpm overrides 保留在 workspace 配置中。当前 `pnpm build` 已通过。后续部署到 Vercel 时仍需要确认 Vercel 使用的 pnpm 版本与 workspace 配置一致。

### 9.3 API Key 与隐私

`.env.example` 只保留空值模板是正确的。后续不要把真实 Cobo API Key、Hermes provider key、钱包私钥或主网资产信息写进公开仓库。

### 9.4 Demo 范围控制

黑客松版本建议坚持：

- 测试网；
- 小额 USDC；
- 保守型策略；
- 白名单 Recipe；
- 明确拒绝路径；
- Dashboard 以 Pact 边界和审计证据为核心，而不是夸大 APY。

---

## 10. 下一步建议

最建议按这个顺序推进：

1. **先统一 README 和页面文案为 YieldAgent**，避免项目主线混乱。
2. **修复 pnpm build / Vercel 构建问题**，保证 Demo 可部署。
3. **把 Pact Preview 接到真实 CAW Pact submit**，这是 Cobo 赛道最关键的证明点。
4. **接入当前 Hermes Agent 主机上的 Hermes 做策略解析**；Vercel 通过远程 API/tunnel 调用，输出必须经过确定性校验。
5. **把日志从内存迁移到 SQLite**，让审计路径稳定可复现。
