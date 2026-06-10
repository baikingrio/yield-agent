<script setup lang="ts">
const props = defineProps<{
  hash: string
}>()

const explorerUrl = computed(() => `https://sepolia.basescan.org/tx/${props.hash}`)

const shortHash = computed(() => {
  const h = props.hash
  if (h.length <= 14) return h
  return `${h.slice(0, 8)}…${h.slice(-6)}`
})
</script>

<template>
  <a
    :href="explorerUrl"
    target="_blank"
    rel="noopener noreferrer"
    class="font-mono text-xs text-primary no-underline hover:text-primary-active hover:underline"
  >
    {{ shortHash }}
  </a>
</template>
