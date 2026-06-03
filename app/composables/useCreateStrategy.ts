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

const NETWORK_LABELS: Record<NetworkId, string> = {
  'base-sepolia': 'Base Sepolia 测试网',
  'arbitrum-sepolia': 'Arbitrum Sepolia 测试网',
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
  const queryTemplate = Array.isArray(route.query.template)
    ? route.query.template[0]
    : route.query.template
  const initialTemplate =
    queryTemplate && queryTemplate in TEMPLATE_PRESETS
      ? (queryTemplate as StrategyTemplateKey)
      : 'conservative-usdc'

  const form = reactive<StrategyForm>({ ...TEMPLATE_PRESETS[initialTemplate].form })
  const nlOpen = ref(initialTemplate !== 'custom')
  const nlText = ref(TEMPLATE_PRESETS[initialTemplate].nlText)
  const nlFilled = ref(false)
  const errors = reactive<Partial<Record<keyof StrategyForm, string>>>({})
  const pipeline = ref<PipelineStage>('preview-ready')
  const executionStep = ref(0)
  const demoTxHash = ref('')
  const pipelineError = ref('')

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
      `使用最多 ${form.maxSpend || '—'} ${form.asset}`,
      `在 ${NETWORK_LABELS[form.network]} 执行`,
      '调用 Aave Supply / Compound Supply',
      `收益分账：用户 ${form.userSplit}% · Agent ${agentSplit.value}%`,
    ]
    if (form.riskLevel === 'aggressive') base.push('执行小额 Uniswap 兑换（演示）')
    return base
  })

  const deniedActions = computed(() => [
    `使用超过 ${form.maxSpend || '—'} ${form.asset} 的资金`,
    '调用非白名单协议或未知 token',
    '在 Pact 终止或过期后继续执行',
    '更改用户确认过的收益分账比例',
  ])

  const previewLines = computed(() => [
    { label: '意图', value: intentSummary.value },
    { label: '支出上限', value: `${form.maxSpend || '—'} ${form.asset}` },
    { label: '网络', value: NETWORK_LABELS[form.network] },
    {
      label: '允许 Recipe',
      value:
        form.riskLevel === 'aggressive'
          ? 'Aave 存入、Compound 存入、Uniswap 兑换'
          : 'Aave 存入、Compound 存入',
    },
    { label: '期限', value: '7 天（演示）' },
    {
      label: '收益分账',
      value: `用户 ${form.userSplit}% · Agent ${agentSplit.value}%`,
    },
    { label: 'Agent 绩效费', value: `${form.agentFee}%` },
  ])

  const isFormValid = computed(() => validateForm(false))

  const stepIndex = computed(() => {
    const map: Record<PipelineStage, number> = {
      configure: 0,
      'preview-ready': 1,
      submitting: 2,
      'awaiting-approval': 3,
      executing: 4,
      success: 5,
      failed: 5,
    }
    return map[pipeline.value]
  })

  function validateForm(setErrors = true): boolean {
    const next: Partial<Record<keyof StrategyForm, string>> = {}
    const spend = Number(form.maxSpend)
    const fee = Number(form.agentFee)
    const user = Number(form.userSplit)

    if (!form.maxSpend || Number.isNaN(spend) || spend < 10 || spend > 1_000_000) {
      next.maxSpend = '请输入 10–1,000,000 USDC'
    }
    if (!form.agentFee || Number.isNaN(fee) || fee < 0 || fee > 30) {
      next.agentFee = '请输入 0–30%'
    }
    if (!form.userSplit || Number.isNaN(user) || user < 0 || user > 100) {
      next.userSplit = '请输入 0–100%'
    }
    if (form.targetApy.trim()) {
      const apy = Number(form.targetApy)
      if (Number.isNaN(apy) || apy < 0 || apy > 100) {
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

  function parseNlIntoForm() {
    const text = nlText.value.toLowerCase()

    if (
      text.includes('aggressive')
      || text.includes('激进')
    ) {
      form.riskLevel = 'aggressive'
    } else if (text.includes('balanced') || text.includes('平衡')) {
      form.riskLevel = 'balanced'
    } else if (text.includes('conservative') || text.includes('保守')) {
      form.riskLevel = 'conservative'
    }

    const amount = text.match(/(\d+)\s*usdc/i) || text.match(/(\d+)\s*(?:枚|个)?\s*usdc?/i)
    if (amount) form.maxSpend = amount[1]

    const apy =
      text.match(/(\d+(?:\.\d+)?)\s*%?\s*apy/i)
      || text.match(/apy\s*(\d+)/i)
      || text.match(/目标\s*(\d+(?:\.\d+)?)\s*%/)
      || text.match(/(\d+(?:\.\d+)?)\s*%\s*收益/)
    if (apy) form.targetApy = apy[1]

    if (text.includes('arbitrum') || text.includes('仲裁')) form.network = 'arbitrum-sepolia'
    if (text.includes('base') || text.includes('基地')) form.network = 'base-sepolia'

    nlFilled.value = true
    validateForm(true)
    pipeline.value = isFormValid.value ? 'preview-ready' : 'configure'
  }

  function applyTemplate(key: StrategyTemplateKey) {
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

  let timers: ReturnType<typeof setTimeout>[] = []

  function clearTimers() {
    timers.forEach(clearTimeout)
    timers = []
  }

  const executionSteps = [
    'Strategy Agent 生成收益策略',
    '校验 Pact allowlist / max spend',
    'Executor Agent 执行 Aave Supply',
    'Revenue Agent 写入收益与分账日志',
  ] as const

  async function submitPact() {
    if (!validateForm(true) || pipeline.value === 'submitting') return

    clearTimers()
    pipeline.value = 'submitting'
    pipelineError.value = ''
    demoTxHash.value = ''

    const store = useDemoStore()
    try {
      await store.createStrategy({
        network: form.network,
        asset: form.asset,
        targetApy: form.targetApy.trim() || undefined,
        riskLevel: form.riskLevel,
        maxSpend: form.maxSpend,
        agentFee: form.agentFee,
        userSplit: form.userSplit,
      })
    } catch (e: unknown) {
      pipeline.value = 'failed'
      if (e && typeof e === 'object' && 'data' in e) {
        const data = (e as { data?: { error?: string } }).data
        pipelineError.value = data?.error ?? '创建策略失败，请重试。'
      } else {
        pipelineError.value = '创建策略失败，请重试。'
      }
      return
    }

    await new Promise((r) => setTimeout(r, 800))
    pipeline.value = 'awaiting-approval'

    timers.push(
      setTimeout(() => {
        pipeline.value = 'executing'
        executionStep.value = 0
        let i = 0
        const tick = () => {
          executionStep.value = i
          i += 1
          if (i < executionSteps.length) {
            timers.push(setTimeout(tick, 1200))
          } else {
            timers.push(
              setTimeout(() => {
                demoTxHash.value =
                  '0x8f3a91c2e4b1076d5a9c3f812e7b4c9a1d0e5f6a8b2c3d4e5f60718293a4b5c6'
                pipeline.value = 'success'
                navigateTo('/dashboard?created=1')
              }, 900),
            )
          }
        }
        timers.push(setTimeout(tick, 600))
      }, 2000),
    )
  }

  function simulateFailure() {
    clearTimers()
    pipeline.value = 'failed'
    pipelineError.value = 'Denied：Agent 尝试 Swap 500 USDC into unknown token。原因：Recipe not allowed by current Pact。'
    demoTxHash.value = ''
  }

  function resetToEdit() {
    clearTimers()
    pipeline.value = isFormValid.value ? 'preview-ready' : 'configure'
    pipelineError.value = ''
    demoTxHash.value = ''
    executionStep.value = 0
  }

  onUnmounted(clearTimers)

  return {
    form,
    nlOpen,
    nlText,
    nlFilled,
    errors,
    pipeline,
    executionStep,
    demoTxHash,
    pipelineError,
    agentSplit,
    intentSummary,
    previewLines,
    allowedActions,
    deniedActions,
    strategyTemplates: STRATEGY_TEMPLATES,
    isFormValid,
    stepIndex,
    executionSteps,
    validateForm,
    parseNlIntoForm,
    applyTemplate,
    clearNlFill,
    submitPact,
    simulateFailure,
    resetToEdit,
  }
}
