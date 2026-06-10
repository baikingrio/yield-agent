<script setup lang="ts">
import type { StrategyForm } from '~/composables/strategy-templates'

const props = defineProps<{
  form: StrategyForm
  errors: Partial<Record<keyof StrategyForm, string>>
  disabled: boolean
  nlOpen: boolean
  nlText: string
  nlFilled: boolean
  nlParsing?: boolean
  availableBalanceLabel: string
  preparationNetworkLabel: string | null
  networkMismatch: boolean
  agentSplit: string
}>()

const emit = defineEmits<{
  'update:nlOpen': [boolean]
  'update:nlText': [string]
  parseNl: []
  clearNl: []
}>()

const riskOptions = [
  { value: 'conservative', label: '保守', hint: '仅允许 Aave / Compound Supply' },
  { value: 'balanced', label: '平衡', hint: 'Supply 为主，允许小幅仓位调整' },
  { value: 'aggressive', label: '激进', hint: '额外允许测试网 Uniswap 兑换' },
] as const

const controlClass =
  'h-11 w-full rounded-md border border-hairline bg-canvas px-3 text-sm text-on-dark transition-colors focus:border-primary/60 disabled:opacity-60'
const monoControlClass = `${controlClass} font-mono`
</script>

<template>
  <div class="space-y-6">
    <details
      class="group rounded-lg border border-hairline bg-surface"
      :open="props.nlOpen"
      @toggle="emit('update:nlOpen', ($event.target as HTMLDetailsElement).open)"
    >
      <summary
        class="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-on-dark [&::-webkit-details-marker]:hidden"
      >
        <span class="flex items-center justify-between gap-2">
          <span class="flex items-center gap-2">
            <span
              class="inline-block text-muted transition-transform duration-150 group-open:rotate-90"
              aria-hidden="true"
            >›</span>
            用自然语言描述（可选）
          </span>
          <span class="text-xs font-normal text-muted">辅助填充表单</span>
        </span>
      </summary>
      <div class="space-y-3 border-t border-hairline px-5 pb-5 pt-4">
        <label class="sr-only" for="nl-input">策略描述</label>
        <textarea
          id="nl-input"
          :value="props.nlText"
          rows="3"
          :disabled="props.disabled"
          class="w-full resize-y rounded-md border border-hairline bg-canvas px-3 py-2.5 text-sm text-on-dark placeholder:text-muted focus:border-primary/60 disabled:opacity-60"
          placeholder="例如：在 Base 链保守耕作 500 USDC，支出上限 500，目标 APY 8%"
          @input="emit('update:nlText', ($event.target as HTMLTextAreaElement).value)"
        />
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="inline-flex h-11 items-center justify-center rounded-md bg-surface-elevated px-4 text-sm font-semibold text-body transition-colors hover:bg-hairline disabled:opacity-50"
            :disabled="props.disabled || props.nlParsing || !props.nlText.trim()"
            @click="emit('parseNl')"
          >
            {{ props.nlParsing ? '解析中…' : '解析并填入表单' }}
          </button>
          <button
            v-if="props.nlFilled"
            type="button"
            class="inline-flex h-11 items-center justify-center rounded-md px-4 text-sm font-medium text-muted transition-colors hover:bg-surface-elevated hover:text-body"
            :disabled="props.disabled"
            @click="emit('clearNl')"
          >
            清除已解析字段
          </button>
        </div>
        <p v-if="props.nlFilled" class="text-xs text-body">已根据描述更新表单字段。</p>
      </div>
    </details>

    <section
      class="rounded-lg border border-hairline bg-surface p-5"
      aria-labelledby="strategy-params-heading"
    >
      <p class="font-mono text-xs text-muted-strong">Pact 参数</p>
      <h2 id="strategy-params-heading" class="mt-2 text-base font-semibold text-on-dark">
        策略配置
      </h2>
      <p class="mt-2 max-w-prose text-sm leading-6 text-body">
        填写后将同步到右侧 Pact 预览。支出上限不能超过 Agent Wallet 可用余额。
      </p>

      <fieldset :disabled="props.disabled" class="mt-6 disabled:opacity-70">
        <section class="space-y-4" aria-labelledby="network-heading">
          <h3 id="network-heading" class="text-sm font-semibold text-on-dark">网络与资产</h3>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="network" class="mb-1.5 block text-xs text-muted-strong">网络</label>
              <select
                id="network"
                v-model="props.form.network"
                :class="controlClass"
              >
                <option value="base-sepolia">Base Sepolia 测试网</option>
                <option value="arbitrum-sepolia">Arbitrum Sepolia 测试网</option>
              </select>
            </div>
            <div>
              <span class="mb-1.5 block text-xs text-muted-strong">资产</span>
              <p
                class="flex h-11 items-center rounded-md border border-hairline bg-canvas px-3 font-mono text-sm text-on-dark"
              >
                {{ props.form.asset }}
              </p>
            </div>
            <div v-if="props.networkMismatch && props.preparationNetworkLabel" class="sm:col-span-2">
              <p class="rounded-md border border-trading-down/30 bg-canvas px-3 py-2 text-xs text-trading-down">
                当前 Agent Wallet 注资在 {{ props.preparationNetworkLabel }}，与所选网络不一致。
              </p>
            </div>
            <div class="sm:col-span-2">
              <label for="target-apy" class="mb-1.5 block text-xs text-muted-strong">
                目标 APY（可选）
              </label>
              <input
                id="target-apy"
                v-model="props.form.targetApy"
                type="text"
                inputmode="decimal"
                :class="monoControlClass"
                class="sm:max-w-xs"
                :aria-invalid="!!props.errors.targetApy"
                :aria-describedby="props.errors.targetApy ? 'target-apy-error' : 'target-apy-hint'"
              />
              <p v-if="props.errors.targetApy" id="target-apy-error" class="mt-1 text-xs text-trading-down">
                {{ props.errors.targetApy }}
              </p>
            </div>
          </div>
        </section>

        <section
          class="mt-6 space-y-4 border-t border-hairline pt-6"
          aria-labelledby="risk-heading"
        >
          <h3 id="risk-heading" class="text-sm font-semibold text-on-dark">风险与限额</h3>
          <div>
            <span class="mb-2 block text-xs text-muted-strong">风险级别</span>
            <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="风险级别">
              <label
                v-for="opt in riskOptions"
                :key="opt.value"
                class="inline-flex h-11 cursor-pointer items-center rounded-md border px-4 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-surface-elevated"
                :class="props.form.riskLevel === opt.value ? 'border-primary text-on-dark' : 'border-hairline bg-canvas text-body'"
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
            <p class="mt-2 text-xs text-muted">
              {{ riskOptions.find((o) => o.value === props.form.riskLevel)?.hint }}
            </p>
          </div>
          <div>
            <label for="max-spend" class="mb-1.5 block text-xs text-muted-strong">
              最大支出（{{ props.form.asset }}）
            </label>
            <input
              id="max-spend"
              v-model="props.form.maxSpend"
              type="text"
              inputmode="decimal"
              :class="monoControlClass"
              class="sm:max-w-xs"
              :aria-invalid="!!props.errors.maxSpend"
              :aria-describedby="props.errors.maxSpend ? 'max-spend-error' : 'max-spend-hint'"
            />
            <p
              v-if="props.errors.maxSpend"
              id="max-spend-error"
              class="mt-1 text-xs text-trading-down"
            >
              {{ props.errors.maxSpend }}
            </p>
            <p v-else id="max-spend-hint" class="mt-1 text-xs text-muted">
              Agent Wallet 可用余额：{{ props.availableBalanceLabel }}
            </p>
          </div>
        </section>

        <section
          class="mt-6 space-y-4 border-t border-hairline pt-6"
          aria-labelledby="fees-heading"
        >
          <h3 id="fees-heading" class="text-sm font-semibold text-on-dark">费率与收益分账</h3>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="agent-fee" class="mb-1.5 block text-xs text-muted-strong">
                Agent 绩效费率（%）
              </label>
              <input
                id="agent-fee"
                v-model="props.form.agentFee"
                type="text"
                inputmode="decimal"
                :class="monoControlClass"
                :aria-invalid="!!props.errors.agentFee"
                :aria-describedby="props.errors.agentFee ? 'agent-fee-error' : 'agent-fee-hint'"
              />
              <p v-if="props.errors.agentFee" id="agent-fee-error" class="mt-1 text-xs text-trading-down">
                {{ props.errors.agentFee }}
              </p>
              <p v-else id="agent-fee-hint" class="mt-1 text-xs text-muted">
                从策略收益中扣除的服务费，与下方收益分账独立计算。
              </p>
            </div>
            <div>
              <label for="user-split" class="mb-1.5 block text-xs text-muted-strong">
                用户分成（%）
              </label>
              <input
                id="user-split"
                v-model="props.form.userSplit"
                type="text"
                inputmode="decimal"
                :class="monoControlClass"
                :aria-invalid="!!props.errors.userSplit"
                :aria-describedby="props.errors.userSplit ? 'user-split-error' : 'user-split-hint'"
              />
              <p v-if="props.errors.userSplit" id="user-split-error" class="mt-1 text-xs text-trading-down">
                {{ props.errors.userSplit }}
              </p>
              <p v-else id="user-split-hint" class="mt-1 text-xs text-muted">
                Agent 分得 {{ props.agentSplit }}%，与用户分成合计 100%。
              </p>
            </div>
          </div>
        </section>
      </fieldset>
    </section>
  </div>
</template>
