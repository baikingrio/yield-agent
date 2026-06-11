<script setup lang="ts">
import { DASHBOARD_CREATE_STRATEGY } from '#shared/constants/dashboard-routes'
import { landingPrimaryCta } from '#shared/utils/demo-access'

definePageMeta({ layout: 'default' })

useHead({
  title: 'YieldAgent · 链上 USDC 收益自动化',
  meta: [
    {
      name: 'description',
      content: '在 Cobo Agentic Wallet 上运行自主收益策略。资金隔离、Pact 审批、执行可审计。',
    },
  ],
})

const store = useAppStore()
const prepLoading = ref(true)

const videoSrc = '/videos/yieldagent-hackathon-intro.mp4'
const videoPoster = '/videos/yieldagent-hackathon-intro-poster.jpg'

const metrics = [
  { label: '策略预算', value: '500 USDC' },
  { label: '运行网络', value: 'Base Sepolia' },
  { label: '权限模型', value: 'Pact 约束' },
  { label: '审计状态', value: '全流程记录' },
]

const workflow = [
  {
    title: '隔离资金',
    body: '收益资金进入独立 Agent Wallet，日常钱包不暴露给自动化流程。',
  },
  {
    title: '审批 Pact',
    body: '支出上限、协议白名单、期限和分账规则在执行前明确签署。',
  },
  {
    title: '自动执行',
    body: 'Agent 只在授权边界内调用收益 Recipe，超出边界的动作会被拒绝。',
  },
  {
    title: '持续审计',
    body: '控制台保留动作记录、状态变化与链上交易，方便追踪和复盘。',
  },
]

const productRows = [
  ['支持资产', '测试网 USDC 收益策略'],
  ['策略入口', '保守型模板、自然语言目标、Pact 预览'],
  ['协议范围', 'Aave、Compound 等白名单 Supply Recipe'],
  ['控制方式', '预算、期限、协议、收益分账共同约束'],
]

const guardrails = [
  '不能超过 Pact 预算',
  '不能调用未批准协议',
  '不能在到期后继续执行',
  '不能绕过审计日志',
]

onMounted(async () => {
  try {
    await store.fetchPreparation()
  } catch {
    // The homepage still works when preparation state is unavailable.
  } finally {
    prepLoading.value = false
  }
})

const preparationReady = computed(() => Boolean(store.preparation?.ready))
const primaryCta = computed(() => landingPrimaryCta({ preparation: store.preparation }))
const createStrategyHref = `${DASHBOARD_CREATE_STRATEGY}?template=conservative-usdc`
</script>

<template>
  <main class="bg-canvas text-body">
    <section
      class="border-b border-hairline bg-canvas"
      aria-labelledby="landing-hero-heading"
    >
      <div class="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:px-6 md:py-16 lg:grid-cols-[minmax(0,0.86fr)_minmax(420px,1.14fr)] lg:items-center">
        <div class="max-w-2xl">
          <p class="text-xs font-semibold text-primary">
            Cobo Agentic Wallet · Autonomous Yield
          </p>
          <h1
            id="landing-hero-heading"
            class="mt-4 text-balance text-4xl font-semibold leading-tight text-on-dark md:text-5xl"
          >
            让 USDC 收益自动化运行，权限边界始终清楚。
          </h1>
          <p class="mt-5 max-w-[68ch] text-pretty text-base leading-7 text-body">
            YieldAgent 把资金隔离、策略审批、自动执行和审计记录放在同一条产品链路里。Agent 只执行 Pact 允许的动作，用户保留预算、协议和期限的控制权。
          </p>

          <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <NuxtLink
              :to="primaryCta.href"
              class="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-on-primary no-underline transition-colors duration-150 hover:bg-primary-active focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {{ primaryCta.label }}
            </NuxtLink>
            <NuxtLink
              v-if="preparationReady"
              :to="createStrategyHref"
              class="inline-flex h-11 items-center justify-center rounded-md border border-hairline bg-surface px-5 text-sm font-semibold text-on-dark no-underline transition-colors duration-150 hover:bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              创建保守型策略
            </NuxtLink>
          </div>

          <dl class="mt-10 grid gap-px overflow-hidden rounded-lg border border-hairline bg-hairline sm:grid-cols-2">
            <div
              v-for="metric in metrics"
              :key="metric.label"
              class="bg-surface px-4 py-4"
            >
              <dt class="text-xs text-[var(--color-muted-strong)]">{{ metric.label }}</dt>
              <dd class="mt-1 font-mono text-base font-semibold text-on-dark">{{ metric.value }}</dd>
            </div>
          </dl>
        </div>

        <div id="intro-video" class="overflow-hidden rounded-lg border border-hairline bg-surface" aria-label="项目介绍视频">
          
          <video
            class="aspect-video w-full bg-canvas"
            :poster="videoPoster"
            controls
            playsinline
            preload="metadata"
          >
            <source :src="videoSrc" type="video/mp4">
            当前浏览器不支持 MP4 视频播放。
          </video>
        </div>
      </div>
    </section>

    <section class="border-b border-hairline" aria-labelledby="workflow-heading">
      <div class="mx-auto max-w-7xl px-4 py-14 md:px-6 lg:py-16">
        <div class="max-w-2xl">
          <h2 id="workflow-heading" class="text-2xl font-semibold text-on-dark">从授权到执行，边界先于动作</h2>
          <p class="mt-3 text-sm leading-6 text-[var(--color-muted-strong)]">
            YieldAgent 的核心不是让 Agent 获得更多权限，而是把每一次自动化动作都收束到可验证的 Pact 中。
          </p>
        </div>

        <ol class="mt-8 grid gap-px overflow-hidden rounded-lg border border-hairline bg-hairline md:grid-cols-4" role="list">
          <li
            v-for="(step, index) in workflow"
            :key="step.title"
            class="bg-surface px-5 py-5"
          >
            <span class="font-mono text-xs text-primary">0{{ index + 1 }}</span>
            <h3 class="mt-5 text-base font-semibold text-on-dark">{{ step.title }}</h3>
            <p class="mt-2 text-sm leading-6 text-body">{{ step.body }}</p>
          </li>
        </ol>
      </div>
    </section>

    <section class="border-b border-hairline bg-surface" aria-labelledby="product-heading">
      <div class="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
        <div>
          <h2 id="product-heading" class="text-2xl font-semibold text-on-dark">为受限收益策略设计的控制台</h2>
          <p class="mt-3 text-sm leading-6 text-body">
            当前版本聚焦测试网 USDC 收益自动化。用户先确认资金范围和策略模板，再通过 Pact 给 Agent 可执行的最小权限。
          </p>
          <div class="mt-8 flex flex-col gap-3 sm:flex-row">
            <NuxtLink
              :to="primaryCta.href"
              class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-on-primary no-underline transition-colors duration-150 hover:bg-primary-active focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {{ primaryCta.label }}
            </NuxtLink>
            <NuxtLink
              v-if="preparationReady"
              :to="createStrategyHref"
              class="inline-flex h-10 items-center justify-center rounded-md border border-hairline px-5 text-sm font-semibold text-on-dark no-underline transition-colors duration-150 hover:bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              查看策略模板
            </NuxtLink>
          </div>
        </div>

        <div class="overflow-hidden rounded-lg border border-hairline">
          <dl class="divide-y divide-hairline">
            <div
              v-for="[label, value] in productRows"
              :key="label"
              class="grid gap-2 bg-canvas px-5 py-4 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-6"
            >
              <dt class="text-sm text-[var(--color-muted-strong)]">{{ label }}</dt>
              <dd class="text-sm font-medium text-on-dark">{{ value }}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>

    <section aria-labelledby="guardrails-heading">
      <div class="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:py-16">
        <div>
          <h2 id="guardrails-heading" class="text-2xl font-semibold text-on-dark">Agent 的禁止项写在明面上</h2>
          <p class="mt-3 text-sm leading-6 text-[var(--color-muted-strong)]">
            风控不是执行后的补救。策略提交前就能看到 Agent 能做什么、不能做什么，控制台同步展示成功和拒绝记录。
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div
            v-for="item in guardrails"
            :key="item"
            class="rounded-lg border border-hairline bg-surface px-5 py-4"
          >
            <p class="text-sm font-semibold text-on-dark">{{ item }}</p>
          </div>
        </div>
      </div>
    </section>

    <div class="mx-auto max-w-7xl px-4 pb-12 md:px-6">
      <LandingSiteFooter />
    </div>
  </main>
</template>
