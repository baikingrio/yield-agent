<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?: 'mark' | 'full'
    size?: 'sm' | 'md'
  }>(),
  {
    variant: 'full',
    size: 'md',
  },
)

const dimension = computed(() => (props.size === 'sm' ? 20 : 28))
const textClass = computed(() => (props.size === 'sm' ? 'text-xs' : 'text-sm'))
</script>

<template>
  <span class="inline-flex items-center gap-2">
    <svg
      :width="dimension"
      :height="dimension"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="shrink-0"
      aria-hidden="true"
    >
      <rect
        x="2.5"
        y="2.5"
        width="27"
        height="27"
        rx="7"
        class="stroke-on-dark"
        stroke-width="2"
      />
      <rect x="7" y="20" width="5" height="6" rx="1.25" class="fill-primary-active" />
      <rect x="13.5" y="15" width="5" height="11" rx="1.25" class="fill-primary-active" />
      <rect x="20" y="10" width="5" height="16" rx="1.25" class="fill-primary" />
      <path
        d="M7 26.5h18"
        class="stroke-muted"
        stroke-width="1.25"
        stroke-linecap="round"
      />
    </svg>
    <span
      v-if="props.variant === 'full'"
      class="font-semibold text-primary"
      :class="textClass"
    >
      YieldAgent
    </span>
  </span>
</template>
