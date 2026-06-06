import { describe, expect, it } from 'vitest'
import {
  buildHermesStrategyHeaders,
  buildHermesStrategyReadinessEnv,
  callHermesStrategyAgent,
} from '../server/utils/hermes-strategy-client'

describe('hermes strategy client', () => {
  it('requires a remote URL and bearer key for deployment readiness', () => {
    expect(buildHermesStrategyReadinessEnv({})).toEqual({
      remoteCallable: false,
      deploymentReady: false,
      missing: ['Hermes API URL', 'Hermes API Key'],
    })

    expect(buildHermesStrategyReadinessEnv({
      HERMES_API_URL: 'https://hermes.example.com',
      HERMES_API_KEY: 'secret',
    })).toEqual({ remoteCallable: true, deploymentReady: true, missing: [] })
  })

  it('builds bearer headers without exposing the key in responses', () => {
    expect(buildHermesStrategyHeaders('secret')).toMatchObject({
      'Content-Type': 'application/json',
      Authorization: 'Bearer secret',
    })
  })

  it('calls the OpenAI-compatible Hermes chat completions endpoint', async () => {
    const calls: Array<{ url: string; init: { headers: Record<string, string>; body: string } }> = []
    const result = await callHermesStrategyAgent({
      endpoint: 'https://hermes.example.com',
      apiKey: 'secret',
      model: 'hermes-agent',
      messages: [{ role: 'user', content: 'ping' }],
      fetcher: async (url, init) => {
        calls.push({ url, init })
        return {
          ok: true,
          status: 200,
          json: async () => ({ choices: [{ message: { content: '{"status":"ok"}' } }] }),
        }
      },
    })

    expect(calls[0]!.url).toBe('https://hermes.example.com/v1/chat/completions')
    expect(calls[0]!.init.headers.Authorization).toBe('Bearer secret')
    expect(JSON.parse(calls[0]!.init.body)).toMatchObject({ model: 'hermes-agent', stream: false })
    expect(result.content).toBe('{"status":"ok"}')
  })
})
