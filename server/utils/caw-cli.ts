import { execFile } from 'node:child_process'
import { access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export type CawCliRunner = (
  args: string[],
) => Promise<{ stdout: string; stderr?: string }>

export function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

export function bool(value: unknown): boolean {
  return value === true
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

export async function resolveCawCliBin(): Promise<string | null> {
  const configured = process.env.CAW_CLI_BIN?.trim()
  if (configured) {
    try {
      await access(configured, constants.X_OK)
      return configured
    } catch {
      return null
    }
  }
  try {
    const { stdout } = await execFileAsync('which', ['caw'])
    return stdout.trim() || null
  } catch {
    return null
  }
}

export async function defaultCawRunner(args: string[]): Promise<{ stdout: string; stderr?: string }> {
  const cawBin = await resolveCawCliBin()
  if (!cawBin) throw new Error('CAW_CLI_NOT_FOUND')
  const { stdout, stderr } = await execFileAsync(cawBin, args, {
    timeout: 120_000,
    maxBuffer: 1024 * 1024,
    env: {
      ...process.env,
      PATH: `/usr/local/bin:${process.env.PATH ?? ''}`,
    },
  })
  return { stdout, stderr }
}

export async function runCawJson(
  args: string[],
  runner: CawCliRunner = defaultCawRunner,
): Promise<Record<string, unknown> | unknown[]> {
  const { stdout } = await runner(args)
  const parsed = JSON.parse(stdout || '{}')
  if (Array.isArray(parsed)) return parsed
  return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {}
}

export async function runCawJsonBestEffort(
  args: string[],
  runner: CawCliRunner = defaultCawRunner,
): Promise<Record<string, unknown> | unknown[]> {
  try {
    return await runCawJson(args, runner)
  } catch (err) {
    const stdout = err && typeof err === 'object' && 'stdout' in err
      ? (err as { stdout?: unknown }).stdout
      : null
    if (typeof stdout === 'string' && stdout.trim()) {
      const parsed = JSON.parse(stdout)
      if (Array.isArray(parsed)) return parsed
      return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {}
    }
    throw err
  }
}
