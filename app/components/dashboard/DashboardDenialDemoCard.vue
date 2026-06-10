<script setup lang="ts">
import { DASHBOARD_PACTS } from '#shared/constants/dashboard-routes'
import type { Pact } from '../../../shared/types/app'
import { pickDenialDemoPact } from '~/utils/active-pact'

const props = defineProps<{
  pacts: Pact[]
}>()

const DISMISS_KEY = 'yieldagent-denial-demo-dismissed'

const dismissed = ref(false)
const demoPact = computed(() => pickDenialDemoPact(props.pacts))
const visible = computed(() => Boolean(demoPact.value) && !dismissed.value)

onMounted(() => {
  if (import.meta.client) {
    dismissed.value = localStorage.getItem(DISMISS_KEY) === '1'
  }
})

function dismiss() {
  dismissed.value = true
  if (import.meta.client) {
    localStorage.setItem(DISMISS_KEY, '1')
  }
}
</script>

<template>
  <section
    v-if="visible && demoPact"
    class="rounded-lg border border-hairline bg-surface"
  >
    <div class="flex flex-wrap items-start justify-between gap-3 border-b border-hairline px-5 py-4">
      <div class="max-w-prose space-y-1">
        <h2 class="text-sm font-semibold text-on-dark">越权拒绝演示</h2>
        <p class="text-xs leading-5 text-body">
          模拟超出 Recipe 白名单的请求，验证 Pact 会拒绝并在审计轨迹中留下记录。
        </p>
      </div>
      <button
        type="button"
        class="text-xs text-muted hover:text-on-dark"
        @click="dismiss"
      >
        不再提示
      </button>
    </div>
    <div class="px-5 py-3">
      <NuxtLink
        :to="`${DASHBOARD_PACTS}?highlight=${demoPact.id}`"
        class="inline-flex h-9 items-center rounded-md border border-hairline bg-canvas px-4 text-xs font-semibold text-on-dark no-underline transition-colors hover:bg-surface-elevated"
      >
        前往模拟拒绝
      </NuxtLink>
    </div>
  </section>
</template>
