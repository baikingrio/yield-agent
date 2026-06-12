import { describe, expect, it, vi } from 'vitest'
import { buildSdkPreparingMessage } from '../server/utils/caw-tss-readiness'

describe('buildSdkPreparingMessage', () => {
  it('surfaces pact-scoped api key instead of generic vault wait copy', () => {
    vi.stubEnv('AGENT_WALLET_MAIN_NODE_ID', 'cobo2Bj9QaBSQSgKxzDtZPH18etia7apeYyY2da3VRmM9oZpZt')

    const message = buildSdkPreparingMessage(
      'preparing',
      {
        online: true,
        nodeId: 'cobo2Bj9QaBSQSgKxzDtZPH18etia7apeYyY2da3VRmM9oZpZt',
        message: '远程 TSS Node 已配置；当前 API Key 暂不能查询节点状态，继续等待钱包 vault 初始化',
      },
      'API key pact authorization is not authorized for this wallet',
    )

    expect(message).toContain('Pact 子 Key')
    expect(message).not.toContain('等待 vault 初始化')
    vi.unstubAllEnvs()
  })
})
