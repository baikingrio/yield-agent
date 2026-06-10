import { Configuration, TransactionRecordsApi, TransactionsApi } from '@cobo/agentic-wallet'
import { arbitrumSepolia, baseSepolia } from 'viem/chains'
import type {
  AppState,
  NetworkId,
  Pact,
  PactDenialResult,
  PactExecutionResult,
  PactRedeemResult,
} from '../../shared/types/app'
import { assertAgentWalletHasGas, getAgentNativeEthBalance, resolveContractCallSponsor } from './agent-gas'
import { getCoboBasePath, getNetworkChainConfig } from './cobo-config'
import { extractCoboErrorMessage } from './cobo-client'
import { submitContractCallAndWait } from './cobo-transaction'
import { syncWalletSummaryFromCobo } from './cobo-preparation'
import { syncYieldSnapshotFromChain } from './yield-snapshot'
import { resolveRedeemApiKey } from './pact-credentials'
import { resolvePactExecutionApiKey } from './pact-credentials'
import { readYieldSuppliedAmount } from './yield-position'
import {
  buildExecutionRequestId,
  buildRedeemRequestId,
  encodeYieldSupplyCalldata,
  encodeYieldWithdrawCalldata,
  isStaleFirstExecution,
  nextFirstExecutionAttempt,
  nextRedeemAttempt,
  resolveFirstSupplyAmountUsdc,
  resolveFirstYieldSupplyRoute,
  toUsdcBaseUnits,
} from './yield-execution'
import { createPublicClient, encodeFunctionData, erc20Abi, http } from 'viem'

function chainForNetwork(network: NetworkId) {
  return network === 'base-sepolia' ? baseSepolia : arbitrumSepolia
}

function createPactScopedTransactionsApi(apiKey: string): TransactionsApi {
  return new TransactionsApi(new Configuration({
    apiKey,
    basePath: getCoboBasePath(),
    baseOptions: { timeout: 60_000 },
  }))
}

function createPactScopedTransactionRecordsApi(apiKey: string): TransactionRecordsApi {
  return new TransactionRecordsApi(new Configuration({
    apiKey,
    basePath: getCoboBasePath(),
    baseOptions: { timeout: 60_000 },
  }))
}

function findPact(state: AppState, pactId: string): Pact | undefined {
  return state.pacts.find((item) => item.id === pactId || item.coboPactId === pactId)
}

async function readUsdcAllowance(
  network: NetworkId,
  owner: `0x${string}`,
  spender: `0x${string}`,
  usdcContract: `0x${string}`,
): Promise<bigint> {
  const client = createPublicClient({
    chain: chainForNetwork(network),
    transport: http(),
  })
  return client.readContract({
    address: usdcContract,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [owner, spender],
  })
}

function appendExecutionLog(
  state: AppState,
  pactId: string,
  action: string,
  txHash: string,
  status: string,
) {
  state.logs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action,
    type: 'supply',
    txHash,
    status,
    pactId,
  })
}

export async function executeFirstPactRecipe(
  state: AppState,
  pactId: string,
): Promise<PactExecutionResult> {
  const pact = findPact(state, pactId)
  if (!pact) throw new Error('Pact not found')
  if (pact.status !== 'active') {
    throw new Error(pact.status === 'completed'
      ? 'Pact 已在 Cobo 侧完成（可能因失败重试触发了交易次数上限）。请同步状态后重新创建策略与 Pact。'
      : 'Pact 尚未激活，无法执行 Recipe')
  }

  if (pact.firstExecutionCompleted && pact.firstExecutionTxHash?.trim()) {
    return {
      txHash: pact.firstExecutionTxHash,
      status: '已完成',
      coboTransactionId: undefined,
      action: '首次 Recipe 已执行',
    }
  }

  if (isStaleFirstExecution(pact)) {
    pact.firstExecutionCompleted = false
    pact.firstExecutionAt = undefined
  }

  const apiKey = resolvePactExecutionApiKey(state, pact.id)
  if (!apiKey) throw new Error('未找到 pact-scoped 执行凭证，请同步 Pact 状态后重试')

  const walletId = state.walletPreparation.agentWallet.coboWalletId
  const walletAddress = state.walletPreparation.agentWallet.address
  if (!walletId || !walletAddress) throw new Error('Agent Wallet 未就绪')

  const strategy = state.strategies.find((item) => item.id === pact.strategyId)
  const network = (strategy?.network ?? state.walletPreparation.network) as NetworkId
  const chainConfig = getNetworkChainConfig(network)

  await assertAgentWalletHasGas(network, walletAddress)
  const nativeEth = await getAgentNativeEthBalance(network, walletAddress as `0x${string}`)
  const sponsor = resolveContractCallSponsor(nativeEth)

  const supplyUsdc = resolveFirstSupplyAmountUsdc(
    state.walletPreparation.funding.availableUsdc,
    pact.maxSpend,
  )
  if (supplyUsdc <= 0) {
    throw new Error('Agent Wallet 无可用 USDC，请先完成充值后再执行存入')
  }

  const attempt = nextFirstExecutionAttempt(pact)
  pact.firstExecutionAttempt = attempt

  const amount = toUsdcBaseUnits(supplyUsdc, chainConfig.usdcDecimals)
  const supplyRoute = resolveFirstYieldSupplyRoute(chainConfig)
  const transactionsApi = createPactScopedTransactionsApi(apiKey)
  const recordsApi = createPactScopedTransactionRecordsApi(apiKey)

  const approveRequestId = buildExecutionRequestId(pact.id, 'approve', attempt)
  const supplyRequestId = buildExecutionRequestId(pact.id, 'supply', attempt)
  const networkLabel = network === 'arbitrum-sepolia' ? 'Arbitrum Sepolia' : 'Base Sepolia'
  const action = `${supplyRoute.protocolLabel} 存入 ${supplyUsdc} USDC（${networkLabel} 测试网）`

  try {
    const allowance = await readUsdcAllowance(
      network,
      walletAddress as `0x${string}`,
      supplyRoute.approveSpender,
      chainConfig.usdcContract,
    )

    if (allowance < amount) {
      const approveCalldata = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [supplyRoute.approveSpender, amount],
      })

      await submitContractCallAndWait(transactionsApi, recordsApi, walletId, walletAddress, sponsor, {
        chainId: chainConfig.coboChainId,
        contractAddr: chainConfig.usdcContract,
        calldata: approveCalldata,
        requestId: approveRequestId,
        description: `YieldAgent approve USDC for ${supplyRoute.protocolLabel} (${supplyUsdc} USDC)`,
        stepLabel: `USDC 授权 ${supplyRoute.protocolLabel}`,
      })
    }

    const supplyCalldata = encodeYieldSupplyCalldata(
      supplyRoute,
      amount,
      walletAddress as `0x${string}`,
    )

    const supplyTx = await submitContractCallAndWait(transactionsApi, recordsApi, walletId, walletAddress, sponsor, {
      chainId: chainConfig.coboChainId,
      contractAddr: supplyRoute.contractAddr,
      calldata: supplyCalldata,
      requestId: supplyRequestId,
      description: `YieldAgent ${supplyRoute.protocolLabel} supply (${supplyUsdc} USDC)`,
      stepLabel: `${supplyRoute.protocolLabel} 存入`,
    })

    const txHash = supplyTx.transaction_hash || ''
    const status = supplyTx.status_display || 'Success'

    pact.firstExecutionCompleted = true
    pact.firstExecutionAt = new Date().toISOString()
    pact.firstExecutionTxHash = txHash

    appendExecutionLog(state, pact.id, action, txHash, status)
    await syncYieldSnapshotFromChain(state).catch(() => {})

    return {
      txHash,
      status,
      coboTransactionId: supplyTx.id,
      action,
    }
  } catch (err) {
    pact.firstExecutionCompleted = false
    pact.firstExecutionTxHash = ''
    appendExecutionLog(
      state,
      pact.id,
      action,
      '',
      err instanceof Error ? err.message : '执行失败',
    )
    throw new Error(extractCoboErrorMessage(err))
  }
}

export async function redeemPactFunds(
  state: AppState,
  pactId: string,
): Promise<PactRedeemResult> {
  const pact = findPact(state, pactId)
  if (!pact) throw new Error('Pact not found')

  if (!pact.firstExecutionCompleted || !pact.firstExecutionTxHash?.trim()) {
    throw new Error('此 Pact 尚未完成首次存入，无需赎回')
  }
  if (pact.redeemCompleted && pact.redeemTxHash?.trim()) {
    return {
      txHash: pact.redeemTxHash,
      status: '已完成',
      amountUsdc: 0,
      action: '资金已赎回',
    }
  }

  const apiKey = await resolveRedeemApiKey(state, pact)
  if (!apiKey) {
    throw new Error(
      pact.status === 'active'
        ? '未找到 pact-scoped 执行凭证，请同步 Pact 状态后重试'
        : 'Pact 已撤销且缺少 Agent 主 API Key，无法代为赎回。请在设置页配置 Cobo API Key 后重试。',
    )
  }

  const walletId = state.walletPreparation.agentWallet.coboWalletId
  const walletAddress = state.walletPreparation.agentWallet.address
  if (!walletId || !walletAddress) throw new Error('Agent Wallet 未就绪')

  const strategy = state.strategies.find((item) => item.id === pact.strategyId)
  const network = (strategy?.network ?? state.walletPreparation.network) as NetworkId
  const chainConfig = getNetworkChainConfig(network)
  const supplyRoute = resolveFirstYieldSupplyRoute(chainConfig)

  await assertAgentWalletHasGas(network, walletAddress)
  const nativeEth = await getAgentNativeEthBalance(network, walletAddress as `0x${string}`)
  const sponsor = resolveContractCallSponsor(nativeEth)

  const suppliedRaw = await readYieldSuppliedAmount(
    network,
    chainConfig,
    walletAddress as `0x${string}`,
  )
  if (suppliedRaw <= 0n) {
    pact.redeemCompleted = true
    return {
      txHash: pact.redeemTxHash || '',
      status: '无仓位',
      amountUsdc: 0,
      action: '链上无待赎回仓位（可能已赎回）',
    }
  }

  const amountUsdc = Number(suppliedRaw) / 10 ** chainConfig.usdcDecimals
  const attempt = nextRedeemAttempt(pact)
  pact.redeemAttempt = attempt

  const transactionsApi = createPactScopedTransactionsApi(apiKey)
  const recordsApi = createPactScopedTransactionRecordsApi(apiKey)
  const requestId = buildRedeemRequestId(pact.id, attempt)
  const networkLabel = network === 'arbitrum-sepolia' ? 'Arbitrum Sepolia' : 'Base Sepolia'
  const action = `${supplyRoute.protocolLabel} 赎回 ${amountUsdc} USDC 至 Agent Wallet（${networkLabel}）`

  const withdrawCalldata = encodeYieldWithdrawCalldata(
    supplyRoute,
    suppliedRaw,
    walletAddress as `0x${string}`,
  )

  try {
    const redeemTx = await submitContractCallAndWait(
      transactionsApi,
      recordsApi,
      walletId,
      walletAddress,
      sponsor,
      {
        chainId: chainConfig.coboChainId,
        contractAddr: supplyRoute.contractAddr,
        calldata: withdrawCalldata,
        requestId,
        description: `YieldAgent ${supplyRoute.protocolLabel} withdraw (${amountUsdc} USDC)`,
        stepLabel: `${supplyRoute.protocolLabel} 赎回`,
      },
    )

    const txHash = redeemTx.transaction_hash || ''
    pact.redeemCompleted = true
    pact.redeemTxHash = txHash

    appendExecutionLog(state, pact.id, action, txHash, redeemTx.status_display || 'Success')
    await syncWalletSummaryFromCobo(state)
    await syncYieldSnapshotFromChain(state).catch(() => {})

    return {
      txHash,
      status: redeemTx.status_display || 'Success',
      amountUsdc,
      action,
    }
  } catch (err) {
    appendExecutionLog(
      state,
      pact.id,
      action,
      '',
      err instanceof Error ? err.message : '赎回失败',
    )
    throw new Error(extractCoboErrorMessage(err))
  }
}

export async function simulatePactDenial(
  state: AppState,
  pactId: string,
): Promise<PactDenialResult> {
  const pact = findPact(state, pactId)
  if (!pact) throw new Error('Pact not found')

  const apiKey = resolvePactExecutionApiKey(state, pact.id)
    || state.settings.coboApiKey
    || process.env.AGENT_WALLET_API_KEY

  if (!apiKey?.trim()) throw new Error('缺少执行凭证，无法模拟越权请求')

  const walletId = state.walletPreparation.agentWallet.coboWalletId
  if (!walletId) throw new Error('Agent Wallet 未就绪')

  const strategy = state.strategies.find((item) => item.id === pact.strategyId)
  const network = (strategy?.network ?? state.walletPreparation.network) as NetworkId
  const chainConfig = getNetworkChainConfig(network)
  const transactionsApi = createPactScopedTransactionsApi(apiKey.trim())

  const walletAddress = state.walletPreparation.agentWallet.address
  if (!walletAddress) throw new Error('Agent Wallet 未就绪')

  const deniedContract = '0x000000000000000000000000000000000000dEaD'
  const action = `Agent 尝试调用非白名单合约 ${deniedContract.slice(0, 10)}…（模拟越权）`

  try {
    await transactionsApi.contractCall(walletId, {
      chain_id: chainConfig.coboChainId,
      contract_addr: deniedContract,
      calldata: '0x',
      src_addr: walletAddress,
      sponsor: true,
      request_id: `yieldagent-denial-${pact.id}-${Date.now()}`,
    })

    const reason = '请求意外被接受：请检查 Pact policy 配置'
    state.logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      type: 'pact',
      txHash: '',
      status: 'Denied',
      pactId: pact.id,
    })

    return { action, reason, status: 'Denied' }
  } catch (err) {
    const reason = extractCoboErrorMessage(err)
    state.logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      type: 'pact',
      txHash: '',
      status: 'Denied',
      pactId: pact.id,
    })

    return {
      action,
      reason: reason.includes('deny') || reason.includes('拒绝') || reason.includes('not allowed')
        ? reason
        : `Denied：${reason}`,
      status: 'Denied',
    }
  }
}
