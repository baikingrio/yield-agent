import { describe, expect, it } from 'vitest'
import { mapBootstrapUserCopy } from '../shared/utils/bootstrap-user-copy'

describe('mapBootstrapUserCopy', () => {
  it('maps missing api key tss_check to actionable copy', () => {
    const copy = mapBootstrapUserCopy({
      phase: 'tss_check',
      tssOnline: false,
      message: 'Cobo API Key 未配置。请在 Vercel 设置 AGENT_WALLET_API_KEY',
    })
    expect(copy.title).toBe('缺少 Cobo 凭证')
    expect(copy.ctaHref).toBe('/dashboard/settings')
    expect(copy.showOpsChecklist).toBe(true)
  })

  it('maps wallet mismatch to reset guidance', () => {
    const copy = mapBootstrapUserCopy({
      phase: 'tss_check',
      tssOnline: false,
      message: 'API Key 与钱包不匹配',
    })
    expect(copy.title).toBe('凭证与钱包不匹配')
  })

  it('shows ops checklist on poll timeout during bootstrapping', () => {
    const copy = mapBootstrapUserCopy({
      phase: 'bootstrapping',
      tssOnline: true,
      message: 'SDK 钱包仍在 preparing',
      pollAttempt: 24,
      maxPollAttempts: 24,
    })
    expect(copy.showOpsChecklist).toBe(true)
    expect(copy.title).toContain('耗时较长')
  })
})
