import { existsSync } from 'node:fs'
import { delimiter, isAbsolute, join } from 'node:path'
import type { StrategyAgentMode, StrategyAgentReadiness } from '../../shared/types/demo'
import { buildHermesStrategyReadinessEnv } from './hermes-strategy-client'

interface StrategyAgentEnv {
  HERMES_STRATEGY_MODE?: string
  HERMES_CLI_BIN?: string
  HERMES_API_URL?: string
  HERMES_API_KEY?: string
  API_SERVER_KEY?: string
  HERMES_PROFILE?: string
  HERMES_STRATEGY_MODEL?: string
  PATH?: string
}

interface BuildStrategyAgentReadinessOptions {
  env?: StrategyAgentEnv
  commandExists?: (command: string) => boolean
}

function normalizeMode(value?: string): StrategyAgentMode {
  return value?.trim().toLowerCase() === 'api' ? 'api' : 'cli'
}

function commandExistsOnPath(command: string, env: StrategyAgentEnv): boolean {
  if (!command) return false
  if (isAbsolute(command) || command.includes('/')) return existsSync(command)

  const pathValue = env.PATH ?? process.env.PATH ?? ''
  return pathValue.split(delimiter).some((dir) => existsSync(join(dir, command)))
}

export function buildStrategyAgentReadiness(
  options: BuildStrategyAgentReadinessOptions = {},
): StrategyAgentReadiness {
  const env = options.env ?? process.env
  const mode = normalizeMode(env.HERMES_STRATEGY_MODE)
  const command = (env.HERMES_CLI_BIN?.trim() || 'hermes')
  const endpoint = env.HERMES_API_URL?.trim() || null
  const profile = env.HERMES_PROFILE?.trim() || 'default'
  const model = env.HERMES_STRATEGY_MODEL?.trim() || null
  const exists = options.commandExists ?? ((cmd: string) => commandExistsOnPath(cmd, env))
  const missing: string[] = []

  if (mode === 'api') {
    missing.push(...buildHermesStrategyReadinessEnv(env).missing)
  } else if (!exists(command)) {
    missing.push('Hermes CLI')
  }

  const configured = missing.length === 0
  const remoteCallable = mode === 'api' && configured
  const deploymentReady = remoteCallable
  const nextAction = configured
    ? deploymentReady
      ? '策略层会通过远程 Hermes API 调用当前 Hermes Agent 主机；Vercel 部署可使用该 endpoint。'
      : '本地 CLI 模式只适合在 Hermes Agent 主机上开发；Vercel 部署需切换 HERMES_STRATEGY_MODE=api，并把 HERMES_API_URL 配成可远程访问的 Hermes API/tunnel。'
    : mode === 'api'
      ? '配置 HERMES_API_URL 指向当前 Hermes Agent 主机上可远程访问的 Hermes API Server。'
      : '安装或配置 HERMES_CLI_BIN 仅能满足本机开发；若前端部署到 Vercel，需要改用 Hermes API 模式。'

  return {
    provider: 'hermes',
    mode,
    localExecution: true,
    runtimeHost: 'hermes-agent-host',
    remoteCallable,
    deploymentReady,
    configured,
    command: mode === 'cli' ? command : null,
    endpoint: mode === 'api' ? endpoint : null,
    profile,
    model,
    missing,
    nextAction,
  }
}
