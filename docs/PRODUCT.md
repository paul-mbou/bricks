# Product — Bricks

## Purpose

Bricks is a mobile-first PWA for running a Cameroonian block factory (briqueterie): track raw materials and finished blocks, supplier intake → validation → payment, production, sales, energy/water, payroll, weekly profit recap, and owner push alerts. Stock is never typed by hand — it is derived from immutable movements. Goal: give the owner and manager a reliable weekly picture of what came in, was produced, lost, sold, spent, and earned (FCFA).

## Primary users

- Direction / propriétaire (full access, validations, payments, push alerts)
- Gérant (day-to-day entry and recap; no payment validation)
- Magasinier, chef de production, comptable/RH, secrétaire (role-scoped)

## Core jobs (must serve)

1. Real-time derived stock (cement, aggregates, block types) with alert thresholds
2. Supplier circuit (delivery note → reception → direction validation → payment)
3. Production, losses, sales, utilities, payroll, and automatic weekly benefit

## This product is not

- A generic ERP or multi-tenant SaaS for unrelated industries
- An accounting replacement (it tracks factory ops + weekly benefit, not full ledger)

## Brand / UX north star (if UI)

Mobile-first atelier UI: large tap targets, bilingual EN/FR copy (browser language by default), gold_stock shell patterns with Bricks tokens (`slate` / `clay` / `br-*` — soft lavender / charcoal / lime). Light by default; long forms in sheets; bottom nav on mobile. Demo mode when Appwrite env is missing.

## Success signals

- Owner trusts weekly benefit without spreadsheet reconciliation
- Stock alerts and validation queues reach the owner via push
- Sensitive mutations always audited; offline production/reception can sync later
