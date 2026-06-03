<script setup lang="ts">
useHead({ title: 'YieldAgent · Pact-first DeFi Agent' })

const proofCards = [
  {
    title: '先授权边界',
    body: '用户先确认最大支出、允许 Recipe、网络、期限与分账比例。Agent 没有无限钱包权限。',
  },
  {
    title: '再执行策略',
    body: 'Strategy / Executor / Revenue Agent 只能在 Pact 范围内生成、执行和记录收益动作。',
  },
  {
    title: '全程可审计',
    body: '每一步都有 action、status、reason 与 tx hash。被拒绝的越权请求同样进入审计日志。',
  },
]

const journey = [
  '选择 Demo 模式或测试网模式',
  '从保守 USDC 模板开始',
  '输入或修改自然语言策略',
  '确认 Pact Preview 权限边界',
  '批准并启动 Agent / dry-run',
  '在控制台查看日志、tx hash 与收益曲线',
]

const templates = [
  {
    key: 'conservative-usdc',
    title: '保守型 USDC 收益',
    badge: '推荐首次体验',
    body: 'Base Sepolia，最多 500 USDC，只允许 Aave / Compound Supply，用户 85%，Agent 15%。',
  },
  {
    key: 'balanced-supply',
    title: '平衡型收益策略',
    badge: '允许小额调整',
    body: '允许小额 Swap + Supply，但仍受预算、白名单协议和期限限制。',
  },
  {
    key: 'custom',
    title: '自定义策略',
    badge: '自然语言输入',
    body: '用自己的语言描述收益目标，系统先生成 Pact Preview，再允许提交。',
  },
]
</script>

<template>
  <main class="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
    <section class="grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:items-center">
      <div class="space-y-7">
        <div class="inline-flex rounded-full border border-hairline bg-surface px-3 py-1 font-mono text-xs text-muted-strong">
          Demo Mode · Cobo CAW Pact-first
        </div>
        <div class="space-y-4">
          <h1 class="text-balance text-[clamp(2.25rem,6vw,4.75rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-on-dark">
            AI Agent 可以执行收益策略，但不能越权。
          </h1>
          <p class="max-w-2xl text-base leading-7 text-body md:text-lg">
            YieldAgent 使用 Cobo CAW Pact 为每个 Agent 设置资金上限、允许协议、执行期限和分账规则。你看到的不只是收益，还有 Agent 被允许做什么、实际做了什么、以及每一步的审计证据。
          </p>
        </div>
        <div class="flex flex-col gap-3 sm:flex-row">
          <NuxtLink
            to="/create-strategy?template=conservative-usdc"
            class="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-on-primary no-underline hover:bg-primary-active"
          >
            创建第一条 Pact 策略
          </NuxtLink>
          <NuxtLink
            to="/dashboard"
            class="inline-flex h-11 items-center justify-center rounded-md border border-hairline px-5 text-sm font-semibold text-body no-underline hover:bg-surface"
          >
            查看 Demo 控制台
          </NuxtLink>
        </div>
      </div>

      <aside class="rounded-xl border border-hairline bg-surface p-5 shadow-2xl shadow-black/30">
        <div class="mb-4 flex items-center justify-between gap-3 border-b border-hairline pb-4">
          <div>
            <p class="text-sm font-semibold text-on-dark">Pact Preview</p>
            <p class="mt-1 text-xs text-muted">批准前先确认 Agent 权限边界。</p>
          </div>
          <span class="rounded-sm bg-primary px-2 py-1 font-mono text-[0.65rem] font-semibold text-on-primary">SAFE</span>
        </div>
        <div class="grid gap-4">
          <section class="rounded-lg bg-canvas p-4">
            <p class="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-strong">允许 Agent</p>
            <ul class="space-y-2 text-sm text-body">
              <li>✅ 使用最多 <span class="font-mono text-on-dark">500 USDC</span></li>
              <li>✅ 在 <span class="font-mono text-on-dark">Base Sepolia</span> 执行</li>
              <li>✅ 调用 Aave / Compound Supply</li>
              <li>✅ 收益分账：用户 85%，Agent 15%</li>
            </ul>
          </section>
          <section class="rounded-lg bg-canvas p-4">
            <p class="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-strong">不允许 Agent</p>
            <ul class="space-y-2 text-sm text-body">
              <li>❌ 使用超过 Pact 上限的资金</li>
              <li>❌ 调用非白名单协议或未知 token</li>
              <li>❌ 在 Pact 终止或过期后继续执行</li>
            </ul>
          </section>
        </div>
      </aside>
    </section>

    <section class="mt-14 grid gap-4 md:grid-cols-3">
      <article v-for="card in proofCards" :key="card.title" class="rounded-lg border border-hairline bg-surface p-5">
        <h2 class="text-base font-semibold text-on-dark">{{ card.title }}</h2>
        <p class="mt-2 text-sm leading-6 text-muted">{{ card.body }}</p>
      </article>
    </section>

    <section class="mt-14 grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
      <div>
        <h2 class="text-2xl font-semibold text-on-dark">从一个安全模板开始</h2>
        <p class="mt-3 text-sm leading-6 text-muted">
          第一次使用不需要空白输入。先选择 Demo 模式和策略模板，YieldAgent 会生成 Pact Preview，再让你确认是否启动 Agent。
        </p>
        <ol class="mt-6 space-y-3 text-sm text-body">
          <li v-for="(step, i) in journey" :key="step" class="flex gap-3">
            <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-surface-elevated font-mono text-xs text-primary">{{ i + 1 }}</span>
            <span>{{ step }}</span>
          </li>
        </ol>
      </div>
      <div class="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
        <NuxtLink
          v-for="item in templates"
          :key="item.key"
          :to="`/create-strategy?template=${item.key}`"
          class="group rounded-lg border border-hairline bg-surface p-5 no-underline transition-colors hover:border-primary/70 hover:bg-surface-elevated"
        >
          <span class="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-primary">{{ item.badge }}</span>
          <h3 class="mt-3 text-base font-semibold text-on-dark">{{ item.title }}</h3>
          <p class="mt-2 text-sm leading-6 text-muted group-hover:text-body">{{ item.body }}</p>
        </NuxtLink>
      </div>
    </section>
  </main>
</template>
