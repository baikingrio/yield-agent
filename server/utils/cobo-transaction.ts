import type { TransactionRecordsApi, TransactionsApi } from '@cobo/agentic-wallet'
import type { UserTransactionRead } from '@cobo/agentic-wallet'
import {
  formatTransactionFailureMessage,
  isTerminalTransactionFailure,
  isTerminalTransactionSuccess,
} from './yield-execution'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export class ExecutionStillPendingError extends Error {
  constructor(
    readonly requestId: string,
    readonly stepLabel: string,
  ) {
    super(`${stepLabel}确认中，请稍后刷新或重试`)
    this.name = 'ExecutionStillPendingError'
  }
}

/** Vercel serverless ~60s cap — keep in-request polling short; client resumes later. */
export function getTransactionPollMaxAttempts(): number {
  return process.env.VERCEL === '1' ? 10 : 45
}

export async function waitForTransactionResult(
  recordsApi: TransactionRecordsApi,
  walletId: string,
  requestId: string,
  stepLabel: string,
  maxAttempts = getTransactionPollMaxAttempts(),
): Promise<UserTransactionRead> {
  const delayMs = 2000

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const resp = await recordsApi.getUserTransactionByRequestId(walletId, requestId)
    const tx = resp.data.result
    if (!tx) throw new Error('未找到交易记录，请稍后重试')

    if (isTerminalTransactionSuccess(tx.status, tx.status_display)) return tx
    if (isTerminalTransactionFailure(tx.status, tx.status_display)) {
      throw new Error(formatTransactionFailureMessage(
        stepLabel,
        tx.status_display,
        tx.status,
        tx.data?.failed_reason,
      ))
    }

    if (attempt < maxAttempts - 1) await sleep(delayMs)
  }

  throw new ExecutionStillPendingError(requestId, stepLabel)
}

async function finalizeSubmission(
  recordsApi: TransactionRecordsApi,
  walletId: string,
  submit: {
    pending_operation_id?: string
    approval_id?: string
    status: number
    status_display?: string
    transaction_hash?: string
  },
  requestId: string,
  stepLabel: string,
  pendingApprovalMessage: string,
): Promise<UserTransactionRead> {
  if (submit.pending_operation_id || submit.approval_id) {
    throw new Error(pendingApprovalMessage)
  }

  if (isTerminalTransactionFailure(submit.status, submit.status_display)) {
    throw new Error(formatTransactionFailureMessage(
      stepLabel,
      submit.status_display,
      submit.status,
    ))
  }

  if (isTerminalTransactionSuccess(submit.status, submit.status_display) && submit.transaction_hash) {
    const byRequest = await recordsApi.getUserTransactionByRequestId(walletId, requestId)
    return byRequest.data.result
  }

  return waitForTransactionResult(recordsApi, walletId, requestId, stepLabel)
}

export async function submitTransferAndWait(
  transactionsApi: TransactionsApi,
  recordsApi: TransactionRecordsApi,
  walletId: string,
  params: {
    chainId: string
    srcAddr: string
    dstAddr: string
    tokenId: string
    amount: string
    requestId: string
    sponsor: boolean
    description: string
    stepLabel: string
  },
): Promise<UserTransactionRead> {
  const resp = await transactionsApi.transferTokens(walletId, {
    chain_id: params.chainId,
    src_addr: params.srcAddr,
    dst_addr: params.dstAddr,
    token_id: params.tokenId,
    amount: params.amount,
    request_id: params.requestId,
    sponsor: params.sponsor,
    description: params.description,
  })

  return finalizeSubmission(
    recordsApi,
    walletId,
    resp.data.result,
    params.requestId,
    params.stepLabel,
    '转账待额外审批，请在 Cobo App 完成审批后重试',
  )
}

export async function submitContractCallAndWait(
  transactionsApi: TransactionsApi,
  recordsApi: TransactionRecordsApi,
  walletId: string,
  walletAddress: string,
  sponsor: boolean,
  params: {
    chainId: string
    contractAddr: `0x${string}`
    calldata: `0x${string}`
    requestId: string
    description: string
    stepLabel: string
  },
): Promise<UserTransactionRead> {
  const resp = await transactionsApi.contractCall(walletId, {
    chain_id: params.chainId,
    contract_addr: params.contractAddr,
    calldata: params.calldata,
    src_addr: walletAddress,
    request_id: params.requestId,
    sponsor,
    description: params.description,
  })

  return finalizeSubmission(
    recordsApi,
    walletId,
    resp.data.result,
    params.requestId,
    params.stepLabel,
    '合约调用待额外审批，请在 Cobo App 完成审批后重试',
  )
}
