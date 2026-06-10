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
    class="rounded-lg border border-primary/25 bg-surface px-5 py-4"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="max-w-prose space-y-1">
        <p class="font-mono text-xs text-primary">Pact 边界证明</p>
        <h2 class="text-base font-semibold text-on-dark">体验越权拒绝演示</h2>
        <p class="text-sm text-body">
          模拟一笔超出白名单的请求，验证 CAW Pact 会拒绝并在审计日志中记录原因。
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
    <NuxtLink
      :to="`${DASHBOARD_PACTS}?highlight=${demoPact.id}`"
      class="mt-3 inline-flex h-9 items-center justify-center rounded-md border border-hairline px-4 text-xs font-semibold text-on-dark no-underline hover:bg-surface-elevated"
    >
      前往模拟拒绝 →
    </NuxtLink>
  </section>
</template>
