<script setup lang="ts">
const { resolved, toggleLightDark } = useTheme()

const label = computed(() =>
  resolved.value === 'dark' ? '切换到浅色主题' : '切换到深色主题',
)
</script>

<template>
  <button
    type="button"
    class="relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-hairline text-on-dark transition-colors duration-150 hover:bg-surface-elevated"
    :aria-label="label"
    :title="label"
    @click="toggleLightDark"
  >
    <svg
      v-if="resolved === 'dark'"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="pointer-events-none size-[18px] overflow-visible"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v1.5M12 19.5V21M5.22 5.22l1.06 1.06M17.72 17.72l1.06 1.06M3 12h1.5M19.5 12H21M5.22 18.78l1.06-1.06M17.72 6.28l1.06-1.06" />
    </svg>
    <svg
      v-else
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="pointer-events-none size-[18px] overflow-visible"
      aria-hidden="true"
    >
      <path d="M20 14.5A7.5 7.5 0 0 1 9.5 4 5.5 5.5 0 1 0 20 14.5Z" />
    </svg>
  </button>
</template>
