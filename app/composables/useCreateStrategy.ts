import { MAX_MAX_SPEND_USDC, MIN_MAX_SPEND_USDC, NETWORK_LABELS } from '#shared/types/app'
import { parseNumericField } from '#shared/utils/numeric-field'
import { extractApiErrorMessage } from '~/utils/api-error'

export type NetworkId = 'base-sepolia' | 'arbitrum-sepolia'
export type RiskLevel = 'conservative' | 'balanced' | 'aggressive'

export type StrategyTemplateKey = 'conservative-usdc' | 'balanced-supply' | 'custom'

export type PipelineStage =
  | 'configure'
  | 'preview-ready'
  | 'submitting'
  | 'awaiting-approval'
  | 'executing'
  | 'success'
  | 'failed'

export interface StrategyForm {
  network: NetworkId
  asset: string
  targetApy: string
  riskLevel: RiskLevel
  maxSpend: string
  agentFee: string
  userSplit: string
}

const RISK_LABELS: Record<RiskLevel, string> = {
  conservative: '保守型收益',
  balanced: '平衡型收益',
  aggressive: '激进型收益',
}

const DEFAULT_FORM: StrategyForm = {
  network: 'base-sepolia',
  asset: 'USDC',
  targetApy: '',
  riskLevel: 'conservative',
  maxSpend: '500',
  agentFee: '15',
  userSplit: '85',
}

const TEMPLATE_PRESETS: Record<StrategyTemplateKey, {
  title: string
  description: string
  nlText: string
  form: StrategyForm
}> = {
  'conservative-usdc': {
    title: '保守型 USDC 收益',
    description: '首次体验推荐：最多 500 USDC，只允许 Aave / Compound Supply。',
    nlText: '我想在 Base Sepolia 上用 500 USDC 做一个保守收益策略，只允许 Aave 和 Compound，期限 7 天，收益 85% 给我，15% 给 Agent。',
    form: { ...DEFAULT_FORM, riskLevel: 'conservative', maxSpend: '500', targetApy: '8' },
  },
  'balanced-supply': {
    title: '平衡型收益策略',
    description: '允许小额调整，但仍受预算、白名单协议和期限限制。',
    nlText: '我想在 Arbitrum Sepolia 上用 800 USDC 做一个平衡收益策略，允许小额兑换后存入 Aave 或 Compound，收益 88% 给我，12% 给 Agent。',
    form: { ...DEFAULT_FORM, network: 'arbitrum-sepolia', riskLevel: 'balanced', maxSpend: '800', agentFee: '12', userSplit: '88' },
  },
  custom: {
    title: '自定义策略',
    description: '用自然语言描述目标，系统先生成 Pact Preview。',
    nlText: '',
    form: { ...DEFAULT_FORM },
  },
}

const STRATEGY_TEMPLATES = Object.entries(TEMPLATE_PRESETS).map(([key, value]) => ({
  key: key as StrategyTemplateKey,
  title: value.title,
  description: value.description,
}))

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
  const form = reactive<StrategyForm>({ ...TEMPLATE_PRESETS[initialTemplate].form })
  const nlOpen = ref(initialTemplate !== 'custom')
  const nlText = ref(TEMPLATE_PRESETS[initialTemplate].nlText)
  const nlFilled = ref(false)
  const errors = reactive<Partial<Record<keyof StrategyForm, string>>>({})
  const pipeline = ref<PipelineStage>('preview-ready')
  const executionStep = ref(0)
  const previewTxHash = ref('')
  const pipelineError = ref('')
  const pactSubmissionMessage = ref('')
  const coboPactId = ref('')
  const createdPactId = ref('')
  const approvalId = ref('')
  const approvalRefreshing = ref(false)
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
    return `${prep.funding.availableUsdc.toLocaleString('zh-CN')} ${form.asset}`
  })

  const preparationNetworkLabel = computed(() => {
    const prep = store.preparation
    if (!prep?.ready) return null
    return NETWORK_LABELS[prep.network]
  })

  const networkMismatch = computed(() => {
    const prep = store.preparation
    return !!prep?.ready && form.network !== prep.network
  })

  const previewLines = computed(() => [
    { label: '意图', value: intentSummary.value },
    { label: '资金来源', value: fundingSourceLabel.value },
    { label: 'Agent Wallet 余额', value: availableBalanceLabel.value },
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

  const isFormValid = computed(() => validateForm(false))

  const stepIndex = computed(() => {
    const map: Record<PipelineStage, number> = {
      configure: 1,
      'preview-ready': 2,
      submitting: 3,
      'awaiting-approval': 3,
      executing: 4,
      success: 5,
      failed: 5,
    }
    return map[pipeline.value]
  })

  function validateForm(setErrors = true): boolean {
    const next: Partial<Record<keyof StrategyForm, string>> = {}
    const spend = parseNumericField(form.maxSpend)
    const fee = parseNumericField(form.agentFee)
    const user = parseNumericField(form.userSplit)

    if (store.preparation?.ready && form.network !== store.preparation.network) {
      next.maxSpend = '策略网络必须与 Agent Wallet 注资网络一致'
    }

    if (spend === null || spend < MIN_MAX_SPEND_USDC || spend > MAX_MAX_SPEND_USDC) {
      next.maxSpend = `请输入 ${MIN_MAX_SPEND_USDC}–${MAX_MAX_SPEND_USDC.toLocaleString('en-US')} USDC`
    } else if (store.preparation?.ready) {
      const available = store.preparation.funding.availableUsdc
      if (spend > available) {
        next.maxSpend = `不能超过 Agent Wallet 可用余额（${available} USDC）`
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

  watch(
    form,
    () => {
      validateForm(true)
      if (['configure', 'preview-ready'].includes(pipeline.value)) {
        pipeline.value = isFormValid.value ? 'preview-ready' : 'configure'
      }
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
      pipeline.value = isFormValid.value ? 'preview-ready' : 'configure'
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
    pipeline.value = isFormValid.value ? 'preview-ready' : 'configure'
  }

  function clearNlFill() {
    nlFilled.value = false
    Object.assign(form, { ...DEFAULT_FORM })
    validateForm(true)
    pipeline.value = 'configure'
  }

  let pollTimer: ReturnType<typeof setTimeout> | null = null
  let pollAborted = false

  function clearPollTimer() {
    if (pollTimer) {
      clearTimeout(pollTimer)
      pollTimer = null
    }
    pollAborted = true
  }

  const executionSteps = [
    'Strategy Agent 生成收益策略',
    '校验 Pact allowlist / max spend',
    'Executor Agent 执行 Aave Supply',
    'Revenue Agent 写入收益与分账日志',
  ] as const

  async function runFirstExecution(pactId: string) {
    pipeline.value = 'executing'
    executionStep.value = 0
    try {
      executionStep.value = 1
      const result = await store.executePact(pactId)
      executionStep.value = executionSteps.length - 1
      previewTxHash.value = result.txHash
      pipeline.value = 'success'
      await store.fetchLogs({ limit: 10 })
    } catch (e: unknown) {
      pipeline.value = 'failed'
      pipelineError.value = extractApiErrorMessage(e, 'Recipe 执行失败')
    }
  }

  function schedulePactPoll(pactId: string, attempt = 0) {
    const maxAttempts = 75
    pollAborted = false

    const poll = async () => {
      if (pollAborted) return
      if (attempt >= maxAttempts) {
        pipeline.value = 'failed'
        pipelineError.value = '等待 Cobo 审批超时，请在 Cobo App 完成审批后从 Pact 管理页同步状态。'
        return
      }

      try {
        const pact = await store.syncPact(pactId)
        if (pact.status === 'active') {
          await runFirstExecution(pactId)
          return
        }
        if (pact.status === 'terminated') {
          pipeline.value = 'failed'
          pipelineError.value = pact.submissionMessage || 'Pact 已被拒绝或终止。'
          return
        }
        pipeline.value = 'awaiting-approval'
        pollTimer = setTimeout(() => schedulePactPoll(pactId, attempt + 1), 4000)
      } catch {
        pollTimer = setTimeout(() => schedulePactPoll(pactId, attempt + 1), 4000)
      }
    }

    void poll()
  }

  async function submitPact() {
    if (!validateForm(true) || pipeline.value === 'submitting') return

    clearPollTimer()
    pollAborted = false
    pipeline.value = 'submitting'
    pipelineError.value = ''
    pactSubmissionMessage.value = ''
    coboPactId.value = ''
    createdPactId.value = ''
    approvalId.value = ''
    previewTxHash.value = ''

    if (!store.preparation?.ready) {
      pipeline.value = 'failed'
      pipelineError.value = '请先在控制台完成 Agent Wallet 设置，再创建 Pact 策略。'
      return
    }

    if (networkMismatch.value) {
      pipeline.value = 'failed'
      pipelineError.value = '策略网络必须与 Agent Wallet 注资网络一致。'
      return
    }

    try {
      const result = await store.createStrategy({
        network: form.network,
        asset: form.asset,
        targetApy: form.targetApy.trim() || undefined,
        riskLevel: form.riskLevel,
        maxSpend: form.maxSpend,
        agentFee: form.agentFee,
        userSplit: form.userSplit,
      })
      pactSubmissionMessage.value = result.pact.submissionMessage ?? ''
      coboPactId.value = result.pact.coboPactId ?? result.pact.id
      createdPactId.value = result.pact.id
      approvalId.value = result.pact.approvalId ?? ''

      if (result.pact.submissionMode === 'local-draft') {
        if (!store.settings?.developerMode) {
          pipeline.value = 'failed'
          pipelineError.value = result.pact.submissionMessage
            || '请完成 Cobo 配置，或在设置页开启开发者模式。'
          return
        }
        pipeline.value = 'awaiting-approval'
        pactSubmissionMessage.value = result.pact.submissionMessage
          || '已创建本地 Pact Draft。请在 Pact 管理页使用「开发者：本地模拟批准」。'
        return
      }

      if (result.pact.status === 'active') {
        await runFirstExecution(result.pact.id)
        return
      }

      pipeline.value = 'awaiting-approval'
      schedulePactPoll(result.pact.id)
    } catch (e: unknown) {
      pipeline.value = 'failed'
      pipelineError.value = extractApiErrorMessage(e, '创建策略失败，请重试。')
    }
  }

  async function refreshApprovalStatus() {
    const pactId = createdPactId.value || coboPactId.value
    if (!pactId || approvalRefreshing.value) return

    approvalRefreshing.value = true
    try {
      const pact = await store.syncPact(pactId)
      if (!pact) return
      pactSubmissionMessage.value = pact.submissionMessage ?? pactSubmissionMessage.value
      if (pact.status === 'active') {
        await runFirstExecution(pactId)
        return
      }
      if (pact.status === 'terminated') {
        pipeline.value = 'failed'
        pipelineError.value = pact.submissionMessage || 'Pact 已被拒绝或终止。'
        return
      }
      pipeline.value = 'awaiting-approval'
    } catch (e: unknown) {
      pipelineError.value = extractApiErrorMessage(e, '同步审批状态失败，请稍后重试。')
    } finally {
      approvalRefreshing.value = false
    }
  }

  async function simulateFailure() {
    const pactId = createdPactId.value || coboPactId.value
    if (!pactId) {
      pipeline.value = 'failed'
      pipelineError.value = '请先创建 Pact，再模拟越权请求。'
      return
    }

    try {
      const result = await store.simulatePactDenial(pactId)
      pipeline.value = 'failed'
      pipelineError.value = result.reason
      await store.fetchLogs({ limit: 10 })
    } catch (e: unknown) {
      pipeline.value = 'failed'
      pipelineError.value = extractApiErrorMessage(e, '越权模拟失败')
    }
  }

  function resetToEdit() {
    clearPollTimer()
    pipeline.value = isFormValid.value ? 'preview-ready' : 'configure'
    pipelineError.value = ''
    pactSubmissionMessage.value = ''
    coboPactId.value = ''
    createdPactId.value = ''
    approvalId.value = ''
    previewTxHash.value = ''
    executionStep.value = 0
  }

  onMounted(async () => {
    try {
      await Promise.all([store.fetchPreparation(), store.fetchSettings()])
      if (!store.preparation?.ready) {
        await store.fetchWallet()
      }
    } catch { /* page shows gate */ }
  })

  onUnmounted(clearPollTimer)

  const preparationReady = computed(() => store.preparation?.ready ?? false)

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
    preparationReady,
    availableBalanceLabel,
    preparationNetworkLabel,
    networkMismatch,
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
