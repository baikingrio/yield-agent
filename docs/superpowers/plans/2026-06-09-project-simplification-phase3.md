# Phase 3 简化 Implementation Plan

> **Status:** Implemented in session 2026-06-09

**Goal:** 用户主路径仅 Cobo；设置页开发者模式控制 local-draft；命名清理与文档对齐。

**Spec:** `docs/superpowers/specs/2026-06-09-project-simplification-phase3-design.md`

## Delivered

- `server/utils/local-draft-policy.ts` + tests
- `AppSettings.developerMode` + settings API persist
- `cobo-pact.ts` / `approve.post.ts` / `caw-readiness.ts` 门控与文案
- SettingsForm 开发者模式开关；PactDetail / useCreateStrategy UI
- `shared/constants/network.ts`；`strip-legacy-seed`；`previewTxHash`；`app-session.json`
- README / `.env.example` / `docs/caw-integration.md` 更新

## Verification

```bash
pnpm test    # 116 passed
pnpm run build
rg "const NETWORK_LABELS" --glob '*.{ts,vue}'  # only shared/constants/network.ts
rg "strip-demo-seed|demoTxHash" --glob '*.{ts,vue}'  # no matches
```
