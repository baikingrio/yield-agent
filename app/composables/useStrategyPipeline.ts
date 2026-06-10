import type { Ref } from 'vue'
import { extractApiErrorMessage } from '~/utils/api-error'
import type { PipelineStage, StrategyForm } from './strategy-templates'
import { EXECUTION_STEPS } from './strategy-templates'

interface UseStrategyPipelineOptions {
  form: StrategyForm
  isFormValid: Ref<boolean>
  validateBeforeSubmit: () => boolean
}

export function useStrategyPipeline(options: UseStrategyPipelineOptions) {
  const store = useAppStore()
  const { form, validateBeforeSubmit, isFormValid } = options

  const pipeline = ref<PipelineStage>('preview-ready')
  const executionStep = ref(0)
  const previewTxHash = ref('')
  const pipelineError = ref('')
  const pactSubmissionMessage = ref('')
  const coboPactId = ref('')
  const createdPactId = ref('')
  const approvalId = ref('')
  const approvalRefreshing = ref(false)

  let pollTimer: ReturnType<typeof setTimeout> | null = null
  let pollAborted = false

  function clearPollTimer() {
    if (pollTimer) {
      clearTimeout(pollTimer)
      pollTimer = null
    }
    pollAborted = true
  }

  async function runFirstExecution(pactId: string) {
    pipeline.value = 'executing'
    executionStep.value = 0
    try {
      executionStep.value = 1
      const result = await store.executePact(pactId)
      executionStep.value = EXECUTION_STEPS.length - 1
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
    if (!validateBeforeSubmit() || pipeline.value === 'submitting') return

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

  function syncPipelineFromFormValidity() {
    if (['configure', 'preview-ready'].includes(pipeline.value)) {
      pipeline.value = isFormValid.value ? 'preview-ready' : 'configure'
    }
  }

  onUnmounted(clearPollTimer)

  return {
    pipeline,
    executionStep,
    previewTxHash,
    pipelineError,
    pactSubmissionMessage,
    coboPactId,
    approvalId,
    approvalRefreshing,
    executionSteps: EXECUTION_STEPS,
    submitPact,
    refreshApprovalStatus,
    simulateFailure,
    resetToEdit,
    syncPipelineFromFormValidity,
  }
}
