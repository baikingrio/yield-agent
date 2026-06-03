<script setup lang="ts">
import type { DemoSettings, NetworkId } from '../../../shared/types/demo'

const props = defineProps<{
  settings: DemoSettings | null
  saving?: boolean
}>()

const emit = defineEmits<{
  save: [body: {
    network: NetworkId
    defaultAgentFee: number
    userSplit: number
    apiKey?: string
  }]
}>()

const network = ref<NetworkId>('base-sepolia')
const apiKey = ref('')
const defaultAgentFee = ref(15)
const userSplit = ref(85)
const saved = ref(false)

watch(
  () => props.settings,
  (s) => {
    if (!s) return
    network.value = s.network
    defaultAgentFee.value = s.defaultAgentFee
    userSplit.value = s.userSplit
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
        placeholder="仅演示，不会写入仓库"
        class="h-10 w-full rounded-md border border-hairline bg-surface px-3 font-mono text-sm text-on-dark placeholder:text-muted"
      />
      <p v-if="settings?.apiKeyConfigured" class="mt-1 text-xs text-trading-up">已配置（演示占位）</p>
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
