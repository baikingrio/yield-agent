<script setup lang="ts">
import type { AppSettings, NetworkId } from '../../../shared/types/app'

const props = defineProps<{
  settings: AppSettings | null
  saving?: boolean
}>()

const emit = defineEmits<{
  save: [body: {
    network: NetworkId
    defaultAgentFee: number
    userSplit: number
    apiKey?: string
    developerMode?: boolean
  }]
}>()

const network = ref<NetworkId>('base-sepolia')
const apiKey = ref('')
const defaultAgentFee = ref(15)
const userSplit = ref(85)
const developerMode = ref(false)
const saved = ref(false)

watch(
  () => props.settings,
  (s) => {
    if (!s) return
    network.value = s.network
    defaultAgentFee.value = s.defaultAgentFee
    userSplit.value = s.userSplit
    developerMode.value = s.developerMode === true
  },
  { immediate: true },
)

function onSubmit() {
  saved.value = false
  emit('save', {
    network: network.value,
    defaultAgentFee: defaultAgentFee.value,
    userSplit: userSplit.value,
    apiKey: apiKey.value.trim() || undefined,
    developerMode: developerMode.value,
  })
}

watch(
  () => props.saving,
  (v, prev) => {
    if (prev && !v) saved.value = true
  },
)
</script>

<template>
  <form class="max-w-md space-y-5" @submit.prevent="onSubmit">
    <div>
      <label for="settings-network" class="mb-1.5 block text-xs text-muted">默认网络</label>
      <select
        id="settings-network"
        v-model="network"
        class="h-10 w-full rounded-md border border-hairline bg-surface px-3 text-sm text-on-dark"
      >
        <option value="base-sepolia">Base Sepolia 测试网</option>
        <option value="arbitrum-sepolia">Arbitrum Sepolia 测试网</option>
      </select>
    </div>

    <div>
      <label for="settings-api-key" class="mb-1.5 block text-xs text-muted">Cobo API Key</label>
      <input
        id="settings-api-key"
        v-model="apiKey"
        type="password"
        autocomplete="off"
        placeholder="Cobo Agent API Key（可从 CAW provision 或平台获得）"
        class="h-10 w-full rounded-md border border-hairline bg-surface px-3 font-mono text-sm text-on-dark placeholder:text-muted"
      />
      <p v-if="settings?.apiKeyConfigured" class="mt-1 text-xs text-trading-up">已配置（会话内）</p>
    </div>

    <div>
      <label for="settings-fee" class="mb-1.5 block text-xs text-muted">默认 Agent 绩效费率 (%)</label>
      <input
        id="settings-fee"
        v-model.number="defaultAgentFee"
        type="number"
        min="0"
        max="30"
        class="h-10 w-full rounded-md border border-hairline bg-surface px-3 font-mono text-sm text-on-dark"
      />
    </div>

    <div>
      <label for="settings-split" class="mb-1.5 block text-xs text-muted">默认用户分成 (%)</label>
      <input
        id="settings-split"
        v-model.number="userSplit"
        type="number"
        min="0"
        max="100"
        class="h-10 w-full rounded-md border border-hairline bg-surface px-3 font-mono text-sm text-on-dark"
      />
    </div>

    <details class="rounded-md border border-hairline bg-canvas px-4 py-3">
      <summary class="cursor-pointer text-sm font-medium text-on-dark">高级 · 开发者</summary>
      <div class="mt-4 space-y-2">
        <label class="flex items-start gap-3 text-sm text-body">
          <input
            v-model="developerMode"
            type="checkbox"
            class="mt-1 h-4 w-4 rounded border-hairline"
          />
          <span>
            开发者模式：允许在无 Cobo 配置时创建本地 Pact Draft 并模拟批准。
            <span class="mt-1 block text-xs text-muted">无法执行链上 Recipe；答辩演示请保持关闭。</span>
          </span>
        </label>
      </div>
    </details>

    <div class="flex items-center gap-4">
      <button
        type="submit"
        class="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active disabled:opacity-50"
        :disabled="saving"
      >
        {{ saving ? '保存中…' : '保存设置' }}
      </button>
      <span v-if="saved" class="text-sm text-trading-up">已保存</span>
    </div>
  </form>
</template>
