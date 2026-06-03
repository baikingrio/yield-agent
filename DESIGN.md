---
name: YieldAgent Collective
description: Pact-first agent console (zh-CN UI). Tokens live in app/assets/css/main.css and Tailwind theme extend. Near-black canvas, restrained yellow accent, Inter + JetBrains Mono. Shipped surfaces include /create-strategy (split ledger), AppNav, and placeholder dashboard/pacts/history.

colors:
  primary: "#fcd535"
  primary-active: "#f0b90b"
  primary-disabled: "#3a3a1f"
  ink: "#181a20"
  body: "#eaecef"
  muted: "#707a8a"
  muted-strong: "#929aa5"
  hairline: "#2b3139"
  canvas: "#0b0e11"
  surface: "#1e2329"
  surface-elevated: "#2b3139"
  on-primary: "#181a20"
  on-dark: "#ffffff"
  trading-up: "#0ecb81"
  trading-down: "#f6465d"
  info: "#3b82f6"
  status-pending: "#929aa5"
  status-active: "#0ecb81"
  status-paused: "#f0b90b"
  status-error: "#f6465d"

typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.5rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Inter, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
  mono-md:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "0"
  mono-sm:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0"
  button:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0"

rounded:
  sm: 4px
  md: 6px
  lg: 8px

spacing:
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
    height: 40px
  button-primary-hover:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-dark}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
    height: 40px
  top-nav-console:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.on-dark}"
    typography: "{typography.label}"
    height: 56px
  pact-preview-panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-dark}"
    typography: "{typography.title}"
    rounded: "{rounded.lg}"
    padding: "20px"
  pact-status-chip:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.status-active}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
  input-dark:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
    height: 40px
  hash-link:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.mono-sm}"
  step-indicator-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    size: 24px
---

# Design System: YieldAgent Collective

## Overview

**Creative North Star: "The Pact Ledger"（Pact 账本）**

YieldAgent Collective is a **ledger-first operations console** with **Simplified Chinese (zh-CN)** interface copy. What the agent may do (Pact policies, caps, recipes) and what it did (execution steps, transaction hashes) share equal visual weight. Atmosphere from PRODUCT.md: **精准 · 克制 · 可信**; dark by default; yellow reserved for primary actions and proof links.

**Implementation source of truth (scan sync):**

| Layer | Path |
|-------|------|
| CSS variables | `app/assets/css/main.css` (`--color-*`, `--font-*`, `--radius-*`, `--z-*`) |
| Tailwind bridge | `tailwind.config.ts` (`bg-primary`, `text-on-dark`, `border-hairline`, etc.) |
| Layout shell | `app/layouts/default.vue`, `app/components/AppNav.vue` |
| Signature flow | `app/pages/create-strategy.vue`, `app/components/create-strategy/*`, `app/composables/useCreateStrategy.ts` |

Routes shipped: `/`（控制台占位）, `/create-strategy`（左右分栏：表单 + sticky Pact 预览）, `/pacts`, `/history`. `html lang="zh-CN"` in `nuxt.config.ts`.

Palette adapts exchange-adjacent dark UI (near-black canvas, gray cards, single yellow accent) without Binance marketing clones. Flat surfaces; depth from tonal steps and hairlines. Motion only for pipeline state; `prefers-reduced-motion` zeroes transitions in `main.css`.

Rejects Meme DeFi, AI template slop, cream SaaS dashboards, and exchange homepage hero patterns.

**Key Characteristics:**

- Dark canvas (`{colors.canvas}`); product register; zh-CN labels.
- Yellow ≤10% of surface: primary CTAs, nav brand, tx links.
- Mono lane for amounts, caps, hashes (`font-mono` / JetBrains Mono).
- Status via chip text color (`status-*` tokens), not hero APY.
- Trading green/red for directional PnL only, not form errors.
- Split ledger on create-strategy: `lg:grid-cols-[1fr_300-380px]`, preview `lg:sticky`.

## Colors

Restrained palette: one warm yellow on cool gray-blues. Hex in frontmatter matches `main.css`; OKLCH in `.impeccable/design.json`.

### Primary

- **Agent Yellow** (`#fcd535`): `bg-primary`, `text-primary` links. Buttons: 创建 Pact, 返回控制台.
- **Agent Yellow Pressed** (`#f0b90b`): `hover:bg-primary-active`.
- **Agent Yellow Disabled** (`#3a3a1f`): disabled primary (`--color-primary-disabled`).

### Neutral

- **Console Void** (`#0b0e11`): `bg-canvas`, page background.
- **Panel Slate** (`#1e2329`): `bg-surface`, form sections, Pact preview panel.
- **Panel Raised** (`#2b3139`): `bg-surface-elevated`, chips, row hover.
- **Running Text** (`#eaecef`): `text-body`, default copy.
- **Caption Gray** (`#707a8a`): `text-muted`, helper text.
- **Caption Strong** (`#929aa5`): `text-muted-strong`, field labels.
- **Hairline** (`#2b3139`): `border-hairline`, dividers.

### Tertiary

- **Proof Blue** (`#3b82f6`): `:focus-visible` ring in `main.css` (50% alpha).
- **Flow Green** (`#0ecb81`): `text-trading-up`, active Pact, success chip.
- **Flow Red** (`#f6465d`): `text-trading-down`, failed pipeline.

**The Yellow Scarcity Rule.** Yellow on ≤10% of any screen: one CTA cluster, hash links, nav wordmark.

**The Pact Before Profit Rule.** Pact 预览 and pipeline states outrank optional target APY (secondary mono hint under field).

## Typography

**UI:** Inter via Google Fonts (`nuxt.config.ts`). **Evidence:** JetBrains Mono.

Loaded weights: Inter 400/500/600/700; JetBrains Mono 400/500.

### Hierarchy

- **Display** (600, `clamp(1.75rem,4vw,2.5rem)`, `text-balance`): Page titles, e.g. 创建策略.
- **Headline** (600, `text-2xl` / `text-base` section): 控制台, 网络与资产.
- **Title** (600, `text-base`): Pact 预览, card headings.
- **Body** (400, `text-sm`, `text-body`): Descriptions, pipeline copy.
- **Label** (500, `text-xs`, `text-muted-strong`): Form labels, step labels.
- **Mono** (`font-mono`, `text-[0.8125rem]`): 支出上限, fees, tx hashes. Prose (意图) stays sans.

**The Mono Evidence Rule.** Copyable strings use `font-mono`; narrative 意图 line uses regular `text-sm text-body`.

## Elevation

Tonal only: `canvas` → `surface` → `surface-elevated`. Borders: `border-hairline`. No box shadows in shipped components. Sticky Pact column: `lg:sticky lg:top-[calc(3.5rem+1.5rem)]`.

**The Flat-By-Default Rule.** No glass, gradients, or decorative glow.

Focus: global `box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5)` on `:focus-visible`.

## Components

Mapped to Vue files under `app/components/`.

### Buttons

- **Primary** (`button-primary`): `h-10 rounded-md bg-primary text-on-primary font-semibold`. Labels: 创建 Pact, 创建策略, 返回控制台, 修改策略.
- **Hover:** `hover:bg-primary-active`.
- **Disabled:** `disabled:bg-[var(--color-primary-disabled)] disabled:text-muted`.
- **Secondary** (`button-secondary`): bordered ghost on pipeline, 再建一条策略.

### Chips

- **Pact status** (`pact-status-chip`): `rounded-sm bg-surface-elevated px-2.5 py-1 text-xs`. Labels: 可提交, 等待审批, 执行中, Pact 已生效, 失败, 未完成.

### Cards / Containers

- **Pact preview panel** (`pact-preview-panel`): right column, `rounded-lg bg-surface`, sticky on desktop.
- **Form sections** (`StrategyForm.vue`): `rounded-lg border border-hairline bg-surface` for NL accordion; fields on `bg-canvas` inputs.
- **No nested cards.**

### Inputs / Fields

- **Dark input** (`input-dark`): `h-10 rounded-md bg-canvas text-on-dark`, `placeholder:text-muted`.
- **Select / radio:** same fill; risk radios use `border-primary` when selected.
- **Errors:** `text-trading-down text-xs` below field (创建策略页).

### Navigation

- **Top nav** (`AppNav.vue`, `top-nav-console`): `h-14 border-b border-hairline bg-canvas`. Links: 控制台, 创建策略, Pact 管理, 交易历史. Active: `border-primary text-on-dark`. Brand: `text-primary` YieldAgent. Badge: 演示.

### Step indicator

- **Create flow** (`StepIndicator.vue`): numbered steps 配置 → 预览 → 提交 → 审批 → 执行 → 完成. Active step: `bg-primary text-on-primary`.

### Pact preview block (signature)

- **Definition list** of 意图, 支出上限, 网络, 允许 Recipe, 期限, 收益分账, Agent 绩效费.
- **Pipeline panel:** 正在提交 Pact, 等待 Cobo 审批, Recipe 步骤列表, 查看交易 link (`text-primary font-mono`).
- **Layout:** `create-strategy.vue` split grid; preview CTA zone at panel foot.

## Do's and Don'ts

### Do:

- **Do** keep UI copy in **zh-CN**; keep proper nouns (Pact, CAW, Recipe, USDC, YieldAgent).
- **Do** source colors from `--color-*` in `main.css`; extend Tailwind rather than hardcoding hex in Vue.
- **Do** lead with Pact 预览 and pipeline state before yield figures.
- **Do** use `font-mono` for numeric caps, splits, and tx hashes.
- **Do** honor `prefers-reduced-motion` (already in `main.css`).
- **Do** use verb + object buttons: 创建 Pact, 解析并填入表单, 查看交易.

### Don't:

- **Don't** ship Meme DeFi: neon, moon copy, oversized APY heroes.
- **Don't** ship AI template slop: per-section eyebrows, 01/02/03 scaffolding, gradient text, icon-card grids.
- **Don't** mimic Binance marketing homepage patterns on product routes.
- **Don't** use cream SaaS or purple gradient dashboards.
- **Don't** use `trading-up` / `trading-down` for generic form validation.
- **Don't** use colored `border-left` accents on rows or cards.
- **Don't** gate visibility on entrance animations.
