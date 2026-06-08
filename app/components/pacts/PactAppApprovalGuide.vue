<script setup lang="ts">
import { DASHBOARD_HOME } from '#shared/constants/dashboard-routes'
import type { Pact } from '../../../shared/types/app'

const props = defineProps<{
  pact: Pact
  submissionMessage?: string
  waitingSeconds?: number
  pairingReady?: boolean
}>()

const showDev = ref(false)
const copied = ref<string | null>(null)

const pactId = computed(() => props.pact.coboPactId || props.pact.id)
const intentPreview = computed(() => {
  const lines = props.pact.intent.split('\n').filter(Boolean)
  return lines.slice(0, 2).join(' · ') || props.pact.intent
})

async function copyText(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value)
    copied.value = label
    setTimeout(() => {
      if (copied.value === label) copied.value = null
    }, 2000)
  } catch {
    copied.value = null
  }
}
</script>

<template>
  <section
    class="rounded-lg border border-primary/30 bg-surface-elevated/40 px-4 py-4"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    <h3 class="text-sm font-semibold text-on-dark">
      请在 Cobo App 中批准此 Pact
    </h3>
    <p class="mt-2 text-xs leading-5 text-muted">
      {{
        submissionMessage
          || 'Pact 已提交成功，需钱包主人在 App 内批准后才能激活与执行。这是正常流程，不是系统故障。'
      }}
    </p>

    <p
      v-if="pairingReady === false"
      class="mt-3 rounded-md border border-trading-down/40 bg-surface px-3 py-2 text-xs text-trading-down"
      role="alert"
    >
      Agent Wallet 尚未与 App 配对。
      <NuxtLink :to="DASHBOARD_HOME" class="font-medium text-primary hover:underline">
        请先在控制台完成 App 配对
      </NuxtLink>
    </p>

    <p v-if="waitingSeconds != null && waitingSeconds > 0" class="mt-3 text-xs text-muted">
      正在等待 App 审批…（已等待 {{ waitingSeconds }} 秒，每 4 秒自动刷新）
    </p>

    <p class="mt-3 text-xs text-body">
      <span class="text-muted">对照意图：</span>{{ intentPreview }}
    </p>

    <ol class="mt-4 list-decimal space-y-2 pl-4 text-xs leading-5 text-body">
      <li>
        打开手机
        <strong class="font-medium text-on-dark">Cobo Agentic Wallet App</strong>
        （须与当前 Agent Wallet <strong class="font-medium text-on-dark">已配对</strong> 的同一主人账号）。
      </li>
      <li>
        进入 <strong class="font-medium text-on-dark">待审批 / Pending Approvals</strong>，按上方意图摘要找到本条 Pact。
      </li>
      <li>
        打开详情，核对 Policy 与支出上限（≤ {{ pact.maxSpend }} USDC），点击
        <strong class="font-medium text-on-dark">批准 / Approve</strong>。
      </li>
      <li>
        回到本页：系统会自动刷新；也可点击下方
        <strong class="font-medium text-on-dark">「我已批准，刷新状态」</strong>。
      </li>
    </ol>

    <div class="mt-4 space-y-2">
      <div class="flex flex-wrap items-center gap-2">
        <span class="font-mono text-[0.7rem] text-muted break-all">Pact ID：{{ pactId }}</span>
        <button
          type="button"
          class="rounded border border-hairline px-2 py-0.5 text-[0.65rem] text-body hover:bg-surface"
          @click="copyText('pact', pactId)"
        >
          {{ copied === 'pact' ? '已复制' : '复制' }}
        </button>
      </div>
      <div v-if="pact.approvalId" class="flex flex-wrap items-center gap-2">
        <span class="font-mono text-[0.7rem] text-muted break-all">Approval ID：{{ pact.approvalId }}</span>
        <button
          type="button"
          class="rounded border border-hairline px-2 py-0.5 text-[0.65rem] text-body hover:bg-surface"
          @click="copyText('approval', pact.approvalId!)"
        >
          {{ copied === 'approval' ? '已复制' : '复制' }}
        </button>
      </div>
    </div>

    <details class="mt-4 text-xs text-body">
      <summary class="cursor-pointer text-muted hover:text-on-dark">
        App 里找不到？
      </summary>
      <ul class="mt-2 list-disc space-y-1 pl-4 leading-5 text-muted">
        <li>确认 App 登录账号 = 创建 Agent Wallet 的钱包主人。</li>
        <li>在 App 内手动打开 Pending 列表，勿仅依赖推送通知。</li>
        <li>若已批准但本页仍等待，点「我已批准，刷新状态」或稍等自动轮询。</li>
        <li>仍无效时，复制上方 Pact ID 便于排查。</li>
      </ul>
    </details>

    <details class="mt-2 text-xs">
      <summary
        class="cursor-pointer text-muted hover:text-on-dark"
        @click="showDev = !showDev"
      >
        开发者 / CLI
      </summary>
      <p class="mt-2 font-mono text-[0.65rem] text-muted break-all">
        caw pact show --pact-id {{ pactId }}
      </p>
    </details>
  </section>
</template>
