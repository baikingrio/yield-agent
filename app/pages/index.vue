<script setup lang="ts">
import {
  DASHBOARD_CREATE_STRATEGY,
  DASHBOARD_HOME,
} from '#shared/constants/dashboard-routes'

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
const { isConnected, busy, connectWallet } = useWalletConnect()

onMounted(async () => {
  try {
    await store.fetchPreparation()
  } catch {
    // Landing works without session state.
  } finally {
    prepLoading.value = false
  }
})

const preparationReady = computed(() => Boolean(store.preparation?.ready))
const createStrategyHref = `${DASHBOARD_CREATE_STRATEGY}?template=conservative-usdc`
</script>

<template>
  <main class="mx-auto max-w-7xl px-4 pb-16 pt-10 md:px-6 md:pb-24 md:pt-14">
    <section
      class="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,380px)] lg:items-start"
      aria-labelledby="landing-hero-heading"
    >
      <div class="space-y-7">
        <p class="text-xs font-medium text-[var(--color-muted-strong)]">
          自主收益 Agent 平台 · 基于 Cobo Agentic Wallet
        </p>

        <div class="space-y-4">
          <h1
            id="landing-hero-heading"
            class="text-balance text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-[1.15] tracking-[-0.03em] text-on-dark"
          >
            链上 USDC 收益自动化，策略边界由你审批
          </h1>
          <p class="max-w-[65ch] text-pretty text-sm leading-6 text-body md:text-base">
            面向需要自动化收益、又不愿交出完整钱包权限的用户。资金进入独立 Agent Wallet，策略以 Pact 约定支出上限、协议白名单与运行期限；执行过程在控制台全程可查。
          </p>
        </div>

        <ClientOnly>
          <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              v-if="!isConnected"
              type="button"
              class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-on-primary transition-colors duration-150 hover:bg-primary-active disabled:opacity-50"
              :disabled="busy"
              @click="connectWallet()"
            >
              {{ busy ? '连接中…' : '连接钱包' }}
            </button>

            <NuxtLink
              v-else
              :to="DASHBOARD_HOME"
              class="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-on-primary no-underline transition-colors duration-150 hover:bg-primary-active"
            >
              进入控制台
            </NuxtLink>

            <NuxtLink
              v-if="preparationReady"
              :to="createStrategyHref"
              class="inline-flex h-10 items-center justify-center rounded-md border border-hairline px-5 text-sm font-semibold text-on-dark no-underline transition-colors duration-150 hover:bg-surface-elevated"
            >
              创建首个策略
            </NuxtLink>
          </div>

          <template #fallback>
            <div class="h-10 w-32 animate-pulse rounded-md bg-surface" />
          </template>
        </ClientOnly>

        <ClientOnly>
          <p
            v-if="!preparationReady && !prepLoading"
            class="text-sm text-[var(--color-muted-strong)]"
          >
            <template v-if="!isConnected">
              连接钱包后，在控制台完成 Agent Wallet 设置，再创建并审批 Pact。
            </template>
            <template v-else>
              钱包已连接。请在
              <NuxtLink :to="DASHBOARD_HOME" class="font-medium text-primary no-underline hover:text-primary-active">
                控制台
              </NuxtLink>
              完成 Agent Wallet 创建与注资。
            </template>
          </p>
        </ClientOnly>
      </div>

      <LandingProductPreview />
    </section>

    <div class="mt-20 space-y-20 lg:mt-28 lg:space-y-24">
      <LandingWhySection />
      <LandingHowItWorks />
      <LandingFeatures />
      <LandingControlSection />

      <section
        class="rounded-lg border border-hairline bg-surface px-6 py-8 md:px-8"
        aria-label="注册使用"
      >
        <div class="mx-auto max-w-2xl text-center">
          <h2 class="text-base font-semibold text-on-dark">开始管理你的第一条自动化收益策略</h2>
          <p class="mt-2 text-sm text-[var(--color-muted-strong)]">
            连接钱包、在控制台完成 Agent 设置、创建策略并审批 Pact。推荐从保守型 USDC 模板开始。
          </p>
          <div class="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ClientOnly>
              <button
                v-if="!isConnected"
                type="button"
                class="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-on-primary transition-colors duration-150 hover:bg-primary-active disabled:opacity-50 sm:w-auto"
                :disabled="busy"
                @click="connectWallet()"
              >
                {{ busy ? '连接中…' : '连接钱包' }}
              </button>
              <NuxtLink
                v-else
                :to="DASHBOARD_HOME"
                class="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-on-primary no-underline transition-colors duration-150 hover:bg-primary-active sm:w-auto"
              >
                进入控制台
              </NuxtLink>
              <template #fallback>
                <div class="h-10 w-32 animate-pulse rounded-md bg-surface" />
              </template>
            </ClientOnly>
            <NuxtLink
              v-if="isConnected"
              :to="createStrategyHref"
              class="inline-flex h-10 w-full items-center justify-center rounded-md border border-hairline px-6 text-sm font-semibold text-on-dark no-underline transition-colors duration-150 hover:bg-surface-elevated sm:w-auto"
            >
              查看策略模板
            </NuxtLink>
          </div>
        </div>
      </section>

      <LandingSiteFooter />
    </div>
  </main>
</template>
