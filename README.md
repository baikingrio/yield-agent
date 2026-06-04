# PactTrader

PactTrader 是一个面向 AI Web3 School Hackathon 的 **Pact-first DeFi Agent** 原型。项目目标不是让 AI Agent 直接控制用户完整钱包，而是通过 **CAW Agent Wallet + Pact 权限边界**，让用户只把一小块可控测试网资金交给 Agent，并明确限制预算、资产、协议、Recipe、期限和审计路径。

当前版本是可演示的前端 + mock/testnet 数据原型，用于展示：

- 用户从 EOA 钱包准备资金到 CAW Agent Wallet 的流程；
- Agent 在 Pact 约束下创建和执行收益策略；
- 允许执行、越权拒绝、tx hash、审计日志和收益看板；
- Demo/评委路径下的 mock/testnet Agent Wallet 资金说明。

> 说明：当前仓库包名仍是 `yield_agent`，部分页面标题中仍保留 YieldAgent 文案；项目主线与 README 统一按 **PactTrader** 说明。

## 核心流程

```text
User EOA Wallet
  -> deposit / transfer testnet USDC
CAW Agent Wallet
  -> Pact: max budget + allowlist + duration
Executor Agent
  -> allowed Recipe only
Aave / Compound on testnet
```

关键原则：

- Agent 不直接控制用户完整 EOA 钱包；
- Agent Wallet 有余额，也必须继续受 Pact 预算限制；
- 只有白名单协议和 Recipe 可以执行；
- 越权动作需要被明确拒绝，并留下可解释的审计记录；
- Demo 模式使用 mock / 预置测试网 Agent Wallet，不涉及真实资产。

## 技术栈

- 前端：Nuxt.js、Vue、TypeScript、Tailwind CSS、shadcn-vue/ui 风格组件
- 执行层：CAW（Cobo Agentic Wallet）/ Pact
- Agent / 策略层：Z.AI API
- 数据库与日志：SQLite
- 部署：Vercel
- 当前原型依赖：Pinia、Zod、Chart.js、vue-chartjs

## 已实现页面

- `/`：产品落地页，解释 PactTrader 的资金边界、真实路径和 Demo 路径
- `/wallet`：资金准备页，解释 EOA Wallet、CAW Agent Wallet 与测试网 USDC 注入流程
- `/create-strategy`：创建策略页，支持策略模板、自然语言输入、Pact Preview、允许/禁止动作说明
- `/dashboard`：Demo 控制台，展示 Agent Wallet、策略、执行日志和收益图
- `/pacts`：Pact 管理页，查看 Pact 状态与权限边界
- `/history`：交易历史 / Audit Trail
- `/settings`：网络、分账、Agent 参数等演示设置

## 目录结构

```text
.
├── app/
│   ├── app.vue
│   ├── assets/css/main.css          # Tailwind 与全局视觉样式
│   ├── components/
│   │   ├── AppNav.vue               # 顶部导航
│   │   ├── create-strategy/         # 策略创建与 Pact Preview 组件
│   │   ├── dashboard/               # 控制台卡片、收益图、日志表
│   │   ├── history/                 # 审计日志筛选与时间线
│   │   ├── pacts/                   # Pact 列表与详情
│   │   ├── settings/                # 设置表单
│   │   └── ui/                      # 通用 UI 组件
│   ├── composables/
│   │   ├── useCreateStrategy.ts     # 创建策略流程、模板、Pact Preview 状态
│   │   └── useDashboardPoll.ts      # 控制台轮询
│   ├── layouts/default.vue
│   ├── pages/
│   │   ├── index.vue                # 落地页
│   │   ├── wallet.vue               # 资金准备
│   │   ├── create-strategy.vue      # 创建策略
│   │   ├── dashboard.vue            # Demo 控制台
│   │   ├── pacts.vue                # Pact 管理
│   │   ├── history.vue              # 交易历史
│   │   └── settings.vue             # 设置
│   └── stores/demo.ts               # Pinia demo 状态管理
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
│   │   └── settings/index.put.ts
│   ├── fixtures/initial-state.ts    # Demo 初始数据
│   └── utils/demo-store.ts          # 服务端内存 demo store
├── shared/types/demo.ts             # 前后端共享类型
├── nuxt.config.ts
├── tailwind.config.ts
├── package.json
└── README.md
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

## Demo 数据与接口

当前版本使用服务端 mock 数据模拟钱包、策略、Pact、日志和收益曲线：

- `GET /api/wallet`：Agent Wallet 摘要
- `GET /api/strategies`：策略列表
- `POST /api/strategies`：创建演示策略
- `GET /api/pacts`：Pact 列表
- `GET /api/pacts/:id`：Pact 详情
- `POST /api/pacts/:id/approve`：批准 Pact
- `POST /api/pacts/:id/terminate`：终止 Pact
- `GET /api/logs`：执行 / 审计日志
- `GET /api/yield-series`：收益曲线
- `GET /api/settings` / `PUT /api/settings`：演示设置

后续接入 SQLite 后，`server/utils/demo-store.ts` 中的内存状态应迁移为 SQLite 持久化读写，并保留审计日志的可追溯性。

## 开发任务拆解

### Phase 1：Demo 原型完善

- [x] 产品落地页：说明资金来源、Pact 边界和 Demo/真实路径
- [x] 资金准备页：解释 EOA -> CAW Agent Wallet -> Pact 的流程
- [x] 创建策略页：模板、自然语言输入、Pact Preview、允许/禁止动作
- [x] Demo 控制台：Agent Wallet、策略、执行日志、收益曲线
- [x] Pact 管理与交易历史页面
- [ ] 统一品牌文案：将残留 YieldAgent 文案改为 PactTrader
- [ ] 增强移动端检查与视觉细节

### Phase 2：执行层接入 CAW

- [ ] 配置 CAW SDK 与测试网环境变量
- [ ] 创建 / 连接 CAW Agent Wallet
- [ ] 实现测试网 USDC 资金准备状态读取
- [ ] 将 Pact Preview 映射为 CAW Pact / policy 配置
- [ ] 执行 allowlist 内的 Recipe
- [ ] 对越权动作返回 Denied 原因和 Pact 边界说明

### Phase 3：Agent / 策略层接入 Z.AI API

- [ ] 将自然语言策略解析为结构化策略参数
- [ ] 生成候选 DeFi Recipe 与风险解释
- [ ] 在 Agent 输出前加入确定性校验，避免越权参数进入执行层
- [ ] 支持保守 / 平衡等策略模板与 Z.AI 输出结合

### Phase 4：SQLite 审计日志

- [ ] 设计 SQLite schema：wallets、strategies、pacts、execution_logs、settings
- [ ] 将 mock store 替换为 SQLite repository
- [ ] 记录允许执行、拒绝执行、tx hash、错误原因和时间戳
- [ ] 提供 Dashboard / History / Pact Detail 所需查询接口

### Phase 5：Vercel 部署与演示

- [ ] 配置 Vercel 构建流程
- [ ] 梳理环境变量和测试网密钥管理
- [ ] 准备评委 Demo 路径：Landing -> Demo Strategy -> Pact Preview -> Dashboard -> Audit Trail
- [ ] 编写演示脚本和风险说明

## 安全边界

PactTrader 的 Demo 和真实路径都应坚持：

- 用户主动准备资金，Agent 不直接接管用户完整钱包；
- 每次策略执行必须绑定 Pact；
- Agent 只能在预算、资产、协议、Recipe 和期限内行动；
- 拒绝路径和成功路径一样重要，都必须可见、可解释、可审计；
- README、公开文档和 Demo 不应暴露真实私钥、API Key 或主网资产信息。
