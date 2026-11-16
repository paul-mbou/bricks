# AGENTS.md — Bricks

> Portable contract for **any** coding agent (Cursor, Claude Code, Zed, Copilot, …).
> Read this first. Then `HANDOFF.md`, then `docs/PRODUCT.md`, then `docs/knowledge/INDEX.md`.
> Full product spec: `PROJECT_SPEC.md`. Open params: `OPEN_QUESTIONS.md`.

## Product (one sentence)

Mobile-first PWA for a Cameroonian block factory: derived stock, supplier circuit, production, sales, energy, alerts/push, payroll, weekly benefit (FCFA).

## Stack

| Layer | Choice |
|-------|--------|
| Frontend | Astro (SSR) + React 19 islands + TypeScript strict |
| UI | Tailwind 4 tokens slate/clay (`src/styles/global.css`), kit `src/components/app/ui.tsx` (from gold_stock) |
| Domain | `packages/domain` (pure + Vitest) |
| Backend | Appwrite Cloud (Auth, DB, Storage, Functions, Messaging, Realtime) |
| Offline | `src/lib/offlineQueue.ts` + service worker |
| Deploy | Vercel (`@astrojs/vercel`) |

## Hard rules (do not violate)

1. UI is bilingual EN/FR via `src/lib/i18n` (default = browser language; override in Settings). Currency FCFA. Code/variables/comments in English — no hardcoded UI strings outside i18n catalogs.
2. Stock is never entered directly — only via `StockMovement`.
3. §6 calculations live only in `packages/domain`, tested.
4. Sensitive mutations go through Appwrite Functions (Zod + roles + AuditLog).
5. No Appwrite API secrets in client code; review collection permissions on new collections.
6. Brand tokens: `slate` / `clay` / `br-*` (lavender / charcoal / lime) — never navy/gold from gold_stock.
7. Light by default; dark via `.dark`; respect `prefers-reduced-motion`.
8. Long forms → sheet (`Modal variant="sheet"`).
9. Push never from the client — Alert then Function.
10. Never commit `.env` / secrets. Prefer existing patterns over inventing new ones.
11. No hardcoded thresholds, rates, or yields — all from settings/DB.

## Layout map

```text
AGENTS.md                 # This contract
HANDOFF.md                # Session WIP
CLAUDE.md                 # Pointer → AGENTS.md
PROJECT_SPEC.md           # Full product brief
OPEN_QUESTIONS.md         # Open configurable params
docs/PRODUCT.md           # Short product intent
docs/decisions/           # ADRs
docs/knowledge/           # Deep onboarding (stubs → knowledge-memory-gen)
packages/domain/          # Pure §6 rules + Vitest
src/components/           # React islands + ui kit
src/lib/                  # store, offline queue, appwrite client
src/pages/                # Astro routes
appwrite/                 # collections.json + Functions
.cursor/rules/            # Cursor hard rules (bricks, vercel, continuity)
```

## How to verify before claiming done

```bash
npm test
npm run check
npm run build
npx vercel --prod --yes
```

After any meaningful code change, deploy to Vercel and share the URL.

## Where deeper truth lives

| Need | Path |
|------|------|
| Product intent | `docs/PRODUCT.md` · full brief `PROJECT_SPEC.md` |
| Open params | `OPEN_QUESTIONS.md` |
| Architecture & conventions | `docs/knowledge/` (start at `INDEX.md`) |
| Why we chose X | `docs/decisions/` |
| Current WIP / don’t-touch | `HANDOFF.md` |
| Domain playbooks | `.cursor/rules/bricks.mdc`, `.cursor/rules/vercel-deploy.mdc` |

## Bootstrap order (mandatory)

1. This file
2. `HANDOFF.md`
3. `docs/PRODUCT.md`
4. `docs/knowledge/INDEX.md` → only sections relevant to the task
5. `PROJECT_SPEC.md` (+ `OPEN_QUESTIONS.md` if touching params)
6. Matching rule/skill (`.cursor/rules/bricks.mdc`, UI kit, domain package)

## Out of scope for agents

- Inventing product rules that contradict `PROJECT_SPEC.md` / this file
- Switching production adapter away from `@astrojs/vercel` without an explicit request
- Sending push from the client or mutating stock outside movements
- Committing secrets or filling `docs/knowledge/` with invented structure (use knowledge-memory-gen)
