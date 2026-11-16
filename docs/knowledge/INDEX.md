# Knowledge index — Bricks

> Deep onboarding for humans and agents. Prefer generating/updating via the
> **knowledge-memory-gen** skill from the real codebase. Do not invent structure.

Until generated: rely on `AGENTS.md`, `docs/PRODUCT.md`, `PROJECT_SPEC.md`, and the codebase.

## Reading paths

| Goal | Read first |
|------|------------|
| Orient fast | `PROJECT_SPEC.md` → `docs/PRODUCT.md` → `OPEN_QUESTIONS.md` |
| Change architecture / state / routing | ADRs in `../decisions/` → `src/lib/`, `appwrite/` |
| Match code style | `AGENTS.md` hard rules → `src/components/app/ui.tsx` |
| UI work | `README.md` design system + `.cursor/rules/bricks.mdc` |
| Domain calculations | `packages/domain` + PROJECT_SPEC §6 |
| Avoid landmines | `AGENTS.md` + `OPEN_QUESTIONS.md` |

## Files in this folder

| File | Status |
|------|--------|
| `PROJECT_OVERVIEW.md` | stub |
| `ARCHITECTURE.md` | stub |
| `CODING_CONVENTIONS.md` | stub |
| `DEVELOPMENT_RULES.md` | stub |
| `PATTERNS.md` | stub |
| `API_CONTRACT.md` | stub |
| `THEME_AND_UI.md` | stub |
| `PROJECT_STATUS.md` | stub |

Run **knowledge-memory-gen** to fill these from the live tree.
