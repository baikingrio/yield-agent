<script setup lang="ts">
import type { StrategyForm } from '~/composables/useCreateStrategy'

const props = defineProps<{
  form: StrategyForm
  errors: Partial<Record<keyof StrategyForm, string>>
  disabled: boolean
  nlOpen: boolean
  nlText: string
  nlFilled: boolean
}>()

const emit = defineEmits<{
  'update:nlOpen': [boolean]
  'update:nlText': [string]
  parseNl: []
  clearNl: []
}>()

const riskOptions = [
  { value: 'conservative', label: '保守' },
  { value: 'balanced', label: '平衡' },
  { value: 'aggressive', label: '激进' },
] as const
</script>

<template>
  <div class="space-y-6">
    <details
      class="group rounded-lg border border-hairline bg-surface"
      :open="props.nlOpen"
      @toggle="emit('update:nlOpen', ($event.target as HTMLDetailsElement).open)"
    >
      <summary
        class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-on-dark [&::-webkit-details-marker]:hidden"
      >
        <span class="flex items-center justify-between gap-2">
          用自然语言描述（可选）
          <span class="text-xs font-normal text-muted">辅助填充表单</span>
        </span>
      </summary>
      <div class="space-y-3 border-t border-hairline px-4 pb-4 pt-3">
        <label class="sr-only" for="nl-input">策略描述</label>
        <textarea
          id="nl-input"
          :value="props.nlText"
          rows="3"
          :disabled="props.disabled"
          class="w-full resize-y rounded-md border border-transparent bg-canvas px-3 py-2.5 text-sm text-on-dark placeholder:text-muted focus:border-hairline disabled:opacity-60"
          placeholder="例如：在 Base 链保守耕作 500 USDC，支出上限 500，目标 APY 8%"
          @input="emit('update:nlText', ($event.target as HTMLTextAreaElement).value)"
        />
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-md bg-surface-elevated px-3 py-2 text-sm font-semibold text-body transition-colors hover:bg-hairline disabled:opacity-50"
            :disabled="props.disabled || !props.nlText.trim()"
            @click="emit('parseNl')"
          >
            解析并填入表单
          </button>
          <button
            v-if="props.nlFilled"
            type="button"
            class="rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-body"
            :disabled="props.disabled"
            @click="emit('clearNl')"
          >
            清除已解析字段
          </button>
        </div>
        <p v-if="props.nlFilled" class="text-xs text-trading-up">已根据描述更新表单字段。</p>
      </div>
    </details>

    <fieldset :disabled="props.disabled" class="space-y-8 disabled:opacity-70">
      <section class="space-y-4" aria-labelledby="network-heading">
        <h2 id="network-heading" class="text-base font-semibold text-on-dark">网络与资产</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="network" class="mb-1.5 block text-xs font-medium text-muted-strong">网络</label>
            <select
              id="network"
              v-model="props.form.network"
              class="h-10 w-full rounded-md border border-transparent bg-canvas px-3 text-sm text-on-dark"
            >
              <option value="base-sepolia">Base Sepolia 测试网</option>
              <option value="arbitrum-sepolia">Arbitrum Sepolia 测试网</option>
            </select>
          </div>
          <div>
            <label for="asset" class="mb-1.5 block text-xs font-medium text-muted-strong">资产</label>
            <select
              id="asset"
              v-model="props.form.asset"
              class="h-10 w-full rounded-md border border-transparent bg-canvas px-3 text-sm text-on-dark"
            >
              <option value="USDC">USDC</option>
            </select>
          </div>
          <div class="sm:col-span-2">
            <label for="target-apy" class="mb-1.5 block text-xs font-medium text-muted-strong">
              目标 APY（可选）
            </label>
            <input
              id="target-apy"
              v-model="props.form.targetApy"
              type="text"
              inputmode="decimal"
              class="h-10 w-full max-w-xs rounded-md border border-transparent bg-canvas px-3 font-mono text-sm text-on-dark"
              :aria-invalid="!!props.errors.targetApy"
              :aria-describedby="props.errors.targetApy ? 'target-apy-error' : undefined"
            />
            <p v-if="props.errors.targetApy" id="target-apy-error" class="mt-1 text-xs text-trading-down">
              {{ props.errors.targetApy }}
            </p>
            <p v-else class="mt-1 text-xs text-muted">次要指标，不作为页面主视觉。</p>
          </div>
        </div>
      </section>

      <section class="space-y-4" aria-labelledby="risk-heading">
        <h2 id="risk-heading" class="text-base font-semibold text-on-dark">风险与限额</h2>
        <div>
          <span class="mb-2 block text-xs font-medium text-muted-strong">风险级别</span>
          <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="风险级别">
            <label
              v-for="opt in riskOptions"
              :key="opt.value"
              class="cursor-pointer rounded-md border px-3 py-2 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-surface-elevated"
              :class="props.form.riskLevel === opt.value ? 'border-primary text-on-dark' : 'border-hairline text-body'"
            >
              <input
                v-model="props.form.riskLevel"
                type="radio"
                class="sr-only"
                :value="opt.value"
              />
              {{ opt.label }}
            </label>
          </div>
        </div>
        <div>
          <label for="max-spend" class="mb-1.5 block text-xs font-medium text-muted-strong">
            最大支出（USDC）
          </label>
          <input
            id="max-spend"
            v-model="props.form.maxSpend"
            type="text"
            inputmode="decimal"
            class="h-10 w-full max-w-xs rounded-md border border-transparent bg-canvas px-3 font-mono text-sm text-on-dark"
            :aria-invalid="!!props.errors.maxSpend"
            :aria-describedby="props.errors.maxSpend ? 'max-spend-error' : undefined"
          />
          <p v-if="props.errors.maxSpend" id="max-spend-error" class="mt-1 text-xs text-trading-down">
            {{ props.errors.maxSpend }}
          </p>
        </div>
      </section>

      <section class="space-y-4" aria-labelledby="fees-heading">
        <h2 id="fees-heading" class="text-base font-semibold text-on-dark">费率与收益分账</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="agent-fee" class="mb-1.5 block text-xs font-medium text-muted-strong">
              Agent 绩效费率（%）
            </label>
            <input
              id="agent-fee"
              v-model="props.form.agentFee"
              type="text"
              inputmode="decimal"
              class="h-10 w-full rounded-md border border-transparent bg-canvas px-3 font-mono text-sm text-on-dark"
              :aria-invalid="!!props.errors.agentFee"
            />
            <p v-if="props.errors.agentFee" class="mt-1 text-xs text-trading-down">{{ props.errors.agentFee }}</p>
          </div>
          <div>
            <label for="user-split" class="mb-1.5 block text-xs font-medium text-muted-strong">
              用户分成（%）
            </label>
            <input
              id="user-split"
              v-model="props.form.userSplit"
              type="text"
              inputmode="decimal"
              class="h-10 w-full rounded-md border border-transparent bg-canvas px-3 font-mono text-sm text-on-dark"
              :aria-invalid="!!props.errors.userSplit"
            />
            <p v-if="props.errors.userSplit" class="mt-1 text-xs text-trading-down">{{ props.errors.userSplit }}</p>
            <p v-else class="mt-1 text-xs text-muted">Agent 分成自动补足至 100%。</p>
          </div>
        </div>
      </section>
    </fieldset>
  </div>
</template>
