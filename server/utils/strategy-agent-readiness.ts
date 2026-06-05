import { existsSync } from 'node:fs'
import { delimiter, isAbsolute, join } from 'node:path'
import type { StrategyAgentMode, StrategyAgentReadiness } from '../../shared/types/demo'

interface StrategyAgentEnv {
  HERMES_STRATEGY_MODE?: string
  HERMES_CLI_BIN?: string
  HERMES_API_URL?: string
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
    if (!endpoint) missing.push('Hermes API URL')
  } else if (!exists(command)) {
    missing.push('Hermes CLI')
  }

  const configured = missing.length === 0
  const nextAction = configured
    ? '策略层已改为调用本机 Hermes；下一步接入自然语言解析并在 Pact validator 后提交。'
    : mode === 'api'
      ? '配置 HERMES_API_URL 指向本机 Hermes API Server。'
      : '安装或配置 HERMES_CLI_BIN，让 Nuxt server 能在本机调用 Hermes CLI。'

  return {
    provider: 'hermes',
    mode,
    localExecution: true,
    configured,
    command: mode === 'cli' ? command : null,
    endpoint: mode === 'api' ? endpoint : null,
    profile,
    model,
    missing,
    nextAction,
  }
}
