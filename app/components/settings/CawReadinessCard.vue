<script setup lang="ts">
import type { CawReadiness } from '../../../shared/types/app'

const props = defineProps<{
  readiness: CawReadiness | null
  busy?: boolean
}>()

const emit = defineEmits<{
  refresh: []
  provision: [name: string]
}>()

const agentName = ref('YieldAgent Dev')

const modeLabel = computed(() => {
  switch (props.readiness?.pactMode) {
    case 'pact-execution-ready':
      return 'Pact execution ready'
    case 'cobo-pact':
      return '可提交真实 Cobo Pact'
    case 'local-draft':
    default:
      return '配置未完成'
  }
})

const apiKeyLabel = computed(() => {
  if (!props.readiness?.apiKeyConfigured) return '未配置'
  return props.readiness.apiKeySource === 'settings' ? '已配置（会话内）' : '已配置（环境变量）'
})
</script>

<template>
  <section class="mt-8 rounded-lg border border-hairline bg-surface p-5">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="font-mono text-xs uppercase tracking-[0.2em] text-muted-strong">CAW Readiness</p>
        <h2 class="mt-2 text-lg font-semibold text-on-dark">Cobo Agentic Wallet 接入状态</h2>
        <p class="mt-1 text-sm leading-6 text-muted">
          检查是否可提交真实 Cobo Pact，或已具备执行 active Pact 的条件。敏感 Key 不会在前端展示。
        </p>
      </div>
      <button
        type="button"
        class="h-9 rounded-md border border-hairline px-3 text-xs font-medium text-muted hover:bg-surface-elevated disabled:opacity-50"
        :disabled="busy"
        @click="emit('refresh')"
      >
        刷新状态
      </button>
    </div>

    <div v-if="!readiness" class="mt-5 h-32 animate-pulse rounded-lg bg-surface-elevated" />

    <div v-else class="mt-5 space-y-5">
      <dl class="grid gap-3 sm:grid-cols-2">
        <div class="rounded-md border border-hairline bg-surface-elevated p-3">
          <dt class="text-xs text-muted">CAW 环境</dt>
          <dd class="mt-1 font-mono text-sm text-on-dark">{{ readiness.environment }} · {{ readiness.apiBaseUrl }}</dd>
        </div>
        <div class="rounded-md border border-hairline bg-surface-elevated p-3">
          <dt class="text-xs text-muted">Pact 模式</dt>
          <dd class="mt-1 text-sm font-medium text-on-dark">{{ modeLabel }}</dd>
        </div>
        <div class="rounded-md border border-hairline bg-surface-elevated p-3">
          <dt class="text-xs text-muted">API Key</dt>
          <dd class="mt-1 text-sm" :class="readiness.apiKeyConfigured ? 'text-trading-up' : 'text-trading-down'">
            {{ apiKeyLabel }}
          </dd>
        </div>
        <div class="rounded-md border border-hairline bg-surface-elevated p-3">
          <dt class="text-xs text-muted">TSS Node ID</dt>
          <dd class="mt-1 text-sm" :class="readiness.mainNodeConfigured ? 'text-trading-up' : 'text-muted'">
            {{ readiness.mainNodeConfigured ? '已配置' : '未配置' }}
          </dd>
        </div>
        <div class="rounded-md border border-hairline bg-surface-elevated p-3">
          <dt class="text-xs text-muted">Agent ID</dt>
          <dd class="mt-1 break-all font-mono text-sm text-on-dark">{{ readiness.agentId || '未 provision' }}</dd>
        </div>
        <div class="rounded-md border border-hairline bg-surface-elevated p-3">
          <dt class="text-xs text-muted">Agent Wallet</dt>
          <dd class="mt-1 break-all font-mono text-sm text-on-dark">
            {{ readiness.agentWalletAddress || '未创建' }}
          </dd>
        </div>
        <div class="rounded-md border border-hairline bg-surface-elevated p-3">
          <dt class="text-xs text-muted">Funding</dt>
          <dd class="mt-1 text-sm" :class="readiness.fundingReady ? 'text-trading-up' : 'text-muted'">
            {{ readiness.fundingReady ? '测试网 USDC 已准备' : '未完成资金准备' }}
          </dd>
        </div>
        <div class="rounded-md border border-hairline bg-surface-elevated p-3">
          <dt class="text-xs text-muted">缺失项</dt>
          <dd class="mt-1 text-sm text-body">
            {{ readiness.missing.length ? readiness.missing.join('、') : '无' }}
          </dd>
        </div>
      </dl>

      <div class="rounded-md border border-primary/30 bg-primary/5 p-4">
        <p class="text-sm text-body">下一步：{{ readiness.nextAction }}</p>
        <p class="mt-2 text-xs leading-5 text-muted">
          注意：TSS Node 按当前方案运行在这台 Hermes Agent 主机上；Vercel 只承载前端/无状态入口，必须通过远程 API 或 tunnel 调用该主机，不能假设 Vercel 内部有本机 TSS。
        </p>
      </div>

      <div class="rounded-md border border-hairline p-4">
        <label for="caw-agent-name" class="mb-1.5 block text-xs text-muted">Provision Agent 名称</label>
        <div class="flex flex-col gap-3 sm:flex-row">
          <input
            id="caw-agent-name"
            v-model="agentName"
            type="text"
            class="h-10 flex-1 rounded-md border border-hairline bg-surface px-3 text-sm text-on-dark"
            placeholder="YieldAgent Dev"
          />
          <button
            type="button"
            class="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-active disabled:opacity-50"
            :disabled="busy || !agentName.trim()"
            @click="emit('provision', agentName.trim())"
          >
            Provision CAW Agent Key
          </button>
        </div>
        <p class="mt-2 text-xs leading-5 text-muted">
          这是外部副作用：会向当前 CAW API 环境创建 Agent credential。API Key 只保存在服务端会话内存，不会明文显示。
        </p>
      </div>
    </div>
  </section>
</template>
