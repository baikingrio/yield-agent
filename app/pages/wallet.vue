<script setup lang="ts">
useHead({ title: '准备 Agent Wallet · YieldAgent' })

const steps = [
  {
    title: '连接用户钱包',
    body: '真实模式下用户用 EOA 钱包登录，作为 Agent Wallet 创建、充值和 Pact 审批的授权方。',
    status: 'Demo 中模拟已连接',
  },
  {
    title: '创建 / 连接 CAW Agent Wallet',
    body: 'Agent 后续只操作这个 Agent Wallet 中被 Pact 允许的预算，不直接控制用户完整 EOA 钱包。',
    status: '0x742d…bEb0',
  },
  {
    title: '注入可操作测试资金',
    body: '用户从自己的钱包转入测试网 USDC。Demo 模式使用 mock balance / 预置测试网余额。',
    status: 'Mock balance: 500 USDC ready',
  },
]
</script>

<template>
  <main class="mx-auto max-w-5xl space-y-8 px-4 py-6 md:px-6 md:py-8">
    <header class="space-y-3">
      <div class="inline-flex rounded-full border border-hairline bg-surface px-3 py-1 font-mono text-xs text-muted-strong">
        Wallet preparation · Demo-safe
      </div>
      <h1 class="text-balance text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-tight tracking-tight text-on-dark">
        先准备 Agent 可操作的资金，再创建策略。
      </h1>
      <p class="max-w-2xl text-sm leading-6 text-body">
        YieldAgent 的 Agent 不是直接拿到用户钱包权限。用户先连接钱包，再创建或连接 CAW Agent Wallet，并把愿意授权给 Agent 操作的测试网资金转入其中。Pact 会继续限制本次策略最多能使用多少资金。
      </p>
    </header>

    <section class="grid gap-4 md:grid-cols-3">
      <article v-for="(step, i) in steps" :key="step.title" class="rounded-lg border border-hairline bg-surface p-5">
        <span class="font-mono text-xs text-primary">STEP {{ i + 1 }}</span>
        <h2 class="mt-3 text-base font-semibold text-on-dark">{{ step.title }}</h2>
        <p class="mt-2 text-sm leading-6 text-muted">{{ step.body }}</p>
        <p class="mt-4 rounded-md bg-canvas px-3 py-2 font-mono text-xs text-body">{{ step.status }}</p>
      </article>
    </section>

    <section class="rounded-xl border border-hairline bg-surface p-6">
      <div class="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <h2 class="text-xl font-semibold text-on-dark">本次 Demo 资金状态</h2>
          <p class="mt-2 text-sm leading-6 text-muted">
            为了让评委能快速看完整流程，当前 Demo 使用 mock / 测试网 Agent Wallet 余额。真实上线时这里会显示用户钱包连接状态、Agent Wallet 地址、充值入口和测试网转账结果。
          </p>
        </div>
        <dl class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-lg bg-canvas p-4">
            <dt class="text-xs text-muted">资金来源</dt>
            <dd class="mt-1 text-sm font-semibold text-on-dark">Demo mock / prefunded testnet Agent Wallet</dd>
          </div>
          <div class="rounded-lg bg-canvas p-4">
            <dt class="text-xs text-muted">Agent Wallet 余额</dt>
            <dd class="mt-1 font-mono text-sm text-on-dark">500 USDC ready for Pact</dd>
          </div>
          <div class="rounded-lg bg-canvas p-4">
            <dt class="text-xs text-muted">用户 EOA 权限</dt>
            <dd class="mt-1 text-sm font-semibold text-on-dark">不会给 Agent 无限授权</dd>
          </div>
          <div class="rounded-lg bg-canvas p-4">
            <dt class="text-xs text-muted">下一步</dt>
            <dd class="mt-1 text-sm font-semibold text-on-dark">创建 Pact 策略</dd>
          </div>
        </dl>
      </div>
      <div class="mt-6 flex flex-col gap-3 sm:flex-row">
        <NuxtLink
          to="/create-strategy?mode=demo&template=conservative-usdc"
          class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary no-underline hover:bg-primary-active"
        >
          资金已准备，创建策略
        </NuxtLink>
        <NuxtLink
          to="/dashboard"
          class="inline-flex h-10 items-center justify-center rounded-md border border-hairline px-4 text-sm font-semibold text-body no-underline hover:bg-surface-elevated"
        >
          查看 Demo 控制台
        </NuxtLink>
      </div>
    </section>
  </main>
</template>
