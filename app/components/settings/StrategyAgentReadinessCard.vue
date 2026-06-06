<script setup lang="ts">
import type { HermesStrategyPingResult, StrategyAgentReadiness } from '../../../shared/types/demo'

function yesNo(value: boolean) {
  return value ? '已就绪' : '未就绪'
}

function modeLabel(mode?: StrategyAgentReadiness['mode']) {
  return mode === 'api' ? '远程 Hermes API' : '本机 Hermes CLI（仅开发）'
}

function providerLabel(provider?: StrategyAgentReadiness['provider']) {
  return provider === 'hermes' ? 'Hermes Agent' : 'Hermes Agent'
}

const props = defineProps<{
  readiness: StrategyAgentReadiness | null
  pingResult?: HermesStrategyPingResult | null
  busy?: boolean
}>()

const emit = defineEmits<{
  refresh: []
  ping: []
}>()
</script>

<template>
  <section class="mt-8 rounded-lg border border-hairline bg-surface p-5">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="font-mono text-xs uppercase tracking-[0.2em] text-muted-strong">Strategy Agent</p>
        <h2 class="mt-2 text-lg font-semibold text-on-dark">策略层：远程调用 Hermes Agent 主机</h2>
        <p class="mt-1 text-sm leading-6 text-muted">
          Hermes runtime 和 TSS Node 都运行在当前 Hermes Agent 主机上。前端最终部署到 Vercel，因此生产路径必须通过可远程访问的 Hermes API / tunnel 调用这台主机；Hermes 输出仍需经过确定性 validator 和 Pact 边界校验。
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="h-9 rounded-md border border-hairline px-3 text-xs font-medium text-muted hover:bg-surface-elevated disabled:opacity-50"
          :disabled="busy"
          @click="emit('refresh')"
        >
          刷新 Hermes 状态
        </button>
        <button
          type="button"
          class="h-9 rounded-md bg-primary px-3 text-xs font-semibold text-on-primary hover:bg-primary-active disabled:opacity-50"
          :disabled="busy || !readiness?.deploymentReady"
          @click="emit('ping')"
        >
          测试远程调用
        </button>
      </div>
    </div>

    <div v-if="!readiness" class="mt-5 h-24 animate-pulse rounded-lg bg-surface-elevated" />

    <div v-else class="mt-5 space-y-4">
      <dl class="grid gap-3 sm:grid-cols-2">
        <div class="rounded-md border border-hairline bg-surface-elevated p-3">
          <dt class="text-xs text-muted">Provider</dt>
          <dd class="mt-1 text-sm font-medium text-on-dark">{{ providerLabel(readiness.provider) }}</dd>
        </div>
        <div class="rounded-md border border-hairline bg-surface-elevated p-3">
          <dt class="text-xs text-muted">调用方式</dt>
          <dd class="mt-1 text-sm text-on-dark">{{ modeLabel(readiness.mode) }}</dd>
        </div>
        <div class="rounded-md border border-hairline bg-surface-elevated p-3">
          <dt class="text-xs text-muted">运行主机</dt>
          <dd class="mt-1 text-sm text-on-dark">当前 Hermes Agent 主机</dd>
        </div>
        <div class="rounded-md border border-hairline bg-surface-elevated p-3">
          <dt class="text-xs text-muted">Vercel 可调用</dt>
          <dd class="mt-1 text-sm" :class="readiness.deploymentReady ? 'text-trading-up' : 'text-trading-down'">
            {{ readiness.deploymentReady ? '已配置远程 API' : '需要 API / tunnel' }}
          </dd>
        </div>
        <div class="rounded-md border border-hairline bg-surface-elevated p-3">
          <dt class="text-xs text-muted">CLI / API</dt>
          <dd class="mt-1 break-all font-mono text-sm text-on-dark">
            {{ readiness.command || readiness.endpoint || '未配置' }}
          </dd>
        </div>
        <div class="rounded-md border border-hairline bg-surface-elevated p-3">
          <dt class="text-xs text-muted">Profile / Model</dt>
          <dd class="mt-1 break-all font-mono text-sm text-on-dark">
            {{ readiness.profile }}{{ readiness.model ? ` · ${readiness.model}` : '' }}
          </dd>
        </div>
      </dl>

      <div class="rounded-md border border-primary/30 bg-primary/5 p-4">
        <p class="text-sm text-body">下一步：{{ readiness.nextAction }}</p>
        <p v-if="readiness.missing.length" class="mt-2 text-xs text-trading-down">
          缺失：{{ readiness.missing.join('、') }}
        </p>
      </div>

      <div v-if="pingResult" class="rounded-md border border-trading-up/30 bg-trading-up/5 p-4">
        <p class="text-sm font-medium text-trading-up">远程调用已返回</p>
        <p class="mt-2 break-all font-mono text-xs leading-5 text-body">{{ pingResult.contentPreview }}</p>
      </div>
    </div>
  </section>
</template>
