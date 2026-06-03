# YieldAgent Collective · 前端 MVP 设计规格

**日期：** 2026-06-03  
**修订：** 2026-06-03 — 纳入控制台累计收益图（Chart.js）  
**状态：** 已批准（brainstorming，含收益图修订）  
**范围：** 前端 MVP 页面补全；Agent / Cobo SDK 仍为 mock  
**数据层：** Nitro API + 内存 fixture（启动加载，POST 可变）  
**依据：** [YieldAgent_Collective_PRD.md](../../YieldAgent_Collective_PRD.md)、[PRODUCT.md](../../../PRODUCT.md)、[DESIGN.md](../../../DESIGN.md)

---

## 1. 目标与成功标准

### 1.1 目标

在黑客松 Demo 场景下，补全 PRD 所列前端页面（除已实现的创建策略外），使评委能在 **5 分钟内** 理解：

1. Agent 钱包与资产概况  
2. 策略与 Pact 边界（非 APY 炒作）  
3. **累计收益趋势**（辅助图表，非 hero 数字墙）  
4. 可审计的执行日志与测试网 Tx 链接  

Agent 链上逻辑与 Cobo SDK **不在本规格内**；通过 Nitro mock API 保证页面间数据一致、可演示「创建策略 → 控制台可见」。

### 1.2 成功标准

- [ ] `/`、`/pacts`、`/history`、`/settings` 均为 production-ready 中文 UI，符合 DESIGN.md  
- [ ] 创建策略提交后，`POST /api/strategies` 成功，Dashboard 可见新策略与关联 Pact  
- [ ] Pact 页可查看详情并触发「模拟审批」「终止」且状态刷新  
- [ ] History 与 Dashboard 日志同源，支持类型筛选  
- [ ] Settings 可保存 mock 配置（API Key 不落库到 git）  
- [ ] Dashboard 对 `/api/logs` 每 15s 轮询（可配置常量）  
- [ ] Dashboard 展示 **累计收益图**（7 日 / 30 日切换，mock 时序数据，符合 §5.1.1 视觉约束）  

### 1.3 明确不做

- Cobo SDK 真实调用、测试网真实交易  
- Strategy / Executor / Revenue 三 Agent 实现  
- WebSocket 实时推送  
- localStorage 持久化 mock  
- 多图表仪表盘、实时 K 线、预测收益曲线  
- `agent-core/` 独立包迁移（本阶段逻辑位于 `server/` + `shared/`）

---

## 2. 背景与约束

| 项 | 说明 |
|----|------|
| 技术栈 | Nuxt 4、TypeScript、Tailwind、`chart.js` + `vue-chartjs`（仅客户端）、现有 CSS token |
| 语言 | 界面文案 zh-CN；保留 Pact、CAW、Recipe、USDC、YieldAgent 等专有名词 |
| 设计原则 | Pact before profit；审计轨迹优先；黄色 accent 稀缺（见 PRODUCT.md） |
| 已有实现 | `app/pages/create-strategy.vue` + `app/components/create-strategy/*` + `useCreateStrategy` |
| PRD 结构差异 | PRD 建议 `frontend/` 子目录；当前为根目录 Nuxt app，本阶段不迁移目录 |

---

## 3. 架构决策

### 3.1 选定方案：资源型 Nitro API（方案 B）

拒绝「单文件上帝 API」（难映射未来真实接口）与「无 Pinia 每页 useFetch」（跨页体验差）。

### 3.2 分层

```
┌─────────────────────────────────────────────────────────┐
│  Pages (Vue)     index | pacts | history | settings     │
│       + create-strategy (POST on submit)                │
├─────────────────────────────────────────────────────────┤
│  Pinia store(s)   封装 fetch、缓存、轮询                  │
├─────────────────────────────────────────────────────────┤
│  Composables      可选：useLogsPoll, usePactActions     │
├─────────────────────────────────────────────────────────┤
│  Nitro server/api/*   读写在内存 demo-store             │
├─────────────────────────────────────────────────────────┤
│  server/fixtures/initial-state.ts   启动种子数据        │
└─────────────────────────────────────────────────────────┘
```

### 3.3 共享类型

`shared/types/demo.ts` 定义：

- `WalletSummary`  
- `Strategy`（id, name, network, asset, riskLevel, maxSpend, status, pactId?, createdAt）  
- `Pact`（id, strategyId, intent, policies, status, maxSpend, whitelist, duration, …）  
- `LogEntry`（id, timestamp, action, type: swap | supply | revenue, txHash, status）  
- `DemoSettings`（network, apiKeyConfigured: boolean, defaultAgentFee, userSplit）  
- `CreateStrategyPayload`（与 `useCreateStrategy` 表单字段对齐）  
- `YieldPoint`（`date: string` ISO 日，`cumulativeUsdc: number` 累计收益 USDC）  
- `YieldSeries`（`range: '7d' | '30d'`, `points: YieldPoint[]`, `totalUsdc: number`）

Server 与 client 均从此导入类型。

---

## 4. API 规格

### 4.1 内存 store

`server/utils/demo-store.ts`：

- `getState()` / `resetState()`（仅 dev 调试用，可选）  
- 启动时从 `initial-state.ts` 克隆  
- 各 handler 读取并修改同一对象（单进程内存，dev server 重启恢复种子）

**安全：** 不把用户输入的 API Key 写入仓库；`PUT /api/settings` 仅设置 `apiKeyConfigured: true` 与内存占位，响应永不返回完整 key。

### 4.2 路由表

| 方法 | 路径 | 行为 |
|------|------|------|
| GET | `/api/wallet` | 返回 `WalletSummary` |
| GET | `/api/yield-series` | 返回 `YieldSeries`；query `range=7d`（默认）或 `30d` |
| GET | `/api/strategies` | 策略列表 |
| POST | `/api/strategies` | 校验 body（Zod），创建 Strategy + 关联 Pact，追加首条 Log（可选），返回 `{ strategy, pact }` |
| GET | `/api/pacts` | Pact 列表（query: `status` 可选） |
| GET | `/api/pacts/:id` | 单条 Pact 详情 |
| POST | `/api/pacts/:id/approve` | status → `active`（或 `awaiting-execution` → `active`） |
| POST | `/api/pacts/:id/terminate` | status → `terminated` |
| GET | `/api/logs` | 日志列表；query `type=swap|supply|revenue`，`limit` 默认 50 |
| GET | `/api/settings` | 返回 `DemoSettings`（脱敏） |
| PUT | `/api/settings` | 更新 network、defaultAgentFee、userSplit；body 含 `apiKey` 时仅标记已配置 |

### 4.3 错误响应

统一 JSON：`{ error: string, code?: string }`，HTTP 400/404/500。前端显示字段级或页面级中文错误，可重试。

### 4.4 与 create-strategy 的集成

在现有 pipeline `success` 时（或用户点击「创建 Pact」且校验通过时，按产品决策二选一）：

1. `POST /api/strategies` with payload  
2. 成功后 `navigateTo('/?created=1')`  
3. Dashboard 读取 query，显示一次性 toast「策略已创建」

**决策（固定）：** 在 pipeline 进入 `submitting` 时并行调用 API；API 失败则 pipeline → `failed` 并展示 server 错误。保留现有 UI 状态机动画。

---

## 5. 页面设计

### 5.1 控制台 `/`

**布局（桌面）：**

1. **钱包条**（非 hero）：mono 地址 + 复制；三列次要指标（总资产、当前 APY、累计收益），字号遵循 DESIGN body/mono，禁止超大 APY。  
2. **收益图区**（见 §5.1.1）  
3. **策略区**：`h2` 策略；卡片或紧凑表行；状态 chip（Active / Paused / Completed）；链、max spend；点击进入 Pact 详情或 `/pacts?id=`。  
4. **近期执行**：`h2` 近期执行；表格列：时间、动作、类型、Tx（链接 Base Sepolia explorer）、状态。

**空态：** 无策略时 CTA「创建策略」→ `/create-strategy`；收益图区显示「暂无收益数据」扁平文案，不渲染空图表骨架动画。

**轮询：** `useLogsPoll(15000)` 刷新 logs + yield-series（与 wallet 同轮询或同 hook）；strategies 在 mount 与 `created` query 时刷新。

#### 5.1.1 累计收益图（纳入 MVP）

**目的：** 满足 PRD「图表」与评委对「钱在增长」的直观感受，同时遵守 PRODUCT **Pact before profit**：图表是**佐证**，不能压过 Pact/日志。

**库：** `chart.js` v4 + `vue-chartjs`，`<ClientOnly>` 包裹，避免 SSR 报错。

**组件：** `app/components/dashboard/YieldChart.vue`

| 项 | 规格 |
|----|------|
| 图表类型 | 单条折线：X = 日期，Y = 累计收益（USDC） |
| 标题 | `h2`：累计收益；副标题 mono 小字：区间合计 `{totalUsdc} USDC`（非页面最大字号） |
| 时间范围 | Segmented control：**7 日** / **30 日**（默认 7 日），切换时 `GET /api/yield-series?range=` |
| 尺寸 | 高度固定 `h-48`（192px）~ `h-56`，全宽；lg 可与策略区同宽，不单独占满首屏 |
| 配色 | 线条 `#0ecb81`（`trading-up`）；填充 `rgba(14,203,129,0.08)`；网格线 `#2b3139`；轴标签 `#707a8a`；禁用渐变描边与黄色大面积填充 |
| 交互 | hover tooltip：日期 + 累计 USDC；无动画入场（或 reduced-motion 下关闭） |
| 禁止 | PRD 反对的「hero-metric 模板」：不得把 APY 做成图表中心大字；不得 3D / 霓虹渐变 |

**数据：**

- Fixture 为每个 range 预置 7 / 30 个 `YieldPoint`，累计值单调非降，小幅波动即可。  
- `POST /api/strategies` 成功后可选追加一个当日点（实施时若简单则做，否则静态 seed 足够 Demo）。

**无障碍：** 图表旁提供 `sr-only` 表格摘要（最近 3 点数值），满足「非纯视觉」最低要求。

### 5.2 Pact 管理 `/pacts`

**布局：** 主从（lg: 左 320px 列表，右详情；sm: 列表全宽，选中后详情在下方）。

**列表：** intent 摘要、状态 chip、剩余额度（mono）。

**详情：** 与创建页 Pact 预览同构字段；操作按钮「模拟审批」「终止 Pact」（verb + object 中文标签）；操作后 `$fetch` 刷新并更新 Pinia。

**深链：** 支持 `?id=` 选中对应 Pact。

### 5.3 交易历史 `/history`

**布局：** 垂直时间线（左侧时间 mono，右侧内容）。

**筛选：** chips：全部 / Swap / Supply / Revenue Share（映射 log `type`）。

**数据源：** `GET /api/logs` 全量，与 Dashboard 近期日志相同 store，不重复 fixture 文件。

### 5.4 设置 `/settings`

**字段：**

- 默认网络（select，与创建页一致）  
- Cobo API Key（password input，placeholder 说明仅演示）  
- 默认 Agent 绩效费率（%）  
- 默认用户分成（%）

**保存：** `PUT /api/settings`；成功内联文案「已保存」。

### 5.5 创建策略 `/create-strategy`（改动范围）

- 组件名：`CreateStrategyForm`（已修正）  
- 增加 API 提交与错误展示  
- 其余 UI / pipeline 演示逻辑保留  

---

## 6. 前端状态管理

### 6.1 Pinia `useDemoStore`（单 store，按域分 actions）

| Action | 说明 |
|--------|------|
| `fetchWallet` | GET /api/wallet |
| `fetchStrategies` | GET /api/strategies |
| `fetchPacts` | GET /api/pacts |
| `fetchPact(id)` | GET /api/pacts/:id |
| `fetchLogs(params)` | GET /api/logs |
| `fetchYieldSeries(range)` | GET /api/yield-series |
| `fetchSettings` | GET /api/settings |
| `updateSettings` | PUT /api/settings |
| `approvePact(id)` | POST approve |
| `terminatePact(id)` | POST terminate |
| `createStrategy(payload)` | POST strategies |

State 缓存各资源；页面 `onMounted` 调用，避免重复请求可用简单 stale 标记或始终 refetch（MVP 可 refetch）。

### 6.2 依赖

添加 `pinia` + `@pinia/nuxt` module；`chart.js`、`vue-chartjs`（实施计划中执行）。

---

## 7. UI / 组件规划

| 组件路径 | 职责 |
|----------|------|
| `app/components/dashboard/WalletBar.vue` | 钱包摘要条 |
| `app/components/dashboard/YieldChart.vue` | 累计收益折线图（ClientOnly） |
| `app/components/dashboard/StrategyList.vue` | 策略列表 |
| `app/components/dashboard/RecentLogsTable.vue` | 近期日志表 |
| `app/components/pacts/PactList.vue` | 左栏列表 |
| `app/components/pacts/PactDetail.vue` | 右栏详情与操作 |
| `app/components/history/LogTimeline.vue` | 时间线 |
| `app/components/history/LogTypeFilter.vue` | 类型 chips |
| `app/components/settings/SettingsForm.vue` | 设置表单 |
| `app/components/ui/StatusChip.vue` | 复用状态 chip（可选） |
| `app/components/ui/TxLink.vue` | mono + 黄链测试网 explorer |

复用现有 token 与 `AppNav`；不引入 Nuxt UI 除非实施时发现明显省时（默认 Tailwind only）。

---

## 8. 种子数据要求

`initial-state.ts` 至少包含：

- 1 个钱包地址（测试网格式）  
- 2 条策略（1 Active，1 Paused）  
- 2 个 Pact 与策略关联  
- 5+ 条 Log（覆盖 swap / supply / revenue 各至少 1）  
- `yieldSeries7d` / `yieldSeries30d` 各一组单调上升的 `YieldPoint`  
- 默认 Settings（`apiKeyConfigured: false`）

Tx hash 使用固定演示 hash，explorer 链与 `network` 一致。

---

## 9. 错误、加载、无障碍

| 场景 | 处理 |
|------|------|
| 加载 | 表格/卡片 skeleton；禁止全屏 spinner |
| API 失败 | 页面内 alert + 重试按钮 |
| 空列表 | 中文空态 + 主 CTA |
| 轮询失败 | 静默失败，下次间隔重试；连续失败 3 次显示小字提示 |
| a11y | 表单 label、focus ring（已有）、表格语义 thead/th |
| reduced motion | 沿用 main.css |

---

## 10. 测试与验证（实施计划执行）

- 手动 Demo 脚本：创建策略 → 控制台 → Pact 审批 → History 筛选  
- `nuxt build` 无类型错误  
- 可选：Vitest 对 Zod schema 与 demo-store 纯函数测试（非本 spec 强制）

---

## 11. 实施顺序建议（供 writing-plans 引用）

1. `shared/types` + `demo-store` + fixtures + GET wallet/strategies/logs/yield-series  
2. Pinia + Dashboard 页（含 YieldChart）  
3. Pacts 列表/详情 + POST approve/terminate  
4. History 时间线  
5. Settings PUT/GET  
6. create-strategy 接 POST + 跳转  
7. 轮询 + 空态/错误态打磨  

---

## 12. 开放问题（已关闭）

| 问题 | 决议 |
|------|------|
| 数据层选型 | Nitro API + 内存 fixture |
| 图表 | 纳入：Dashboard 累计收益折线（7d/30d），§5.1.1 |
| create-strategy 提交时机 | pipeline submitting 时调 API |
| agent-core 目录 | 本阶段不建 |

---

## 附录 A：PRD 功能映射

| PRD 功能 | 本 spec |
|----------|---------|
| Dashboard 主页 + 收益图 | §5.1、§5.1.1 |
| PRD Chart.js | §5.1.1、`chart.js` + `vue-chartjs` |
| 创建策略 | §5.5 + §4.4 |
| Pact 管理 | §5.2 |
| 交易历史 | §5.3 |
| 设置 | §5.4 |
| Agent 三角色 | mock（日志 copy 体现角色分工即可） |
| Cobo 集成要求 | UI 文案 + Pact 字段结构；无 SDK |

---

## 附录 B：文件清单（预期新增/修改）

**新增：**

- `docs/superpowers/specs/2026-06-03-frontend-mvp-design.md`（本文件）  
- `shared/types/demo.ts`  
- `server/fixtures/initial-state.ts`  
- `server/utils/demo-store.ts`  
- `server/api/**`（见 §4.2，含 `yield-series.get.ts`）  
- `app/stores/demo.ts`  
- `app/components/dashboard/*`  
- `app/components/pacts/*`  
- `app/components/history/*`  
- `app/components/settings/*`  

**修改：**

- `app/pages/index.vue`  
- `app/pages/pacts.vue`  
- `app/pages/history.vue`  
- `app/pages/settings.vue`（新建若不存在）  
- `app/pages/create-strategy.vue`  
- `nuxt.config.ts`（Pinia module）  
- `package.json`（pinia、chart.js、vue-chartjs）
