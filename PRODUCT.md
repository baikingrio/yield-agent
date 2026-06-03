# Product

## Register

product

## Users

- **Primary:** DeFi yield farmers and treasury operators who want automated, bounded on-chain yield strategies without handing unrestricted wallet control to an agent.
- **Secondary:** AI agent developers and hackathon judges evaluating Cobo Agentic Wallet integration, Pact enforcement, and auditability in a live demo.
- **Context:** Users work at a desk or on a laptop, often monitoring positions across sessions. They need to trust limits (Pact policies, caps, whitelists) before they care about headline APY. Demo viewers may only see the product for a few minutes, so security boundaries must read instantly.

## Product Purpose

YieldAgent Collective is an autonomous DeFi yield strategy agent collective for Agentic Commerce. Multiple AI agents operate under **Cobo Agentic Wallet (CAW) Pacts** to execute yield farming, rebalancing, and revenue sharing on testnets (Base / Arbitrum). The interface exists to make **what the agent is allowed to do** and **what it actually did** equally visible: wallet state, active Pacts, execution logs, and transaction hashes.

Success for the hackathon demo means a judge can answer in under a minute: *Where are the limits? Where is the proof?* Secondary surfaces (short intro or judge-facing story) may use a **brand** register, but the default experience is the **product** console: Dashboard, strategy creation, Pact management, history, and settings.

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

## Accessibility & Inclusion

- Target **WCAG 2.1 AA** for text contrast, focus visibility, form labels, and keyboard reachability on interactive controls.
- Provide **`prefers-reduced-motion: reduce`** alternatives: crossfade or instant state change instead of entrance choreography.
- Use trading green/red only for **directional or semantic** price/change signals, not generic success/error, to avoid confusing color-blind users.
