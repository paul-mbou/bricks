# ADR 0001: Astro + React islands, Appwrite Cloud, Vercel

- **Status:** Accepted
- **Date:** 2026-11-10
- **Deciders:** Client + project setup (PROJECT_SPEC §3); production host confirmed in repo rules

## Context

Bricks needs a mobile-first PWA with SSR pages, interactive forms, role-checked mutations, push, and offline queue — without putting API secrets in the browser. The client mandated Astro + React and Appwrite Cloud.

## Decision

- Frontend: Astro hybrid/SSR + React 19 islands + TypeScript strict + Tailwind 4
- Domain: pure `packages/domain` (Vitest) shared by UI and Functions
- Backend: Appwrite Cloud (Auth, DB, Storage, Functions, Messaging, Realtime)
- Production deploy: Vercel with `@astrojs/vercel` (not `@astrojs/node` unless explicitly requested)

## Alternatives considered

- Next.js full-stack — rejected: client imposed Astro + React
- Self-hosted Appwrite / custom API — rejected: Appwrite Cloud chosen for speed and Messaging
- Node adapter for production — rejected for current deploys; Vercel is the production target

## Consequences

- Positive: clear client/server split; domain rules testable offline; deploy path is `npx vercel --prod --yes`
- Negative / trade-offs: Appwrite quotas/region must be checked before scale; dual SDK (`appwrite` / `node-appwrite`)
- Follow-ups: live Functions replace demo `src/lib/store.ts` progressively; document real-device push results in README

## References

- `PROJECT_SPEC.md` §3
- `AGENTS.md`, `.cursor/rules/vercel-deploy.mdc`
