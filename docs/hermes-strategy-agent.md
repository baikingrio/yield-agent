# Hermes Strategy Agent Integration

YieldAgent no longer treats Z.AI API as the strategy layer. The strategy layer is now the Hermes Agent runtime running on the current Hermes Agent host machine. Because the frontend will be deployed to Vercel, production calls must reach this host through a remote Hermes API endpoint or tunnel, not through Vercel-local `localhost` or a CLI subprocess inside Vercel.

## Why Hermes

- The user already runs Hermes locally with tools, memory, and project context.
- Strategy parsing can use Hermes skills and deterministic server-side validation instead of a single remote LLM API.
- No extra Z.AI API key is required for the hackathon path.
- Hermes can explain allowed / denied strategy actions in plain Chinese while the app keeps final Pact validation deterministic.

## Runtime Decision

```env
# Production / Vercel path: remote-call the Hermes Agent host
HERMES_STRATEGY_MODE=api
HERMES_API_URL=https://<your-hermes-agent-host-or-tunnel>/hermes-api
HERMES_PROFILE=default
HERMES_STRATEGY_MODEL=

# Local development fallback only, when Nuxt is running on the same Hermes Agent host
HERMES_CLI_BIN=hermes
```

Local development on the Hermes Agent host can still call:

```bash
hermes chat -q "<strategy parsing prompt>"
```

But Vercel cannot spawn that CLI. When deployed, the safe path is:

```text
Vercel app / API route
  -> HTTPS endpoint or tunnel on current Hermes Agent host
  -> Hermes runtime
  -> deterministic validator in YieldAgent server flow
```

## Security Boundary

Hermes may suggest structured strategy parameters, but it must not directly bypass Pact validation. The safe pipeline is:

```text
User natural language
  -> Remote-call Hermes strategy parser / explainer on the Hermes Agent host
  -> Deterministic schema validator
  -> Pact policy builder
  -> CAW Pact submit
  -> CAW App approval
  -> Pact-scoped execution
```

## Current Implementation

- `server/utils/strategy-agent-readiness.ts`: pure readiness utility for same-host Hermes CLI development mode and remote Hermes API deployment mode.
- `GET /api/strategy-agent/readiness`: frontend-safe status endpoint.
- Settings page: Strategy Agent card shows Hermes mode, command/API endpoint, profile/model, and next action.

## Next Implementation Step

Add a server-only strategy parser endpoint:

```text
POST /api/strategy-agent/parse
```

It should:

1. Accept natural-language strategy text and current wallet/Pact limits.
2. Call the Hermes Agent host via API/tunnel in deployed mode, or local Hermes CLI only during same-host development, with a strict JSON-output prompt.
3. Parse JSON defensively.
4. Run deterministic validation for network, asset, maxSpend, riskLevel, duration, recipes, and revenue split.
5. Return a normalized strategy proposal plus risk explanation.

Do not let Hermes-generated output submit transactions or create Pacts without deterministic validation and explicit user confirmation.
