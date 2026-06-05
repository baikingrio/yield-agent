# CAW Environment & Onboarding Readiness Implementation Plan

> **For Hermes:** Use TDD to implement this plan task-by-task. Do not expose API keys or pact-scoped keys to the client.

**Goal:** Add a CAW configuration/readiness layer for YieldAgent so users can see whether the app will create local Pact drafts, submit real Cobo Pacts, or execute active Pact transactions.

**Architecture:** Keep CAW integration state in shared/server types and pure server utilities first, then expose a safe `/api/caw/readiness` endpoint and a frontend readiness card/page. P0 focuses on environment/API URL/API key/TSS node readiness; P1 scaffolds onboarding readiness and safe API-key provision state without performing irreversible wallet operations automatically.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, Nitro server routes, Pinia, Vitest, Cobo Agentic Wallet TypeScript SDK, Tailwind CSS.

---

## Source Notes from 2026-06-03 Cobo CAW Sharing

- Dev API base: `https://api-core.agenticwallet.dev.cobo.com`
- Prod API base: `https://api-core.agenticwallet.cobo.com`
- Initial Agent API key can be created by `POST /api/v1/principals/provision`.
- Wallet creation requires an API key and usually a TSS node ID / runtime.
- Pairing creates an App token; after pairing, Pact approval happens in CAW App.
- Active Pact returns a pact-scoped `api_key`; API/SDK transaction calls should use this execution key, never expose it to frontend.

---

## P0 — CAW Environment Configuration & Readiness

### Task 1: Add shared CAW readiness types

**Objective:** Define a typed, frontend-safe representation of CAW env/readiness.

**Files:**
- Modify: `shared/types/demo.ts`
- Test: `tests/caw-readiness.test.ts`

**Implementation notes:** Add types such as:

```ts
export type CawEnvironment = 'dev' | 'prod' | 'custom'
export type CawPactMode = 'local-draft' | 'cobo-pact' | 'pact-execution-ready'

export interface CawReadiness {
  environment: CawEnvironment
  apiBaseUrl: string
  apiKeyConfigured: boolean
  apiKeySource: 'settings' | 'env' | 'missing'
  mainNodeConfigured: boolean
  agentWalletConfigured: boolean
  agentWalletAddress: string | null
  walletReady: boolean
  fundingReady: boolean
  pactMode: CawPactMode
  missing: string[]
  nextAction: string
}
```

**TDD:** First write tests for a pure `buildCawReadiness()` function before adding endpoint/UI.

---

### Task 2: Replace hardcoded default CAW API URL logic

**Objective:** Support `AGENT_WALLET_ENV=dev|prod|custom` and correct dev/prod default base URLs.

**Files:**
- Modify: `server/utils/cobo-config.ts`
- Test: `tests/caw-readiness.test.ts`
- Modify: `.env.example`

**Rules:**
- If `AGENT_WALLET_API_URL` exists, use it and mark env as `custom` unless `AGENT_WALLET_ENV` is explicitly `dev`/`prod`.
- If env is `prod`, default to `https://api-core.agenticwallet.cobo.com`.
- Otherwise default to `https://api-core.agenticwallet.dev.cobo.com`.

**Verification:**

```bash
pnpm vitest run tests/caw-readiness.test.ts
```

---

### Task 3: Implement pure `buildCawReadiness(state, env)` utility

**Objective:** Compute Pact mode and missing setup steps without calling Cobo API.

**Files:**
- Create: `server/utils/caw-readiness.ts`
- Test: `tests/caw-readiness.test.ts`

**Expected behavior:**
- No API key → `pactMode = 'local-draft'`, missing contains API key.
- API key but no main node → still can show partial readiness; missing contains TSS node ID.
- API key + agent wallet + funding ready → `pactMode = 'cobo-pact'`.
- Future active pact execution key support should map to `pact-execution-ready`, but P0 can leave this as a TODO field.

---

### Task 4: Add `/api/caw/readiness` endpoint

**Objective:** Return frontend-safe readiness data.

**Files:**
- Create: `server/api/caw/readiness.get.ts`
- Test: covered through utility tests for now; route smoke-tested by build.

**Security:** Do not return raw API key, pact-scoped API key, env secret values, or credential paths.

---

### Task 5: Add store method and settings/readiness UI

**Objective:** Let the UI show whether the project is in local draft, Cobo Pact, or execution-ready mode.

**Files:**
- Modify: `app/stores/demo.ts`
- Create: `app/components/settings/CawReadinessCard.vue`
- Modify: `app/pages/settings.vue`
- Modify: `app/components/AppNav.vue` only if adding a new route is preferable.

**UI content:**
- CAW 环境：dev/prod/custom
- API URL
- API Key：已配置/未配置 + source
- TSS Node ID：已配置/未配置
- Agent Wallet UUID：已配置/未配置
- Agent Wallet address
- Funding readiness
- Pact mode
- Next action

---

## P1 — Onboarding Readiness / Provision Scaffold

### Task 6: Extend settings with non-secret CAW metadata

**Objective:** Track Agent ID and provision status without exposing API key.

**Files:**
- Modify: `shared/types/demo.ts`
- Modify: `server/fixtures/initial-state.ts`
- Modify: `server/utils/settings.ts`
- Test: `tests/caw-readiness.test.ts`

**Fields:**

```ts
agentId?: string
apiKeyConfigured: boolean
```

Do not add `apiKey` to public responses.

---

### Task 7: Add provision request builder / API client seam

**Objective:** Prepare a safe server utility for `POST /api/v1/principals/provision` with testable request shape.

**Files:**
- Create: `server/utils/caw-provision.ts`
- Test: `tests/caw-provision.test.ts`

**Behavior:**
- Accept agent name.
- Build endpoint from CAW base URL.
- Parse `{ success, result: { agent_id, api_key, status } }`.
- Return only server-side result to caller.
- Store API key only in `state.settings.coboApiKey`; return public settings without key.

**Important:** Implement with dependency injection for `fetch` so tests do not hit real Cobo.

---

### Task 8: Add `/api/caw/provision` endpoint

**Objective:** Let the user intentionally provision a CAW Agent key from the UI.

**Files:**
- Create: `server/api/caw/provision.post.ts`
- Modify: `app/stores/demo.ts`

**Safety:** This is an external side effect. In UI, button label and text must make clear it creates a dev/prod CAW Agent credential. Do not auto-call on page load.

---

### Task 9: Add onboarding readiness panel actions

**Objective:** Surface P1 steps while keeping irreversible operations user-triggered.

**Files:**
- Modify/Create: `app/components/settings/CawReadinessCard.vue`

**Actions:**
- Provision Agent API Key button, with explicit user click.
- Refresh Readiness button.
- Link/hint to Wallet page for Agent Wallet creation.
- Hint that Vercel cannot host long-running TSS node; TSS node needs local/VPS runtime.

---

### Task 10: Update `.env.example` and docs

**Objective:** Document CAW env variables and deployment caveat.

**Files:**
- Modify: `.env.example`
- Create or Modify: `docs/caw-integration.md`

**Include:**
- Dev/prod API URLs.
- `AGENT_WALLET_ENV`.
- `AGENT_WALLET_API_URL`.
- `AGENT_WALLET_API_KEY`.
- `AGENT_WALLET_MAIN_NODE_ID`.
- No secrets in git.

---

## Verification Commands

Run after P0/P1:

```bash
pnpm test
pnpm build
git diff --check
git status --short
```

## Acceptance Criteria

- Settings page displays CAW readiness without leaking secrets.
- `.env.example` uses correct CAW core dev/prod URLs.
- Readiness endpoint returns mode and missing setup steps.
- Provision utility is covered by tests with fake fetch; no real Cobo request in tests.
- Build and tests pass.
- Work is committed locally; no push unless user explicitly asks.
