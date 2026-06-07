<script setup lang="ts">
const features = [
  {
    name: '策略模板',
    detail: '保守型、平衡型与自定义自然语言三种入口，降低首次配置成本。',
  },
  {
    name: '协议接入',
    detail: '按网络支持 Aave、Compound 等 Supply 类 Recipe，白名单在 Pact 中明示。',
  },
  {
    name: 'Pact 全周期',
    detail: '创建、审批、执行、赎回与结束策略，状态在 Pact 管理中持续同步。',
  },
  {
    name: '风控拦截',
    detail: '超出白名单或预算的请求会被拒绝，原因写入日志，不会静默失败。',
  },
]
</script>

<template>
  <section aria-labelledby="landing-features-heading">
    <h2 id="landing-features-heading" class="text-base font-semibold text-on-dark">
      产品能力
    </h2>
    <p class="mt-2 max-w-[65ch] text-sm text-[var(--color-muted-strong)]">
      当前版本聚焦 USDC 收益自动化与 Pact 约束执行，适合个人与小型资金池的试点运行。
    </p>

    <dl class="mt-8 divide-y divide-hairline rounded-lg border border-hairline">
      <div
        v-for="feature in features"
        :key="feature.name"
        class="grid gap-2 px-5 py-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6"
      >
        <dt class="text-sm font-semibold text-on-dark">{{ feature.name }}</dt>
        <dd class="text-sm leading-6 text-body">{{ feature.detail }}</dd>
      </div>
    </dl>
  </section>
</template>
