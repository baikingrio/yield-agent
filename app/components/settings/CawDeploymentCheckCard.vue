<script setup lang="ts">
import type { CawDeploymentCheck } from '../../../shared/types/app'

const props = defineProps<{
  check: CawDeploymentCheck | null
  busy?: boolean
}>()

const emit = defineEmits<{
  refresh: []
}>()

const copied = ref(false)

const blockerLabels: Record<string, string> = {
  missing_api_key: '缺少 AGENT_WALLET_API_KEY',
  missing_main_node: '缺少 AGENT_WALLET_MAIN_NODE_ID',
  tss_offline: 'TSS Node 离线',
  node_id_mismatch: 'MAIN_NODE_ID 与绑定节点不一致',
  wallet_preparing: '钱包仍在 preparing',
  prefer_env_api_key: '建议使用环境变量而非会话内 Key',
  ephemeral_database: 'Vercel 未配置持久化 DATABASE_PATH（易重复创建钱包）',
}

async function copyTemplate() {
  if (!props.check?.envTemplate) return
  try {
    await navigator.clipboard.writeText(props.check.envTemplate)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch { /* ignore */ }
}
</script>

<template>
  <section class="mt-8 rounded-lg border border-hairline bg-surface p-5">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="font-mono text-xs uppercase tracking-[0.2em] text-muted-strong">部署自检</p>
        <h2 class="mt-2 text-lg font-semibold text-on-dark">Vercel + Hermes 分体部署</h2>
        <p class="mt-1 text-sm leading-6 text-muted">
          检查 API Key、TSS Node 与钱包状态是否对齐。不含敏感 Key。
        </p>
      </div>
      <button
        type="button"
        class="h-9 rounded-md border border-hairline px-3 text-xs font-medium text-muted hover:bg-surface-elevated disabled:opacity-50"
        :disabled="busy"
        @click="emit('refresh')"
      >
        刷新
      </button>
    </div>

    <div v-if="!check" class="mt-5 h-24 animate-pulse rounded-lg bg-surface-elevated" />

    <div v-else class="mt-5 space-y-4">
      <ul v-if="check.blockers.length" class="space-y-1 text-sm text-trading-down">
        <li v-for="b in check.blockers" :key="b">• {{ blockerLabels[b] ?? b }}</li>
      </ul>
      <p v-else class="text-sm text-trading-up">部署自检通过</p>

      <ul v-if="check.nextActions.length" class="space-y-1 text-sm text-body">
        <li v-for="(action, i) in check.nextActions" :key="i">{{ i + 1 }}. {{ action }}</li>
      </ul>

      <dl class="grid gap-3 sm:grid-cols-2 text-sm">
        <div class="rounded-md border border-hairline bg-surface-elevated p-3">
          <dt class="text-xs text-muted">API Key</dt>
          <dd class="mt-1 text-on-dark">{{ check.apiKeyConfigured ? check.apiKeySource : '未配置' }}</dd>
        </div>
        <div class="rounded-md border border-hairline bg-surface-elevated p-3">
          <dt class="text-xs text-muted">MAIN_NODE_ID</dt>
          <dd class="mt-1 font-mono text-xs text-on-dark">{{ check.mainNodeId ?? '—' }}</dd>
        </div>
      </dl>

      <button
        type="button"
        class="h-9 rounded-md border border-hairline px-3 text-xs font-medium text-muted hover:bg-surface-elevated"
        @click="copyTemplate"
      >
        {{ copied ? '已复制 env 模板' : '复制 Vercel 环境变量模板' }}
      </button>
    </div>
  </section>
</template>
