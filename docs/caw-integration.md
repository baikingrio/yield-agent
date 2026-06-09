# Cobo Agentic Wallet Integration Notes

YieldAgent uses Cobo Agentic Wallet (CAW) as the bounded execution layer for strategy funds. The current implementation supports local Pact drafts and real Cobo Pact submission when server-side CAW credentials and Agent Wallet state are ready.

## Environments

Recommended hackathon/dev default:

```env
AGENT_WALLET_ENV=dev
AGENT_WALLET_API_URL=https://api-core.agenticwallet.dev.cobo.com
```

Production:

```env
AGENT_WALLET_ENV=prod
AGENT_WALLET_API_URL=https://api-core.agenticwallet.cobo.com
```

If `AGENT_WALLET_API_URL` is set explicitly, YieldAgent uses that URL. If it is omitted, the app derives the base URL from `AGENT_WALLET_ENV`.

## Server-Side Values

```env
# AGENT_WALLET_API_KEY= # optional; normally auto-provisioned by YieldAgent
AGENT_WALLET_TSS_RUNTIME=hermes-agent-host
AGENT_WALLET_MAIN_NODE_ID=
```

- `AGENT_WALLET_API_KEY`: optional initial CAW Agent API key. The normal YieldAgent flow does not require the user/operator to set it manually; when creating an Agent Wallet, YieldAgent calls CAW API `POST /api/v1/principals/provision` and stores the returned API key server-side only. Set this env var only when reusing an existing CAW Agent credential or intentionally bypassing auto-provision.
- `AGENT_WALLET_TSS_RUNTIME=hermes-agent-host`: the hackathon runtime decision; TSS Node runs on the current Hermes Agent host machine, not inside Vercel.
- `AGENT_WALLET_MAIN_NODE_ID`: TSS Node ID on the Hermes Agent host used when creating MPC wallets.

Never commit real API keys, pact-scoped API keys, private keys, wallet backups, or TSS credentials.

## Readiness Modes

The Settings page displays a CAW Readiness card with these modes:

- `local-draft` (shown as **配置未完成**): missing API key, Agent Wallet, or funding. Not the user-facing main path.
- `cobo-pact`: API key, Agent Wallet, and funding are ready; strategy creation can submit a real Cobo Pact.
- **Developer mode** (Settings → Advanced): when enabled, allows local Pact draft creation/approval for debugging without Cobo. Cannot execute on-chain recipes. `CAW_FORCE_LOCAL_DRAFT=true` is for CI/scripts only.
- `pact-execution-ready`: future mode for when an active Pact returns a pact-scoped execution API key and the app can execute transactions under that Pact.

## Runtime Caveat

Vercel is suitable for the Nuxt frontend and stateless entry routes, but it is not suitable for long-running TSS Node processes or direct Hermes CLI invocation. For this project, TSS Node is explicitly placed on the current Hermes Agent host machine. The deployed Vercel app must call a remote backend/API or tunnel on that host; it must not assume `localhost` inside Vercel is the Hermes/TSS machine.

## Agent Wallet Bootstrap (Step 2)

YieldAgent aligns with the Cobo canonical flow: `caw onboard` → TSS bootstrap → vault `active` → pairing. Two bootstrap modes are selected automatically:

| Mode | Trigger | Creation path |
|------|---------|---------------|
| `cli-onboard` | `caw` CLI available and `caw node health` passes | `caw onboard` + CLI sync |
| `sdk-create` | No CLI, but `AGENT_WALLET_MAIN_NODE_ID` set and remote TSS online | SDK `createWallet` + background polling |

Unified preparation phases:

```text
pending → tss_check → bootstrapping → active → pairing → paired → (fund)
```

API endpoints:

- `POST /api/wallet/preparation/create-agent` — starts bootstrap, returns immediately with `in_progress` + `bootstrapMode`.
- `GET /api/wallet/preparation/agent-status` — polls wallet status, TSS, address, and pairing; completes preparation when ready.
- `POST /api/wallet/preparation/import-agent` — imports an already-onboarded CLI wallet (`caw wallet current`).

Credential reuse (avoids duplicate `provision`):

1. `settings.coboApiKey` from a prior session
2. `AGENT_WALLET_API_KEY` env var
3. CLI profile key after `caw onboard` (`caw wallet current --show-api-key`)
4. Only if all three are missing: `POST /api/v1/principals/provision`

Pairing codes are generated only after the wallet reaches `active`. Generating a pair code while the vault is still `preparing` causes CAW App reshare failures.

## Current Implementation

- `/api/caw/readiness`: returns frontend-safe readiness data without secrets; `missing` distinguishes `TSS offline`, `Onboard incomplete`, and `Pairing pending`.
- `/api/caw/provision`: intentionally provisions a CAW Agent credential and stores the API key only in server-side session memory.
- Wallet page Step 2: TSS checklist, bootstrap phase labels, pairing poll, and「导入已 onboard 钱包」.
- Settings page: shows CAW environment, API URL, API key source, TSS Node readiness, Agent Wallet state, funding state, and Pact mode.

## Next Steps

1. Persist server-only CAW credential metadata safely outside frontend state.
2. Store pact-scoped execution API key server-side after Pact becomes active.
3. Execute strategy transactions with the pact-scoped API key and write SQLite audit logs.
