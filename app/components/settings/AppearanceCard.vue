<script setup lang="ts">
import { THEME_OPTIONS } from '~/composables/useTheme'

const { preference, resolved, setPreference } = useTheme()
</script>

<template>
  <section
    class="mt-8 rounded-lg border border-hairline bg-surface p-5"
    aria-labelledby="appearance-heading"
  >
    <p class="font-mono text-xs text-muted-strong">界面</p>
    <h2 id="appearance-heading" class="mt-2 text-lg font-semibold text-on-dark">外观</h2>
    <p class="mt-2 text-sm text-body">
      切换浅色或深色主题。当前生效：
      <span class="font-medium text-on-dark">{{ resolved === 'dark' ? '深色' : '浅色' }}</span>
    </p>

    <fieldset class="mt-5 space-y-2">
      <legend class="sr-only">主题偏好</legend>
      <label
        v-for="option in THEME_OPTIONS"
        :key="option.value"
        class="flex cursor-pointer items-start gap-3 rounded-md border px-4 py-3 transition-colors duration-150"
        :class="preference === option.value ? 'border-primary bg-surface-elevated' : 'border-hairline hover:bg-surface-elevated'"
      >
        <input
          type="radio"
          name="theme-preference"
          class="mt-1"
          :checked="preference === option.value"
          @change="setPreference(option.value)"
        >
        <span>
          <span class="block text-sm font-semibold text-on-dark">{{ option.label }}</span>
          <span class="mt-0.5 block text-xs text-muted">{{ option.hint }}</span>
        </span>
      </label>
    </fieldset>
  </section>
</template>
