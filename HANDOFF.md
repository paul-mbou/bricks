# HANDOFF — Bricks

> Short session bridge. Update at end of every work session. Keep ≤ 1 screen.
> Last updated: 2026-11-10 · By: ai-continuity-kit install

## Goal of current work

Install portable AI continuity kit so any coding agent can onboard without breaking Bricks constraints.

## Done since last handoff

- Continuity kit scaffolded (`CLAUDE.md`, `docs/PRODUCT.md`, `docs/decisions/`, `docs/knowledge/`, `.cursor/rules/ai-continuity.mdc`)
- Existing `AGENTS.md` kept and extended with kit bootstrap / deeper-truth map

## In progress

- Clean slate for product work — next agent picks feature from `PROJECT_SPEC.md` §11 / `OPEN_QUESTIONS.md`

## Do not touch

- `packages/domain` formulas without updating Vitest coverage (§6)
- Client-side push or Appwrite API secrets
- Direct stock mutation (must go through `StockMovement`)
- Brand tokens: no navy/gold from gold_stock

## Blockers / open questions

- See `OPEN_QUESTIONS.md` (paramètres métier encore ouverts)
- Push réel sur device propriétaire non documenté dans `README.md`

## How to validate

```bash
npm test
npm run check
npm run build
npx vercel --prod --yes
```

## Pointers

- Contract: `AGENTS.md`
- Product: `docs/PRODUCT.md`
- Knowledge: `docs/knowledge/INDEX.md` (stubs — run knowledge-memory-gen for depth)
- Spec: `PROJECT_SPEC.md`
- Latest ADR: `docs/decisions/0001-astro-appwrite-vercel.md`
