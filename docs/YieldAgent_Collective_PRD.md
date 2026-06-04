# YieldAgent Collective - Product Requirements Document (PRD)

**版本**：1.0  
**日期**：2025年6月  
**项目名称**：YieldAgent Collective  
**赛道**：Cobo Agentic Commerce Hackathon  
**技术栈**：Nuxt 4（最新版）、TypeScript、Tailwind CSS、Cobo Agentic Wallet SDK

---

## 1. 项目概述

### 1.1 项目背景
YieldAgent Collective 是一个 **自主 DeFi 收益策略 Agent 集合**，专注于 Agentic Commerce。多个 AI Agent 使用 **Cobo Agentic Wallet (CAW)** 在严格的 Pact 权限控制下，自主执行 DeFi 收益耕作、资产再平衡、复投，并实现收益自动分账，形成小型 Agent-to-Agent (A2A) 经济体。

### 1.2 项目目标
- 展示 AI Agent 如何安全、自主地参与链上经济活动（赚钱、资产管理、分账）。
- 深度集成 Cobo Agentic Wallet，突出 Pact 的安全边界控制、Recipe 执行能力和审计能力。
- 在 2 周内交付一个可运行的 Demo，满足 Cobo 赛道所有评审要求。
- 最终目标：获得 Cobo 赛道奖项。

### 1.3 核心价值主张
- Agent 不再只是“建议”，而是**真正能安全花钱和赚钱**。
- 用户通过自然语言设定策略，Agent 在 CAW Pact 限制内自主执行。
- 收益自动按比例分账，体现 A2A Economy。

---

## 2. 目标用户与场景

### 2.1 目标用户
- DeFi 用户 / Yield Farmer
- AI Agent 开发者
- 黑客松评委 & 加密爱好者
- DAO / 小型 Treasury 管理者

### 2.2 使用场景
1. 用户设定保守型 USDC 收益策略 → Agent 自主在 Base 链执行 Aave/Compound 存款 + 复投。
2. 收益产生后，自动 85% 返还用户，15% 作为 Agent 服务费。
3. 多 Agent 协作：Strategy Agent 决策 + Executor Agent 执行 + Revenue Agent 分账。

---

## 3. 核心功能需求

### 3.1 功能清单（MVP）

#### **Frontend（Nuxt 4）**
- **Dashboard 主页**
  - Agent Wallet 地址、总资产、当前 APY、累计收益（实时更新）
  - 策略卡片（状态：Active / Paused / Completed）
  - 近期 Pact 执行日志（表格 + Tx Hash 链接）

- **创建策略页面**
  - 自然语言输入框（e.g. “保守耕作 500 USDC 于 Base 链，目标 APY 8%+”）
  - 策略参数配置：链、风险级别、最大支出、Agent 绩效费率、分账比例
  - Pact 预览 & 提交按钮

- **Pact 管理页面**
  - 列出所有活跃 Pact
  - 查看详情（白名单、额度、终止条件）
  - 手动审批 / 终止模拟

- **交易历史**
  - 时间线视图
  - 支持筛选（Swap / Supply / Revenue Share）
  - 显示 Transaction Hash 和 Etherscan 链接（测试网）

- **设置页面**
  - Cobo 配置（API Key 管理 - 测试网）
  - Agent 绩效费率设置

#### **Agent 核心逻辑（TypeScript）**
- Strategy Agent：市场分析 & 决策
- Executor Agent：调用 Cobo SDK 创建 Pact 并执行 Recipe
- Revenue Agent：收益到账检测 & 自动分账

### 3.2 Cobo Agentic Wallet 集成要求（必须重点体现）

- 使用 Cobo TypeScript SDK 初始化 Agentic Wallet
- 创建结构化 Pact（包含 intent、policies、duration 等）
- 使用官方 Recipes 执行常见操作（Aave Supply、Uniswap Swap、Compound 等）
- 展示 Pact 创建 → 审批 → 执行 → 日志 全流程
- 提供 Agent Wallet 地址、Transaction Hash、审计记录

---

## 4. 非功能需求

- **安全**：所有资金操作必须通过 CAW Pact 控制，不能直接暴露私钥。
- **可演示性**：Demo 必须在测试网（Base / Arbitrum）上真实执行交易。
- **UI/UX**：现代、暗黑模式、响应式，使用 Tailwind CSS。
- **性能**：Dashboard 实时轮询或 WebSocket 更新日志。
- **技术约束**：必须使用 Nuxt 4 + TypeScript。

---

## 5. 技术架构

### 5.1 技术栈
- **前端框架**：Nuxt 4（Nitro Server）
- **语言**：TypeScript（严格模式）
- **样式**：Tailwind CSS + Headless UI / Nuxt UI
- **状态管理**：Pinia
- **图表**：Chart.js 或 Vue Chart
- **Cobo SDK**：@cobo/agentic-wallet (TypeScript)
- **其他**：Axios（API）、Zod（验证）、date-fns

### 5.2 项目结构（推荐）

```
yield-agent-collective/
├── frontend/                  # Nuxt 4 主项目
│   ├── app/
│   ├── components/
│   ├── pages/
│   │   ├── dashboard.vue
│   │   ├── create-strategy.vue
│   │   ├── pacts.vue
│   │   └── history.vue
│   ├── server/                # Nitro API routes
│   ├── stores/                # Pinia
│   └── composables/
├── agent-core/                # 纯 TS Agent 逻辑
│   ├── cobo.ts
│   ├── agents/
│   └── strategies/
├── docs/
└── README.md
```

---

## 6. 用户流程（User Flow）

### 6.1 首次访问路径

YieldAgent 不应该让用户第一次访问就直接进入 Dashboard。`/` 是独立产品落地页；Dashboard 是用户完成钱包 / Demo 准备后的操作台。

真实用户路径：

1. 用户访问 YieldAgent 首页；
2. 用户理解核心价值：AI Agent 可以执行收益策略，但只能在用户批准的 Pact 边界内行动；
3. 用户点击连接钱包；
4. 用户用自己的 EOA 钱包登录；
5. 系统创建或连接 CAW Agent Wallet / Smart Account；
6. 用户从自己的钱包向 Agent Wallet 转入测试网 USDC；
7. 用户选择策略模板，例如“保守型 USDC 收益”；
8. 用户输入或修改自然语言策略；
9. 系统生成 Pact Preview；
10. 用户确认资金来源、资金上限、允许 Recipe、执行期限和收益分账；
11. 用户签名 / 提交 Pact 审批；
12. Agent 在 Pact 范围内执行收益策略；
13. Dashboard 展示 Agent Wallet 余额、Pact 状态、Agent 动作、审计日志、tx hash 和收益曲线；
14. 用户可进入 History 复查日志，或进入 Pact 管理页终止 Pact。

Demo / Hackathon 评委路径：

1. 用户访问首页；
2. 用户点击 Try Demo / 查看 Demo 控制台；
3. 系统明确展示当前使用 mock balance 或预置测试网 Agent Wallet；
4. 用户从策略模板创建策略；
5. 用户查看 Pact Preview；
6. 用户 dry-run 批准；
7. 系统演示一次允许执行和一次越权拒绝；
8. 用户进入 Dashboard 查看审计日志。

### 6.1.1 钱包登录与资金来源

真实模式需要钱包登录。原因是用户必须作为授权方完成 Agent Wallet 创建、资金注入和 Pact 审批。

Agent 可操作的资金来源必须明确：

```text
User EOA Wallet
  -- deposit / transfer testnet USDC -->
CAW Agent Wallet / Smart Account
  -- Pact max budget + allowlisted recipes -->
Executor Agent
  -- allowed DeFi action -->
Aave / Compound 等协议
```

关键边界：

- Agent 不直接控制用户 EOA 钱包；
- Agent 只能操作用户主动转入 / 授权给 Agent Wallet 的那部分资金；
- Pact 再进一步限制 Agent Wallet 中可用预算，例如 Agent Wallet 有 1,000 USDC，但 Pact maxSpend 是 500 USDC，则 Agent 最多只能操作 500 USDC；
- Demo Mode 可以使用 mock balance 或预置测试网 Agent Wallet，但 UI 必须明确标注不是真实资产。


### 6.2 Pact Preview 确认页 / 确认阶段

Pact Preview 是 YieldAgent 的核心产品体验。它必须清楚区分：

**允许 Agent：**

- 使用最多指定数量的资产，例如 500 USDC；
- 在指定测试网执行，例如 Base Sepolia；
- 调用白名单 Recipe，例如 Aave Supply / Compound Supply；
- 在指定期限内执行，例如 7 天；
- 按用户确认的收益分账比例结算。

**不允许 Agent：**

- 使用超过 Pact 上限的资金；
- 调用非白名单协议或未知 token；
- 在 Pact 终止或过期后继续执行；
- 更改用户确认过的收益分账比例；
- 执行高风险 leverage / LP / 衍生品策略。

### 6.3 Dashboard 使用路径

Dashboard 是策略启动后的监控页面，不是首次使用入口。Dashboard 的信息优先级：

1. 当前 active Pact 与剩余权限边界；
2. 最近 Agent 动作：Strategy Agent、Executor Agent、Revenue Agent；
3. Audit Trail：每一步是否被允许、原因和 tx hash；
4. 策略列表与 Pact 管理入口；
5. 收益曲线，作为辅助信息而不是主视觉。

### 6.4 拒绝路径 Demo

Demo 必须展示至少一个越权请求被拒绝的场景。例如：

```text
Agent 尝试执行：
Swap 500 USDC into unknown token

结果：
Denied

原因：
Recipe not allowed by current Pact.
```

这个拒绝路径比单纯展示成功交易更重要，因为它证明 CAW Pact 真正限制了 Agent 的权限。

---

## 7. 2 周开发时间表

**Week 1**：
- Day 1-2：Nuxt 4 项目初始化 + Tailwind 配置 + 页面框架
- Day 3-5：Cobo SDK 集成 + Pact 创建 & Recipe 执行
- Day 6-7：Agent 决策逻辑 + 简单策略引擎

**Week 2**：
- Day 8-10：Dashboard & 页面 UI 完善 + 图表
- Day 11-12：完整流程测试 + 测试网交易
- Day 13-14：Demo 视频录制 + README + 提交材料准备

---

## 8. 提交材料要求（Cobo 赛道）

- GitHub Repo（结构清晰）
- 本 PRD 文档
- 3-5 分钟 Demo 视频（重点展示资金流动）
- 测试网 Agent Wallet 地址 + Transaction Hashes
- Cobo 集成关键代码说明
- 风险边界说明（Pact 额度、白名单等）

---

## 9. 成功指标
- 成功演示至少 3 次完整资金操作（Swap + Deposit + Revenue Share）
- CAW 是项目不可或缺的核心组件
- UI 美观、流程清晰、文档完整

---

**附录**：
- Cobo 官方文档链接（见赛道介绍）
- 测试网推荐：Base Sepolia 或 Arbitrum Sepolia

---

**文档结束**  
此 PRD 可作为开发蓝图直接使用。