<script setup lang="ts">
const items = [
  {
    title: '资金隔离',
    body: '收益资金进入独立 Agent Wallet，与日常 EOA 分开管理。你只划入愿意自动化的那一部分 USDC。',
  },
  {
    title: '策略合约化',
    body: '每次运行以 Pact 约定支出上限、协议白名单、期限与分账。Agent 不能自行扩大权限或修改条款。',
  },
  {
    title: '执行可审计',
    body: '控制台与交易历史保留完整动作记录、状态变化与链上 tx hash，便于对账与复盘。',
  },
]
</script>

<template>
  <section aria-labelledby="landing-why-heading">
    <h2 id="landing-why-heading" class="text-base font-semibold text-on-dark">
      为什么需要 YieldAgent
    </h2>
    <p class="mt-2 max-w-[65ch] text-sm text-[var(--color-muted-strong)]">
      手动管理多链 USDC 收益耗时且容易遗漏；把完整钱包交给 Agent 又风险过高。YieldAgent 在两者之间提供可审批、可追踪的自动化路径。
    </p>

    <div class="mt-8 grid gap-px overflow-hidden rounded-lg border border-hairline bg-hairline md:grid-cols-3">
      <article
        v-for="item in items"
        :key="item.title"
        class="bg-surface px-5 py-5"
      >
        <h3 class="text-sm font-semibold text-on-dark">{{ item.title }}</h3>
        <p class="mt-2 text-pretty text-sm leading-6 text-body">{{ item.body }}</p>
      </article>
    </div>
  </section>
</template>
