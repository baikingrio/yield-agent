<script setup lang="ts">
import type { CawOnboardStatus } from '../../../shared/types/app'

const props = defineProps<{
  status: CawOnboardStatus | null
  busy?: boolean
}>()

const emit = defineEmits<{
  refresh: []
  start: [agentName: string]
  continue: [sessionId: string, answers: Record<string, unknown>]
}>()

const agentName = ref('YieldAgent')
const answerValues = ref<Record<string, string>>({})

const statusLabel = computed(() => {
  if (!props.status) return '未检查'
  if (props.status.phase === 'active') return '已完成 onboard'
  if (props.status.needsInput) return '需要补充输入'
  if (props.status.phase === 'running') return 'onboard 进行中'
  if (props.status.phase === 'error') return 'onboard 异常'
  return props.status.healthy ? 'CAW CLI 可用' : 'CAW CLI 未就绪'
})

function submitAnswers() {
  if (!props.status?.sessionId) return
  const answers = Object.fromEntries(
    Object.entries(answerValues.value)
      .filter(([, value]) => value.trim().length > 0)
      .map(([key, value]) => [key, value.trim()]),
  )
  emit('continue', props.status.sessionId, answers)
}
</script>

<template>
  <section class="mt-8 rounded-lg border border-hairline bg-surface p-5">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="font-mono text-xs uppercase tracking-[0.2em] text-muted-strong">CAW Onboard</p>
        <h2 class="mt-2 text-lg font-semibold text-on-dark">Hermes Agent 主机 CAW Onboard</h2>
        <p class="mt-1 text-sm leading-6 text-muted">
          这里调用运行在当前 Hermes Agent 主机上的 <code>caw</code> CLI，用于检查/推进 CAW Agent Wallet onboard。敏感输入只提交到服务端，不在前端展示 API Key。
        </p>
      </div>
      <button
        type="button"
        class="h-9 rounded-md border border-hairline px-3 text-xs font-medium text-muted hover:bg-surface-elevated disabled:opacity-50"
        :disabled="busy"
        @click="emit('refresh')"
      >
        刷新 onboard
      </button>
    </div>

    <div v-if="!status" class="mt-5 h-28 animate-pulse rounded-lg bg-surface-elevated" />

    <div v-else class="mt-5 space-y-5">
      <dl class="grid gap-3 sm:grid-cols-2">
        <div class="rounded-md border border-hairline bg-surface-elevated p-3">
          <dt class="text-xs text-muted">状态</dt>
          <dd class="mt-1 text-sm font-medium" :class="status.phase === 'active' ? 'text-trading-up' : 'text-on-dark'">
            {{ statusLabel }}
          </dd>
        </div>
        <div class="rounded-md border border-hairline bg-surface-elevated p-3">
          <dt class="text-xs text-muted">Wallet</dt>
          <dd class="mt-1 break-all font-mono text-sm text-on-dark">{{ status.walletUuid || '未创建' }}</dd>
        </div>
        <div class="rounded-md border border-hairline bg-surface-elevated p-3">
          <dt class="text-xs text-muted">Agent</dt>
          <dd class="mt-1 break-all font-mono text-sm text-on-dark">{{ status.agentName || '未设置' }}{{ status.agentId ? ` · ${status.agentId}` : '' }}</dd>
        </div>
        <div class="rounded-md border border-hairline bg-surface-elevated p-3">
          <dt class="text-xs text-muted">Pairing</dt>
          <dd class="mt-1 text-sm" :class="status.walletPaired ? 'text-trading-up' : 'text-muted'">
            {{ status.walletPaired ? '已配对' : '未配对' }}
          </dd>
        </div>
      </dl>

      <div v-if="status.lastError" class="rounded-md border border-trading-down/30 bg-trading-down/5 p-4 text-sm text-trading-down">
        {{ status.lastError }}
      </div>

      <div v-if="status.needsInput && status.sessionId" class="rounded-md border border-hairline p-4">
        <p class="mb-3 text-sm text-body">CAW onboard 需要补充以下输入：</p>
        <div class="space-y-3">
          <label v-for="prompt in status.prompts" :key="prompt.id" class="block">
            <span class="mb-1 block text-xs text-muted">{{ prompt.label || prompt.id }}</span>
            <input
              v-model="answerValues[prompt.id]"
              :type="prompt.secret ? 'password' : 'text'"
              class="h-10 w-full rounded-md border border-hairline bg-surface px-3 text-sm text-on-dark"
              :placeholder="prompt.description || prompt.id"
            />
          </label>
        </div>
        <button
          type="button"
          class="mt-4 h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-active disabled:opacity-50"
          :disabled="busy"
          @click="submitAnswers"
        >
          继续 onboard
        </button>
      </div>

      <div v-else-if="status.phase !== 'active'" class="rounded-md border border-hairline p-4">
        <label for="onboard-agent-name" class="mb-1.5 block text-xs text-muted">Agent 名称</label>
        <div class="flex flex-col gap-3 sm:flex-row">
          <input
            id="onboard-agent-name"
            v-model="agentName"
            type="text"
            class="h-10 flex-1 rounded-md border border-hairline bg-surface px-3 text-sm text-on-dark"
            placeholder="YieldAgent"
          />
          <button
            type="button"
            class="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-active disabled:opacity-50"
            :disabled="busy || !agentName.trim()"
            @click="emit('start', agentName.trim())"
          >
            启动 / 继续 CAW onboard
          </button>
        </div>
      </div>

      <p v-if="status.nextAction" class="text-xs leading-5 text-muted">下一步：{{ status.nextAction }}</p>
    </div>
  </section>
</template>
