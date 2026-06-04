# YieldAgent Product Flow Decisions

> 目的：先把落地页、控制台、钱包登录、Pact 审批、资金来源与 Agent 执行权限讲清楚，再继续改 UI / 实现。

## 1. 首页是不是直接进入控制台？

不是。

`/` 应该是一个单独的产品落地页（Product Landing Page），用来解释 YieldAgent 的核心价值：

> 用户把一部分资金放进 Agent 可操作的钱包/账户里，但 Agent 只能在用户批准的 Pact 权限边界内行动。

落地页只做三件事：

1. 说明产品是什么：Pact-first DeFi Agent。
2. 说明为什么安全：Agent 不能无限动用用户钱包，只能操作被授权的预算和 Recipe。
3. 给出明确入口：
   - 主 CTA：连接钱包 / 开始创建策略；
   - 次 CTA：查看 Demo 控制台。

控制台 `/dashboard` 是用户登录并完成基本准备后的操作台，不是默认首页。

## 2. 用户到落地页后的完整路径

### 2.1 首次真实用户路径

```text
Landing Page
  -> Connect Wallet
  -> 创建或连接 CAW Agent Wallet
  -> Deposit / Fund Agent Wallet
  -> Create Strategy
  -> Pact Preview
  -> Submit Pact Approval
  -> Agent Executes Allowed Recipe
  -> Dashboard / Audit Trail
```

更具体地说：

1. 用户访问首页 `/`。
2. 用户阅读产品说明，理解 Agent 不是直接拿到完整钱包权限。
3. 用户点击「连接钱包」。
4. 用户用自己的 EOA 钱包登录，例如 MetaMask / WalletConnect。
5. 系统检测用户是否已有 CAW Agent Wallet / Smart Account：
   - 如果没有：引导创建；
   - 如果已有：引导进入下一步。
6. 用户给 Agent Wallet 注入可操作资金，例如测试网 USDC。
7. 用户创建策略：选择模板或输入自然语言。
8. 系统生成 Pact Preview：资金上限、允许 Recipe、期限、收益分账、拒绝规则。
9. 用户提交审批 / 签名确认 Pact。
10. Agent 只能在该 Pact 范围内执行。
11. 用户进入 Dashboard 查看：
    - Agent Wallet 余额；
    - Active Pact；
    - 最近 Agent 动作；
    - Audit Trail；
    - tx hash；
    - 收益曲线。

### 2.2 Demo / Hackathon 评委路径

Demo 可以简化，但不能模糊资金来源。

```text
Landing Page
  -> Try Demo
  -> Demo Mode explains: using mock/testnet funded Agent Wallet
  -> Create Strategy from Template
  -> Pact Preview
  -> Approve / Dry Run
  -> Simulate Allowed Execution
  -> Simulate Denied Overreach Request
  -> Dashboard
```

Demo Mode 页面必须明确写：

- 当前是 Demo / testnet 环境；
- 资金来自预置的测试网 Agent Wallet 或 mock balance；
- 不使用真实资产；
- 真实模式下需要用户连接钱包并向 Agent Wallet 注入资金。

## 3. 需要钱包登录吗？

真实模式需要。

原因：

- 用户必须证明自己是资金和策略的授权方；
- Pact 审批应该由用户钱包签名确认；
- Agent Wallet 的创建、充值、Pact 授权都需要用户身份。

### 3.1 未登录状态

用户可以访问：

- 落地页；
- Demo 说明；
- 只读 Demo 控制台。

但不能执行真实动作：

- 不能创建真实 CAW Agent Wallet；
- 不能提交真实 Pact；
- 不能执行真实 Recipe；
- 不能显示真实用户资金。

### 3.2 已登录状态

用户可以：

- 创建 / 连接 CAW Agent Wallet；
- 查看自己的 Agent Wallet 余额；
- 向 Agent Wallet 转入资金；
- 创建策略；
- 提交 Pact 审批；
- 启动 Agent 执行；
- 终止 Pact；
- 查看自己的审计日志。

## 4. Agent 可操作的资金从哪里来？

这是产品逻辑里最重要的问题。答案必须明确：

> Agent 可操作的资金来自用户主动注入 / 授权给 CAW Agent Wallet 的那一部分资金，而不是来自用户完整钱包，也不是平台凭空生成。

### 4.1 推荐 MVP 资金模型

MVP 使用「用户钱包 -> Agent Wallet -> Pact budget -> Agent execution」模型。

```text
User EOA Wallet
  -- deposit / transfer testnet USDC -->
CAW Agent Wallet / Smart Account
  -- Pact limits max budget + allowed recipes -->
Executor Agent
  -- execute allowed DeFi action -->
Protocol, e.g. Aave / Compound
```

关键点：

- 用户的钱先在自己的 EOA 钱包里；
- 用户连接钱包后，系统创建或绑定一个 CAW Agent Wallet；
- 用户把愿意给 Agent 操作的测试网 USDC 转入 Agent Wallet；
- Pact 只允许 Agent 操作 Agent Wallet 中的一部分预算，例如 500 USDC；
- 即使 Agent Wallet 有 1,000 USDC，如果 Pact maxSpend 是 500 USDC，Agent 也只能操作最多 500 USDC；
- Agent 不能直接操作用户 EOA 钱包里的其它资产。

### 4.2 Demo 资金模型

Demo 可以使用两种方式之一：

1. **Mock Balance**：前端显示一个演示 Agent Wallet 余额，例如 500 USDC，不发真实交易；
2. **Prefunded Testnet Agent Wallet**：项目方预置一个测试网 CAW Agent Wallet，里面有测试网 USDC，演示真实 tx hash。

无论哪种，UI 都要标注：

- Demo Mode；
- mock / testnet funds；
- no real funds；
- 真实模式下资金来自用户连接钱包后的 deposit / transfer。

## 5. Pact 审批到底审批什么？

Pact 审批不是「允许 Agent 随便操作钱包」。它审批的是一组边界条件：

- 哪个 Agent Wallet；
- 哪个 Strategy；
- 最多可操作多少资金；
- 允许哪些资产；
- 允许哪些协议 / Recipe；
- 允许在哪个网络执行；
- Pact 生效和过期时间；
- 收益分账比例；
- 拒绝条件。

审批后，Agent 执行层每一步都要经过 Pact 校验。

## 6. 创建策略、审批、执行的清晰顺序

```text
Step 1: Connect Wallet
用户连接自己的钱包。

Step 2: Prepare Agent Wallet
系统创建 / 连接 CAW Agent Wallet。

Step 3: Fund Agent Wallet
用户向 Agent Wallet 转入可操作资金，或者 Demo 使用 mock/testnet funded wallet。

Step 4: Create Strategy
用户选择模板或输入自然语言策略。

Step 5: Generate Pact Preview
系统把策略翻译成可审批的权限边界。

Step 6: User Approval
用户确认并签名 / 提交 Pact。

Step 7: Agent Execution
Strategy Agent 生成动作，Executor Agent 只执行 Pact 允许的 Recipe。

Step 8: Audit Trail
每一步记录 action、status、reason、tx hash。

Step 9: Denial Path
如果 Agent 请求超出 Pact，系统展示 Denied，而不是静默失败。
```

## 7. 页面结构调整结论

推荐页面结构：

```text
/                       # 单独产品落地页
/demo                   # 可选：Demo 模式说明 / 快速体验入口
/dashboard              # 控制台，登录后或 demo 后进入
/create-strategy        # 创建策略
/wallet                 # Agent Wallet 准备与充值
/pacts                  # Pact 管理
/history                # Audit Trail / tx history
/settings               # API / network / demo settings
```

如果时间紧，MVP 可以先不做独立 `/wallet` 页面，但创建策略前必须有一个「资金准备」步骤或卡片，讲清楚：

- 当前 Agent Wallet 地址；
- 当前余额；
- 资金来源：用户转入 / demo mock；
- 本次 Pact 可使用预算。

## 8. UI 文案原则

需要避免让评委误解为：Agent 直接控制用户全部钱包。

推荐文案：

- 「连接钱包」而不是「进入控制台」作为真实模式主入口；
- 「向 Agent Wallet 注入测试资金」而不是「给 Agent 钱」；
- 「本次 Pact 允许使用最多 500 USDC」而不是「Agent 有 500 USDC」；
- 「超出 Pact 的请求会被拒绝」而不是「执行失败」。

## 9. 当前实现需要修正的地方

当前已经把 `/` 做成落地页、`/dashboard` 做成控制台，但用户路径仍不完整。下一步应补：

1. 首页 CTA 区分：
   - Connect Wallet / Start Strategy；
   - Try Demo / View Demo Console。
2. 新增或模拟钱包登录状态。
3. 在创建策略前加入 Agent Wallet 资金准备说明。
4. 在 Pact Preview 里显示资金来源：
   - User Wallet deposit；或
   - Demo mock/testnet Agent Wallet。
5. Dashboard 顶部突出 Active Pact + Agent Wallet balance，而不是收益图。
6. Demo Mode 明确标注资金是 mock/testnet，不是真实用户资金。
