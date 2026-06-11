import { MAX_MAX_SPEND_USDC, MIN_MAX_SPEND_USDC, NETWORK_LABELS } from '#shared/types/app'
import { parseNumericField } from '#shared/utils/numeric-field'
import { extractApiErrorMessage } from '~/utils/api-error'
import {
  DEFAULT_FORM,
  RISK_LABELS,
  STRATEGY_TEMPLATES,
  TEMPLATE_PRESETS,
  stepIndexFromPipeline,
  type PipelineStage,
  type StrategyForm,
  type StrategyTemplateKey,
} from './strategy-templates'
import { useStrategyPipeline } from './useStrategyPipeline'

export function useCreateStrategy() {
  const route = useRoute()
  const store = useAppStore()
  const queryTemplate = Array.isArray(route.query.template)
    ? route.query.template[0]
    : route.query.template
  const initialTemplate =
    queryTemplate && queryTemplate in TEMPLATE_PRESETS
      ? (queryTemplate as StrategyTemplateKey)
      : 'conservative-usdc'

  const selectedTemplateKey = ref<StrategyTemplateKey>(initialTemplate)
  const customTemplateComingSoon = computed(() => selectedTemplateKey.value === 'custom')
  const form = reactive<StrategyForm>({ ...TEMPLATE_PRESETS[initialTemplate].form })
  const nlOpen = ref(initialTemplate !== 'custom')
  const nlText = ref(TEMPLATE_PRESETS[initialTemplate].nlText)
  const nlFilled = ref(false)
  const errors = reactive<Partial<Record<keyof StrategyForm, string>>>({})
  const nlParsing = ref(false)

  const agentSplit = computed(() => {
    const user = Number(form.userSplit)
    if (Number.isNaN(user)) return '—'
    return String(Math.max(0, Math.min(100, 100 - user)))
  })

  const intentSummary = computed(() => {
    const risk = RISK_LABELS[form.riskLevel]
    const apy = form.targetApy.trim() ? `，目标 APY ${form.targetApy}%` : ''
    return `${risk} · ${form.asset}（${NETWORK_LABELS[form.network]}）${apy}`
  })

  const allowedActions = computed(() => {
    const base = [
      `资金来自 Agent Wallet，本次 Pact 最多允许 ${form.maxSpend || '—'} ${form.asset}`,
      `在 ${NETWORK_LABELS[form.network]} 执行`,
      '调用 Aave Supply / Compound Supply',
      `收益分账：用户 ${form.userSplit}% · Agent ${agentSplit.value}%`,
    ]
    if (form.riskLevel === 'aggressive') base.push('执行小额 Uniswap 兑换（测试网）')
    return base
  })

  const deniedActions = computed(() => [
    `使用超过 ${form.maxSpend || '—'} ${form.asset} 的资金`,
    '调用非白名单协议或未知 token',
    '在 Pact 终止或过期后继续执行',
    '更改用户确认过的收益分账比例',
  ])

  const fundingSourceLabel = computed(() => {
    const prep = store.preparation
    if (!prep?.ready) return '未完成 Agent Wallet 设置'
    return 'EOA → Agent Wallet（测试网）'
  })

  const availableBalanceLabel = computed(() => {
    const prep = store.preparation
    if (!prep?.ready) return '—'
    return '已同步'
  })

  const previewLines = computed(() => [
    { label: '意图', value: intentSummary.value },
    { label: '资金来源', value: fundingSourceLabel.value },
    { label: '资金状态', value: availableBalanceLabel.value },
    { label: '支出上限', value: `${form.maxSpend || '—'} ${form.asset}` },
    { label: '网络', value: NETWORK_LABELS[form.network] },
    {
      label: '允许 Recipe',
      value:
        form.riskLevel === 'aggressive'
          ? 'Aave 存入、Compound 存入、Uniswap 兑换'
          : 'Aave 存入、Compound 存入',
    },
    { label: '期限', value: '7 天（测试网）' },
    {
      label: '收益分账',
      value: `用户 ${form.userSplit}% · Agent ${agentSplit.value}%`,
    },
    { label: 'Agent 绩效费', value: `${form.agentFee}%` },
  ])

  function validateForm(setErrors = true): boolean {
    const next: Partial<Record<keyof StrategyForm, string>> = {}
    const spend = parseNumericField(form.maxSpend)
    const fee = parseNumericField(form.agentFee)
    const user = parseNumericField(form.userSplit)

    const spendRangeMessage = `请输入 ${MIN_MAX_SPEND_USDC}–${MAX_MAX_SPEND_USDC.toLocaleString('en-US')} USDC`

    if (spend === null || spend < MIN_MAX_SPEND_USDC || spend > MAX_MAX_SPEND_USDC) {
      next.maxSpend = spendRangeMessage
    } else if (store.preparation?.ready) {
      const available = store.preparation.funding.availableUsdc
      if (spend > available) {
        next.maxSpend = '不能超过 Agent Wallet 当前可用余额'
      }
    }
    if (fee === null || fee < 0 || fee > 30) {
      next.agentFee = '请输入 0–30%'
    }
    if (user === null || user < 0 || user > 100) {
      next.userSplit = '请输入 0–100%'
    }
    if (form.targetApy.trim()) {
      const apy = parseNumericField(form.targetApy)
      if (apy === null || apy < 0 || apy > 100) {
        next.targetApy = '请输入 0–100，或留空'
      }
    }

    if (setErrors) {
      Object.keys(errors).forEach((k) => delete errors[k as keyof StrategyForm])
      Object.assign(errors, next)
    }

    return Object.keys(next).length === 0
  }

  const isFormValid = computed(() => !customTemplateComingSoon.value && validateForm(false))

  const {
    pipeline,
    executionStep,
    previewTxHash,
    pipelineError,
    pactSubmissionMessage,
    coboPactId,
    approvalId,
    approvalRefreshing,
    executionSteps,
    submitPact,
    refreshApprovalStatus,
    simulateFailure,
    resetToEdit,
    syncPipelineFromFormValidity,
  } = useStrategyPipeline({
    form,
    isFormValid,
    validateBeforeSubmit: () => validateForm(true),
  })

  watch(
    form,
    () => {
      validateForm(true)
      syncPipelineFromFormValidity()
    },
    { deep: true },
  )

  async function parseNlIntoForm() {
    if (!nlText.value.trim() || nlParsing.value) return
    nlParsing.value = true
    try {
      const limits = {
        availableUsdc: store.preparation?.funding.availableUsdc ?? 0,
        network: store.preparation?.network ?? form.network,
      }
      const result = await store.parseStrategyText(nlText.value, limits)
      form.network = result.proposal.network
      form.asset = result.proposal.asset
      form.targetApy = result.proposal.targetApy ?? ''
      form.riskLevel = result.proposal.riskLevel as StrategyForm['riskLevel']
      form.maxSpend = result.proposal.maxSpend
      form.agentFee = result.proposal.agentFee
      form.userSplit = result.proposal.userSplit
      nlFilled.value = true
      validateForm(true)
      syncPipelineFromFormValidity()
    } catch (e: unknown) {
      errors.maxSpend = extractApiErrorMessage(e, '自然语言解析失败')
      pipeline.value = 'configure'
    } finally {
      nlParsing.value = false
    }
  }

  function applyTemplate(key: StrategyTemplateKey) {
    selectedTemplateKey.value = key
    const preset = TEMPLATE_PRESETS[key]
    Object.assign(form, { ...preset.form })
    nlText.value = preset.nlText
    nlOpen.value = key !== 'custom'
    nlFilled.value = key !== 'custom'
    validateForm(true)
    syncPipelineFromFormValidity()
  }

  function clearNlFill() {
    nlFilled.value = false
    Object.assign(form, { ...DEFAULT_FORM })
    validateForm(true)
    pipeline.value = 'configure'
  }

  onMounted(async () => {
    try {
      await Promise.all([store.fetchPreparation(), store.fetchSettings()])
      if (!store.preparation?.ready) {
        await store.fetchWallet({ sync: false })
      }
    } catch { /* page shows gate */ }
  })

  const preparationReady = computed(() => store.preparation?.ready ?? false)
  const stepIndex = computed(() => stepIndexFromPipeline(pipeline.value))

  return {
    form,
    nlOpen,
    nlText,
    nlFilled,
    errors,
    pipeline,
    executionStep,
    previewTxHash,
    pipelineError,
    pactSubmissionMessage,
    coboPactId,
    approvalId,
    approvalRefreshing,
    agentSplit,
    intentSummary,
    previewLines,
    allowedActions,
    deniedActions,
    strategyTemplates: STRATEGY_TEMPLATES,
    selectedTemplateKey,
    customTemplateComingSoon,
    preparationReady,
    availableBalanceLabel,
    fundingSourceLabel,
    isFormValid,
    stepIndex,
    executionSteps,
    validateForm,
    parseNlIntoForm,
    applyTemplate,
    clearNlFill,
    submitPact,
    refreshApprovalStatus,
    simulateFailure,
    resetToEdit,
    nlParsing,
  }
}
