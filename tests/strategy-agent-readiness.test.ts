import { describe, expect, it } from 'vitest'
import { buildStrategyAgentReadiness } from '../server/utils/strategy-agent-readiness'

describe('buildStrategyAgentReadiness', () => {
  it('defaults the strategy layer to same-host Hermes CLI for development instead of Z.AI', () => {
    const readiness = buildStrategyAgentReadiness({
      env: {},
      commandExists: (cmd) => cmd === 'hermes',
    })

    expect(readiness.provider).toBe('hermes')
    expect(readiness.mode).toBe('cli')
    expect(readiness.localExecution).toBe(true)
    expect(readiness.runtimeHost).toBe('hermes-agent-host')
    expect(readiness.remoteCallable).toBe(false)
    expect(readiness.deploymentReady).toBe(false)
    expect(readiness.command).toBe('hermes')
    expect(readiness.configured).toBe(true)
    expect(readiness.missing).toEqual([])
    expect(readiness.nextAction).toContain('Vercel')
  })

  it('reports missing Hermes CLI when local command is unavailable', () => {
    const readiness = buildStrategyAgentReadiness({
      env: { HERMES_STRATEGY_MODE: 'cli', HERMES_CLI_BIN: 'hermes-missing' },
      commandExists: () => false,
    })

    expect(readiness.configured).toBe(false)
    expect(readiness.missing).toContain('Hermes CLI')
    expect(readiness.nextAction).toContain('安装或配置 HERMES_CLI_BIN')
  })

  it('supports an explicit remote-callable Hermes API endpoint', () => {
    const readiness = buildStrategyAgentReadiness({
      env: {
        HERMES_STRATEGY_MODE: 'api',
        HERMES_API_URL: 'https://hermes-runtime.example.com',
        HERMES_API_KEY: 'secret',
      },
      commandExists: () => false,
    })

    expect(readiness.mode).toBe('api')
    expect(readiness.endpoint).toBe('https://hermes-runtime.example.com')
    expect(readiness.configured).toBe(true)
    expect(readiness.remoteCallable).toBe(true)
    expect(readiness.deploymentReady).toBe(true)
    expect(readiness.missing).toEqual([])
  })
})
