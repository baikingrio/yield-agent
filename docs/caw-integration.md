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

## Required Server-Side Values

```env
AGENT_WALLET_API_KEY=
AGENT_WALLET_TSS_RUNTIME=local
AGENT_WALLET_MAIN_NODE_ID=
```

- `AGENT_WALLET_API_KEY`: initial CAW Agent API key. It can be provisioned through CAW API `POST /api/v1/principals/provision` or obtained from CAW tooling/platform flow.
- `AGENT_WALLET_TSS_RUNTIME=local`: the hackathon runtime decision; TSS Node runs on this machine, not Vercel.
- `AGENT_WALLET_MAIN_NODE_ID`: local TSS Node ID used when creating MPC wallets.

Never commit real API keys, pact-scoped API keys, private keys, wallet backups, or TSS credentials.

## Readiness Modes

The Settings page displays a CAW Readiness card with these modes:

- `local-draft`: missing API key, Agent Wallet, or funding; strategy creation falls back to local Pact draft.
- `cobo-pact`: API key, Agent Wallet, and funding are ready; strategy creation can submit a real Cobo Pact.
- `pact-execution-ready`: future mode for when an active Pact returns a pact-scoped execution API key and the app can execute transactions under that Pact.

## Runtime Caveat

Vercel is suitable for the Nuxt frontend and stateless API routes, but it is not suitable for long-running TSS Node processes. For this project, TSS Node is explicitly placed on this local machine. Vercel should call only stateless Nuxt APIs; local CAW/TSS runtime stays outside Vercel.

## Current Implementation

- `/api/caw/readiness`: returns frontend-safe readiness data without secrets.
- `/api/caw/provision`: intentionally provisions a CAW Agent credential and stores the API key only in server-side session memory.
- Settings page: shows CAW environment, API URL, API key source, TSS Node readiness, Agent Wallet state, funding state, and Pact mode.

## Next Steps

1. Persist server-only CAW credential metadata safely outside frontend state.
2. Add pair-code generation and pair-status polling.
3. Store pact-scoped execution API key server-side after Pact becomes active.
4. Execute strategy transactions with the pact-scoped API key and write SQLite audit logs.
