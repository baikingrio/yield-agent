<script setup lang="ts">
useHead({ title: 'YieldAgent · Pact-first DeFi Agent' })

const proofRows = [
  {
    label: '资金入口',
    title: '资金先进入 Agent Wallet',
    body: '用户连接 EOA 后，仅把愿意交给 Agent 操作的测试网 USDC 转入 CAW Agent Wallet。Agent 不直接控制完整 EOA。',
  },
  {
    label: '策略边界',
    title: 'Pact 再限制预算和动作',
    body: '即使 Agent Wallet 有余额，单次策略仍受 Pact 的 maxSpend、网络、Recipe 白名单与期限约束。',
  },
  {
    label: '审计证据',
    title: '执行和拒绝都可追溯',
    body: '成功操作附带 tx hash；越权请求显示 Denied 与拒绝原因，便于核对边界是否生效。',
  },
]

const journey = [
  '连接用户 EOA 钱包（MetaMask 等）',
  '创建 CAW Agent Wallet',
  '向 Agent Wallet 转入测试网 USDC',
  '选择模板或输入自然语言策略',
  '确认 Pact Preview 并审批',
  'Agent 仅在 Pact 预算内执行',
  '进入控制台查看日志、tx hash 与拒绝记录',
]

const boundaryChecks = [
  { ok: true, text: 'Agent 不直接控制用户完整 EOA 钱包' },
  { ok: true, text: 'Agent Wallet 有余额时，仍受 Pact maxSpend 限制' },
  { ok: false, text: 'Swap unknown token：Recipe 不在白名单，请求被拒绝' },
]
</script>

<template>
  <main class="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
    <section
      class="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-start"
      aria-labelledby="landing-hero-heading"
    >
      <div class="space-y-6">
        <p class="font-mono text-xs text-muted-strong">
          YieldAgent Collective · CAW Pact · 测试网
        </p>
        <div class="space-y-4">
          <h1
            id="landing-hero-heading"
            class="text-balance text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-[1.15] tracking-[-0.03em] text-on-dark"
          >
            让 AI Agent 执行收益策略，但只给它一块你可审计的预算。
          </h1>
          <p class="max-w-[65ch] text-pretty text-sm leading-6 text-body md:text-base">
            先连接钱包、准备 Agent Wallet 资金，再用 Pact 写明上限与允许 Recipe，然后进入控制台查看执行与拒绝记录。
          </p>
        </div>
        <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <NuxtLink
            to="/wallet"
            class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-on-primary no-underline transition-colors duration-150 hover:bg-primary-active"
          >
            连接钱包并准备资金
          </NuxtLink>
          <NuxtLink
            to="/dashboard"
            class="inline-flex h-10 items-center justify-center px-2 text-sm font-medium text-primary no-underline hover:text-primary-active"
          >
            打开控制台
          </NuxtLink>
        </div>
        <p class="max-w-[65ch] text-xs leading-5 text-muted-strong">
          使用 Base / Arbitrum Sepolia 测试网与 Nitro API；不涉及主网真实资产。注资与链上执行由测试网环境模拟并记录审计日志。
        </p>
      </div>

      <aside
        class="rounded-lg border border-hairline bg-surface lg:sticky lg:top-[calc(3.5rem+1.5rem)]"
        aria-labelledby="boundary-diagram-heading"
      >
        <div class="border-b border-hairline px-5 py-4">
          <h2 id="boundary-diagram-heading" class="text-base font-semibold text-on-dark">
            资金与权限边界
          </h2>
          <p class="mt-1 text-xs text-muted-strong">
            Agent 能动用的钱从哪来、能花多少，应一眼可读。
          </p>
        </div>
        <div class="space-y-1 px-5 py-4 font-mono text-xs leading-6 text-body">
          <div>User EOA Wallet</div>
          <div class="text-primary">↓ 转入测试网 USDC</div>
          <div>CAW Agent Wallet</div>
          <div class="text-primary">↓ Pact：max 500 USDC + allowlist</div>
          <div>Executor Agent</div>
          <div class="text-primary">↓ 仅允许 Recipe</div>
          <div>Aave / Compound（测试网）</div>
        </div>
        <ul class="space-y-2 border-t border-hairline px-5 py-4" role="list">
          <li
            v-for="item in boundaryChecks"
            :key="item.text"
            class="flex gap-2 text-sm leading-6"
          >
            <span
              class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
              :class="item.ok ? 'bg-trading-up' : 'bg-trading-down'"
              :aria-hidden="true"
            />
            <span :class="item.ok ? 'text-body' : 'text-trading-down'">{{ item.text }}</span>
          </li>
        </ul>
      </aside>
    </section>

    <section class="mt-12 lg:mt-16" aria-labelledby="proof-heading">
      <h2 id="proof-heading" class="text-base font-semibold text-on-dark">
        两分钟应能回答的两件事
      </h2>
      <p class="mt-2 max-w-[65ch] text-sm text-muted-strong">
        边界在哪？证据在哪？下面三点对应资金入口、Pact 约束与可审计轨迹。
      </p>
      <dl class="mt-6 divide-y divide-hairline rounded-lg border border-hairline bg-surface">
        <div
          v-for="row in proofRows"
          :key="row.title"
          class="grid gap-3 px-5 py-4 md:grid-cols-[7rem_minmax(0,1fr)] md:gap-6"
        >
          <dt class="font-mono text-xs text-primary">{{ row.label }}</dt>
          <dd class="min-w-0">
            <p class="text-sm font-semibold text-on-dark">{{ row.title }}</p>
            <p class="mt-1.5 text-pretty text-sm leading-6 text-body">{{ row.body }}</p>
          </dd>
        </div>
      </dl>
    </section>

    <section
      class="mt-8 rounded-lg border border-hairline bg-canvas px-5 py-4 md:px-6"
      aria-labelledby="denial-heading"
    >
      <h2 id="denial-heading" class="text-sm font-semibold text-on-dark">
        拒绝路径也是产品能力
      </h2>
      <p class="mt-2 text-sm text-body">
        产品应能展示至少一次越权被拒，证明 Pact 在拦截，而非只展示成功收益。
      </p>
      <pre
        class="mt-4 overflow-x-auto rounded-md border border-hairline bg-surface p-4 font-mono text-xs leading-6 text-body"
      ><code>Agent attempted: Swap 500 USDC → unknown token
Result: Denied
Reason: Recipe not allowed by current Pact.</code></pre>
    </section>

    <section class="mt-12 lg:mt-16" aria-labelledby="journey-heading">
      <article class="rounded-lg border border-hairline bg-surface p-6">
        <h2 id="journey-heading" class="text-base font-semibold text-on-dark">测试网入门路径</h2>
        <p class="mt-2 text-sm text-muted">需要 MetaMask 等浏览器钱包，并完成资金准备三步。</p>
        <ol class="mt-5 space-y-3">
          <li
            v-for="(step, i) in journey"
            :key="step"
            class="flex gap-3 text-sm leading-6 text-body"
          >
            <span
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-canvas font-mono text-xs text-primary"
              aria-hidden="true"
            >{{ i + 1 }}</span>
            <span>{{ step }}</span>
          </li>
        </ol>
        <NuxtLink
          to="/wallet"
          class="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary no-underline transition-colors duration-150 hover:bg-primary-active"
        >
          开始准备资金
        </NuxtLink>
      </article>
    </section>
  </main>
</template>
