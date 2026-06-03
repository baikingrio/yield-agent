<script setup lang="ts">
import type { NetworkId } from '../../../shared/types/demo'

const props = defineProps<{
  hash: string
  network?: NetworkId
}>()

const explorerUrl = computed(() => {
  const hash = props.hash
  if (props.network === 'arbitrum-sepolia') {
    return `https://sepolia.arbiscan.io/tx/${hash}`
  }
  return `https://sepolia.basescan.org/tx/${hash}`
})

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
