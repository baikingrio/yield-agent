<script setup lang="ts">
useHead({ title: 'Pact 管理 · YieldAgent' })

const route = useRoute()
const store = useDemoStore()
const busy = ref(false)
const loading = ref(true)

const selectedId = computed({
  get: () => {
    const q = route.query.id
    if (typeof q === 'string' && store.pacts.some((p) => p.id === q)) return q
    return store.pacts[0]?.id ?? null
  },
  set: (id: string) => navigateTo({ path: '/pacts', query: { id } }),
})

const selectedPact = computed(() =>
  store.pacts.find((p) => p.id === selectedId.value) ?? null,
)

async function load() {
  loading.value = true
  store.clearError()
  try {
    await store.fetchPacts()
    const q = route.query.id
    if (typeof q === 'string') await store.fetchPact(q).catch(() => {})
  } finally {
    loading.value = false
  }
}

async function onApprove() {
  if (!selectedId.value) return
  busy.value = true
  try {
    await store.approvePact(selectedId.value)
    await store.fetchPacts()
  } catch {
    /* store.error set */
  } finally {
    busy.value = false
  }
}

async function onTerminate() {
  if (!selectedId.value) return
  busy.value = true
  try {
    await store.terminatePact(selectedId.value)
    await store.fetchPacts()
  } finally {
    busy.value = false
  }
}

function selectPact(id: string) {
  selectedId.value = id
}

onMounted(load)
</script>

<template>
  <main class="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
    <header class="mb-6">
      <h1 class="text-2xl font-semibold text-on-dark">Pact 管理</h1>
      <p class="mt-2 text-sm text-muted">查看 CAW Pact 边界，模拟审批或终止。</p>
    </header>

    <UiPageAlert v-if="store.error" :message="store.error" @retry="load" />

    <div v-if="loading" class="h-64 animate-pulse rounded-lg bg-surface" />

    <div v-else-if="store.pacts.length === 0" class="rounded-lg border border-dashed border-hairline px-5 py-12 text-center">
      <p class="text-sm text-muted">暂无 Pact。</p>
      <NuxtLink to="/create-strategy" class="mt-4 inline-block text-sm font-medium text-primary hover:underline">
        创建策略
      </NuxtLink>
    </div>

    <div v-else class="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <PactsPactList
        :pacts="store.pacts"
        :selected-id="selectedId"
        @select="selectPact"
      />
      <PactsPactDetail
        :pact="selectedPact"
        :busy="busy"
        @approve="onApprove"
        @terminate="onTerminate"
      />
    </div>
  </main>
</template>
