<script setup lang="ts">
useHead({ title: 'YieldAgent · Pact-first DeFi Agent' })

const proofCards = [
  {
    title: '资金先进入 Agent Wallet',
    body: '用户连接 EOA 钱包后，只把愿意让 Agent 操作的测试网 USDC 转入 CAW Agent Wallet。Agent 不直接控制用户完整钱包。',
  },
  {
    title: 'Pact 再限制预算和动作',
    body: '即使 Agent Wallet 有余额，Agent 也只能使用本次 Pact 允许的预算、资产、网络和 Recipe。',
  },
  {
    title: '执行和拒绝都可审计',
    body: '成功交易有 tx hash；越权请求会显示 Denied、原因和对应的 Pact 边界。',
  },
]

const realJourney = [
  '连接用户 EOA 钱包',
  '创建或连接 CAW Agent Wallet',
  '向 Agent Wallet 转入测试网 USDC',
  '选择模板或输入自然语言策略',
  '确认 Pact Preview 并签名审批',
  'Agent 只在 Pact 预算内执行',
  '进入控制台查看日志、tx hash 与拒绝路径',
]

const demoJourney = [
  '进入 Demo 模式',
  '使用 mock / 预置测试网 Agent Wallet 余额',
  '从保守 USDC 模板开始',
  '查看 Pact Preview',
  '演示允许执行和越权拒绝',
  '进入 Demo 控制台复查 Audit Trail',
]
</script>

<template>
  <main class="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
    <section class="grid gap-10 lg:grid-cols-[minmax(0,1.06fr)_minmax(360px,0.94fr)] lg:items-center">
      <div class="space-y-7">
        <div class="inline-flex rounded-full border border-hairline bg-surface px-3 py-1 font-mono text-xs text-muted-strong">
          Product Landing · CAW Agent Wallet · Pact-first
        </div>
        <div class="space-y-4">
          <h1 class="text-balance text-[clamp(2.25rem,6vw,4.75rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-on-dark">
            让 AI Agent 做收益策略，但只给它一小块可控预算。
          </h1>
          <p class="max-w-2xl text-base leading-7 text-body md:text-lg">
            YieldAgent 的真实路径不是直接进入控制台。用户先连接钱包，创建或连接 CAW Agent Wallet，再把愿意让 Agent 操作的测试网资金转入其中。Pact 会继续限制资金上限、允许协议、执行期限和分账规则。
          </p>
        </div>
        <div class="flex flex-col gap-3 sm:flex-row">
          <NuxtLink
            to="/wallet"
            class="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-on-primary no-underline hover:bg-primary-active"
          >
            连接钱包并准备资金
          </NuxtLink>
          <NuxtLink
            to="/create-strategy?mode=demo&template=conservative-usdc"
            class="inline-flex h-11 items-center justify-center rounded-md border border-hairline px-5 text-sm font-semibold text-body no-underline hover:bg-surface"
          >
            直接体验 Demo
          </NuxtLink>
        </div>
        <p class="text-xs leading-5 text-muted">
          Demo 模式使用 mock / 测试网 Agent Wallet，不涉及真实资产。真实模式需要钱包登录、Agent Wallet 资金准备和 Pact 签名审批。
        </p>
      </div>

      <aside class="rounded-xl border border-hairline bg-surface p-5 shadow-2xl shadow-black/30">
        <div class="mb-4 flex items-center justify-between gap-3 border-b border-hairline pb-4">
          <div>
            <p class="text-sm font-semibold text-on-dark">资金与权限边界</p>
            <p class="mt-1 text-xs text-muted">Agent 能动的钱从哪里来，必须一眼看清。</p>
          </div>
          <span class="rounded-sm bg-primary px-2 py-1 font-mono text-[0.65rem] font-semibold text-on-primary">BOUNDED</span>
        </div>
        <div class="space-y-3 rounded-lg bg-canvas p-4 font-mono text-xs text-body">
          <div>User EOA Wallet</div>
          <div class="text-primary">↓ deposit / transfer testnet USDC</div>
          <div>CAW Agent Wallet</div>
          <div class="text-primary">↓ Pact: max 500 USDC + allowlist</div>
          <div>Executor Agent</div>
          <div class="text-primary">↓ allowed Recipe only</div>
          <div>Aave / Compound on testnet</div>
        </div>
        <div class="mt-4 grid gap-3 text-sm text-body">
          <p>✅ Agent 不直接控制用户完整 EOA 钱包。</p>
          <p>✅ Agent Wallet 有余额，也必须再受 Pact 预算限制。</p>
          <p>❌ Swap unknown token 等越权请求会被拒绝。</p>
        </div>
      </aside>
    </section>

    <section class="mt-14 grid gap-4 md:grid-cols-3">
      <article v-for="card in proofCards" :key="card.title" class="rounded-lg border border-hairline bg-surface p-5">
        <h2 class="text-base font-semibold text-on-dark">{{ card.title }}</h2>
        <p class="mt-2 text-sm leading-6 text-muted">{{ card.body }}</p>
      </article>
    </section>

    <section class="mt-14 grid gap-6 lg:grid-cols-2">
      <article class="rounded-xl border border-hairline bg-surface p-6">
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-xl font-semibold text-on-dark">真实 / 测试网路径</h2>
          <span class="rounded-sm bg-surface-elevated px-2 py-1 font-mono text-[0.65rem] text-muted-strong">需要钱包</span>
        </div>
        <ol class="mt-6 space-y-3 text-sm text-body">
          <li v-for="(step, i) in realJourney" :key="step" class="flex gap-3">
            <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-canvas font-mono text-xs text-primary">{{ i + 1 }}</span>
            <span>{{ step }}</span>
          </li>
        </ol>
        <NuxtLink
          to="/wallet"
          class="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary no-underline hover:bg-primary-active"
        >
          开始真实路径
        </NuxtLink>
      </article>

      <article class="rounded-xl border border-hairline bg-surface p-6">
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-xl font-semibold text-on-dark">Demo / 评委路径</h2>
          <span class="rounded-sm bg-surface-elevated px-2 py-1 font-mono text-[0.65rem] text-muted-strong">Mock/Testnet</span>
        </div>
        <ol class="mt-6 space-y-3 text-sm text-body">
          <li v-for="(step, i) in demoJourney" :key="step" class="flex gap-3">
            <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-canvas font-mono text-xs text-primary">{{ i + 1 }}</span>
            <span>{{ step }}</span>
          </li>
        </ol>
        <NuxtLink
          to="/create-strategy?mode=demo&template=conservative-usdc"
          class="mt-6 inline-flex h-10 items-center justify-center rounded-md border border-hairline px-4 text-sm font-semibold text-body no-underline hover:bg-surface-elevated"
        >
          体验 Demo 策略
        </NuxtLink>
      </article>
    </section>
  </main>
</template>
