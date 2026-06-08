import type { Pact } from '../../shared/types/app'

export function isCoboSubmittedPact(pact: Pact): boolean {
  if (pact.submissionMode === 'local-draft') return false
  if (pact.submissionMode === 'cobo') return true
  return Boolean(pact.coboPactId)
}

export function pactExecutionBlockedReason(pact: Pact): string | null {
  if (pact.submissionMode === 'local-draft') {
    return '本地 draft 模式未接 Cobo，无法执行 Recipe。'
  }
  if (!isCoboSubmittedPact(pact)) {
    return '此 Pact 未通过 Cobo 提交，无法执行 Recipe。'
  }
  if (pact.status !== 'active') {
    return 'Pact 尚未激活，无法执行 Recipe。'
  }
  return null
}
