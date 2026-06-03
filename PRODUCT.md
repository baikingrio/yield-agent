# Product

## Register

product

## Users

- **Primary:** DeFi yield farmers and treasury operators who want automated, bounded on-chain yield strategies without handing unrestricted wallet control to an agent.
- **Secondary:** AI agent developers and hackathon judges evaluating Cobo Agentic Wallet integration, Pact enforcement, and auditability in a live demo.
- **Context:** Users work at a desk or on a laptop, often monitoring positions across sessions. They need to trust limits (Pact policies, caps, whitelists) before they care about headline APY. Demo viewers may only see the product for a few minutes, so security boundaries must read instantly.

## Product Purpose

YieldAgent Collective is an autonomous DeFi yield strategy agent collective for Agentic Commerce. Multiple AI agents operate under **Cobo Agentic Wallet (CAW) Pacts** to execute yield farming, rebalancing, and revenue sharing on testnets (Base / Arbitrum). The interface exists to make **what the agent is allowed to do** and **what it actually did** equally visible: wallet state, active Pacts, execution logs, and transaction hashes.

Success for the hackathon demo means a judge can answer in under a minute: *Where are the limits? Where is the proof?* Secondary surfaces (short intro or judge-facing story) may use a **brand** register, but the default experience is the **product** console: landing entry, first strategy creation, Pact preview, Dashboard, Pact management, history, and settings.

## First-time User Journey

The product must not drop a new visitor directly into a data dashboard. First-time users need a clear path from understanding the product to creating their first bounded strategy.

```text
1. User visits the YieldAgent landing page.
2. User understands the core promise: AI agents can execute yield strategies, but only inside a user-approved Pact.
3. User chooses Demo Mode or testnet mode. Demo Mode is the default for judges.
4. User chooses a strategy template, preferably Conservative USDC Yield.
5. User inputs or edits the natural-language strategy.
6. System generates Pact Preview.
7. User confirms capital limits, allowed recipes, duration, and revenue split.
8. User approves the Pact or runs dry-run demo.
9. Agent executes only inside Pact boundaries.
10. Dashboard shows active Pact state, recent Agent actions, audit trail, tx hashes, and secondary yield chart.
11. User can inspect History or terminate the Pact.
```

### Entry Principles

- `/` is the product entry / landing page, not the operational dashboard.
- The first CTA is **Create first Pact strategy**.
- The secondary CTA is **View Demo Console**.
- Demo Mode is explicit and safe: no API key, no private key, no real funds.
- Users start from a template before free-form natural language.

### Strategy Templates

1. **Conservative USDC Yield** — recommended first experience. Base Sepolia, max 500 USDC, Aave / Compound Supply only, user 85%, Agent 15%.
2. **Balanced Yield Strategy** — allows small adjustment / swap behavior, still bounded by budget, allowlist, and duration.
3. **Custom Strategy** — user describes their goal in natural language, but the product still generates Pact Preview before submission.

## Core Interaction Model

YieldAgent is organized around a Pact-first flow:

```text
Landing
  -> Strategy Template
  -> Natural-language strategy input
  -> Pact Preview
  -> Approve / dry-run
  -> Dashboard
  -> History / Pact Management
```

### Pact Preview Requirements

Before the user starts an Agent, the UI must clearly separate what is allowed from what is denied.

**Allowed:**

- Maximum spend, e.g. 500 USDC.
- Network, e.g. Base Sepolia.
- Allowed Recipes, e.g. Aave Supply / Compound Supply.
- Duration, e.g. 7 days.
- Revenue split, e.g. user 85%, Agent 15%.

**Denied:**

- Spending above max budget.
- Calling non-allowlisted protocols or unknown tokens.
- Continuing after Pact termination or expiry.
- Changing the user-approved split.
- High-risk leverage / LP / derivative strategies in v0.1.

## Dashboard Product Role

The Dashboard is not the starting point for a new user. It is the post-activation monitoring surface.

Dashboard priority order:

1. Active Pact state and remaining boundaries.
2. Recent Agent actions.
3. Audit trail: action, status, reason, tx hash.
4. Strategy list and Pact management links.
5. Yield chart as secondary evidence, never the hero.

## Required Denial Path

The demo must show at least one rejected request. This is a product feature, not just an error state.

Example:

```text
Agent attempted:
Swap 500 USDC into unknown token

Result:
Denied

Reason:
Recipe not allowed by current Pact.
```

This proves that CAW Pact is enforcing boundaries. A visible denial path is more important than another successful yield chart.

## Brand Personality

**精准 · 克制 · 可信** — reads like a controlled operations console, not a hype funnel. Copy states facts (limits, hashes, states). Visual energy comes from structure and the Binance-adapted yellow accent on dark canvas, not from neon, gradients, or exaggerated yield claims.

## Anti-references

- **Meme DeFi:** neon palettes, chaotic motion, “moon” language, oversized APY hero metrics that imply guaranteed returns.
- **AI template slop:** repeated section eyebrows, `01 / 02 / 03` scaffolding on every block, glassmorphism stacks, gradient text, identical icon-card grids.
- **Implicit (not selected but still avoid):** treating the app as a generic SaaS dashboard (cream backgrounds, purple gradients) or a pixel-perfect Binance marketing clone that obscures YieldAgent’s agent/Pact story.

## Design Principles

1. **Pact before profit.** Every primary screen leads with permissions, caps, and policy state; returns and APY are secondary evidence, never the hero.
2. **Show the audit trail.** Tx hashes, execution logs, and agent actions are first-class UI, not buried in settings — demo trust lives in traceability.
3. **Restrained motion, clear states.** Animations clarify transitions (pending → approved → executed); nothing decorative competes with log readability. Honor `prefers-reduced-motion`.
4. **One accent, many surfaces.** Adapt the existing Binance-inspired dark system (yellow primary on near-black) for density and familiarity, but layout and copy stay agent-console, not exchange homepage.
5. **Product default, brand when narrating.** Hackathon or intro moments may borrow brand register (story, value prop); all operational work stays in product patterns (tables, forms, status chips).
6. **Start with the user path.** The product must guide first-time users from landing → template → Pact Preview → dashboard, instead of assuming they already know why the console matters.
7. **Denials are proof.** Rejected requests are not failure copy; they are the evidence that the Pact boundary works.

## Accessibility & Inclusion

- Target **WCAG 2.1 AA** for text contrast, focus visibility, form labels, and keyboard reachability on interactive controls.
- Provide **`prefers-reduced-motion: reduce`** alternatives: crossfade or instant state change instead of entrance choreography.
- Use trading green/red only for **directional or semantic** price/change signals, not generic success/error, to avoid confusing color-blind users.
