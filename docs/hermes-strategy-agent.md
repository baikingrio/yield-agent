# Hermes Strategy Agent Integration

YieldAgent no longer treats Z.AI API as the strategy layer. The strategy layer is now the local Hermes Agent runtime.

## Why Hermes

- The user already runs Hermes locally with tools, memory, and project context.
- Strategy parsing can use Hermes skills and deterministic server-side validation instead of a single remote LLM API.
- No extra Z.AI API key is required for the hackathon path.
- Hermes can explain allowed / denied strategy actions in plain Chinese while the app keeps final Pact validation deterministic.

## Runtime Decision

```env
HERMES_STRATEGY_MODE=cli
HERMES_CLI_BIN=hermes
HERMES_PROFILE=default
HERMES_STRATEGY_MODEL=
```

Default mode is local CLI invocation. The Nuxt server can call:

```bash
hermes chat -q "<strategy parsing prompt>"
```

Alternative local API mode:

```env
HERMES_STRATEGY_MODE=api
HERMES_API_URL=http://127.0.0.1:8000
```

## Security Boundary

Hermes may suggest structured strategy parameters, but it must not directly bypass Pact validation. The safe pipeline is:

```text
User natural language
  -> Local Hermes strategy parser / explainer
  -> Deterministic schema validator
  -> Pact policy builder
  -> CAW Pact submit
  -> CAW App approval
  -> Pact-scoped execution
```

## Current Implementation

- `server/utils/strategy-agent-readiness.ts`: pure readiness utility for local Hermes CLI/API mode.
- `GET /api/strategy-agent/readiness`: frontend-safe status endpoint.
- Settings page: Strategy Agent card shows Hermes mode, command/API endpoint, profile/model, and next action.

## Next Implementation Step

Add a server-only strategy parser endpoint:

```text
POST /api/strategy-agent/parse
```

It should:

1. Accept natural-language strategy text and current wallet/Pact limits.
2. Call local Hermes CLI/API with a strict JSON-output prompt.
3. Parse JSON defensively.
4. Run deterministic validation for network, asset, maxSpend, riskLevel, duration, recipes, and revenue split.
5. Return a normalized strategy proposal plus risk explanation.

Do not let Hermes-generated output submit transactions or create Pacts without deterministic validation and explicit user confirmation.
