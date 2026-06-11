# PactTrader Demo Story

> 3–5 分钟 Hackathon 演示脚本。当前公开 Demo 使用 Try Demo-first 路径，真实 EOA / CAW 配对保留为高级路径。

## 一句话

PactTrader 不是让 AI 自由操作资产，而是让 Agent 在用户预先定义的 Pact / policy 边界内提出和执行小额、可解释、可撤销、可审计的策略动作。

> Agent proposes. Policy decides. CAW executes only when allowed.

## 主流程

```text
Landing Page
  -> Try Demo
  -> Dashboard
  -> Preset CAW Agent Wallet / Demo State
  -> Strategy Proposal
  -> Pact / Policy Decision
  -> Execution or Denial
  -> SQLite Audit Log
```

## 演示步骤

1. **Landing：讲问题**  
   打开首页，说明 PactTrader 解决的是 AI Agent 执行权限边界问题，不是“AI 自由交易”。点击 `Try Demo`。

2. **Dashboard：讲 Demo-first**  
   进入控制台，说明评审无需先连接钱包；预置 Demo state 用来展示 CAW Agent Wallet、策略、Pact 和日志主路径。

3. **Strategy：Agent 只生成 proposal**  
   展示策略模板 / 自然语言输入 / Pact Preview。强调 LLM 或策略层输出不是最终授权，必须经过 deterministic validation。

4. **Pact / Policy：先裁决，再执行**  
   展示允许路径和拒绝路径：预算内、白名单协议通过；超额、未知 token、非白名单协议被拒绝。

5. **Audit Log：结果可复查**  
   展示 allowed / blocked / pending / failed 等事件都进入 SQLite audit log，方便用户复盘。

## 当前验证

```text
pnpm test tests/demo-access.test.ts tests/pacttrader-demo-wallet.test.ts tests/pacttrader-demo-create-agent-api.test.ts -- --runInBand
# 3 个 test files 通过，7 个测试通过

pnpm test -- --runInBand
# 48 个 test files 通过，1 个 skipped；164 个测试通过，1 个 skipped

pnpm build
# Nuxt / Nitro 生产构建成功
```

## 不在 Demo 中声称

- 不声称 AI 可以控制用户完整 EOA 钱包。
- 不声称当前 Demo 使用主网真实资金。
- 不在公开材料中展示 `.env`、API Key、私钥、助记词或真实资金地址。
- 不把 dry-run / preset demo 包装成完整生产执行。
