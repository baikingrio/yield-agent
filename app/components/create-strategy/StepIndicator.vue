<script setup lang="ts">
const props = defineProps<{
  activeIndex: number
}>()

const steps = ['配置', '预览', '提交', '审批', '执行', '完成'] as const
</script>

<template>
  <ol
    class="flex flex-wrap gap-x-3 gap-y-2 text-xs font-medium text-muted"
    aria-label="创建策略进度"
  >
    <li
      v-for="(step, i) in steps"
      :key="step"
      class="flex items-center gap-2"
      :aria-current="i === props.activeIndex ? 'step' : undefined"
    >
      <span
        class="flex h-6 w-6 items-center justify-center rounded-sm text-[0.65rem] transition-colors duration-150"
        :class="
          i < props.activeIndex
            ? 'bg-surface-elevated text-trading-up'
            : i === props.activeIndex
              ? 'bg-primary text-on-primary'
              : 'bg-surface text-muted-strong'
        "
      >
        {{ i + 1 }}
      </span>
      <span :class="i === props.activeIndex ? 'text-on-dark' : ''">{{ step }}</span>
      <span v-if="i < steps.length - 1" class="hidden text-hairline sm:inline" aria-hidden="true">/</span>
    </li>
  </ol>
</template>
