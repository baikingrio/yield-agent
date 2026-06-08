import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { CawOnboardPrompt, CawOnboardStatus } from '../../shared/types/app'

const execFileAsync = promisify(execFile)

export type CawOnboardPhase = 'unknown' | 'active' | 'needs_input' | 'running' | 'error'

interface CawCliOptions {
  runner?: (args: string[]) => Promise<{ stdout: string; stderr?: string }>
}

interface CawOnboardStepResult extends CawOnboardStatus {
  rawPhase: string | null
}

async function defaultRunner(args: string[]): Promise<{ stdout: string; stderr?: string }> {
  const { stdout, stderr } = await execFileAsync('caw', args, {
    timeout: 120_000,
    maxBuffer: 1024 * 1024,
    env: {
      ...process.env,
      PATH: `/usr/local/bin:${process.env.PATH ?? ''}`,
    },
  })
  return { stdout, stderr }
}

function parseJson(stdout: string): Record<string, unknown> {
  const parsed = JSON.parse(stdout || '{}')
  return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {}
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function bool(value: unknown): boolean {
  return value === true
}

function prompts(value: unknown): CawOnboardPrompt[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const obj = item as Record<string, unknown>
    const id = str(obj.id)
    if (!id) return []
    return [{
      id,
      label: str(obj.label) ?? undefined,
      type: str(obj.type) ?? undefined,
      required: obj.required === true,
      secret: obj.secret === true || id.toLowerCase().includes('key'),
      description: str(obj.description) ?? undefined,
    }]
  })
}

function phaseFrom(payload: Record<string, unknown>, walletStatus: string | null): CawOnboardPhase {
  if (walletStatus === 'active' || payload.phase === 'wallet_active') return 'active'
  if (payload.phase === 'error') return 'error'
  if (payload.needs_input === true || prompts(payload.prompts).length > 0) return 'needs_input'
  if (payload.phase) return 'running'
  return 'unknown'
}

function statusFrom(statusPayload: Record<string, unknown>, walletPayload?: Record<string, unknown>, onboardPayload?: Record<string, unknown>): CawOnboardStatus {
  const walletStatus = str(statusPayload.wallet_status) ?? str(walletPayload?.status)
  const phase = phaseFrom(onboardPayload ?? {}, walletStatus)
  return {
    healthy: bool(statusPayload.healthy),
    walletStatus,
    walletPaired: bool(statusPayload.wallet_paired),
    agentId: str(walletPayload?.agent_id),
    agentName: str(walletPayload?.agent_name),
    walletUuid: str(walletPayload?.wallet_uuid),
    walletName: str(walletPayload?.wallet_name),
    apiUrl: str(walletPayload?.api_url),
    phase,
    sessionId: str(onboardPayload?.session_id),
    needsInput: bool(onboardPayload?.needs_input) || phase === 'needs_input',
    prompts: prompts(onboardPayload?.prompts),
    nextAction: str(onboardPayload?.next_action),
    lastError: str(onboardPayload?.last_error),
  }
}

async function runJson(args: string[], options: CawCliOptions): Promise<Record<string, unknown>> {
  const runner = options.runner ?? defaultRunner
  try {
    const { stdout } = await runner(args)
    return parseJson(stdout)
  } catch (err) {
    if (err && typeof err === 'object' && 'stdout' in err && typeof (err as { stdout?: unknown }).stdout === 'string') {
      return parseJson((err as { stdout: string }).stdout)
    }
    throw err
  }
}

export async function getCawOnboardStatus(options: CawCliOptions = {}): Promise<CawOnboardStatus> {
  const statusPayload = await runJson(['status'], options)
  let walletPayload: Record<string, unknown> = {}
  try {
    walletPayload = await runJson(['wallet', 'current'], options)
  } catch {
    walletPayload = {}
  }
  return statusFrom(statusPayload, walletPayload)
}

export async function runCawOnboardStep(args: {
  agentName?: string
  sessionId?: string
  answers?: Record<string, unknown>
  wait?: boolean
}, options: CawCliOptions = {}): Promise<CawOnboardStepResult> {
  const cliArgs = ['onboard']
  if (args.agentName?.trim()) cliArgs.push('--agent-name', args.agentName.trim())
  if (args.sessionId?.trim()) cliArgs.push('--session-id', args.sessionId.trim())
  if (args.answers && Object.keys(args.answers).length > 0) cliArgs.push('--answers', JSON.stringify(args.answers))
  if (args.wait) cliArgs.push('--wait')

  const onboardPayload = await runJson(cliArgs, options)
  const statusPayload = await runJson(['status'], options).catch(() => ({}))
  const walletPayload = await runJson(['wallet', 'current'], options).catch(() => ({}))
  return {
    ...statusFrom(statusPayload, walletPayload, onboardPayload),
    rawPhase: str(onboardPayload.phase),
  }
}
