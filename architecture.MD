# SimpleSave — Architecture (architecture.MD)

> Living document. Describes every layer of the project so any session can understand the build.
> **Update this file whenever module boundaries, interfaces, or the stack change.**
> Last updated: 2026-06-25 (session 1 — project kickoff, no code yet).

---

## 1. Status

**Phase:** Building. Done: Phase 0 (scaffold/home), Phase 1 (calc engine), Phase 2A (Supabase+Prisma), Phase 2B
(config seeded). Next: Phase 2C (auth/roles) → 2D (admin config UI). See ROADMAP.md / progress.MD handoff.
**Code written so far:** none. Only tracking files (`rules.MD`, `architecture.MD`, `progress.MD`).
**Tech stack (DECIDED 2026-06-25):** Next.js (React + TypeScript) · **Supabase** (Postgres + Auth/OTP + Storage,
EU region for Std 13) · Prisma (app data, via the Supabase pooler) · Tailwind 4 · next-intl.
Hebrew-first RTL, i18n-ready, accessibility-first.
**Build order:** calc engine → manager/config backbone → customer flow → customer accounts (see ROADMAP.md).

---

## 2. Architectural Principles (the "why")

1. **Modular-first.** Each screen, calculator, and role area is an independent, swappable module.
2. **No coupling across layers.** Data flows through typed objects:
   `Questionnaire → QuestionnaireAnswer → Calculator → MortgageMix result → Dials`.
3. **Calculation engine is pure & standalone** — no UI, no DB, fully unit-testable.
4. **Config-driven.** Rates, document lists, dial definitions, global parameters live in the DB and are admin-editable.
5. **i18n-ready.** Hebrew-first RTL; all strings externalized for future languages.
6. **Single source of truth** for every business rule and value.

---

## 3. Logical Layers

```
┌─────────────────────────────────────────────────────────┐
│  Presentation (UI modules, RTL, i18n, a11y)              │
│  Home · Questionnaire · Dials · Personal Area · Admin ·  │
│  Advisor · Insurance · Post-Mortgage                     │
├─────────────────────────────────────────────────────────┤
│  Interface / Contracts (typed data objects)              │
│  QuestionnaireAnswer · MortgageMix · CalcResult · ...    │
├─────────────────────────────────────────────────────────┤
│  Business Logic (pure, standalone, testable)             │
│  Calculation Engine · Eligibility · Validation rules     │
├─────────────────────────────────────────────────────────┤
│  Services / Adapters                                     │
│  Auth(OTP) · Document storage · Bank-report parser       │
│  (adapter per bank) · Insurance data hooks · gov.il      │
├─────────────────────────────────────────────────────────┤
│  Data / Config (DB)                                      │
│  InterestRateTable · GlobalParameters · DocumentLists ·  │
│  DialDefinitions · all entities (§5)                     │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Modules (each independent & swappable)

| Module | Responsibility | Consumes | Produces |
|---|---|---|---|
| Home | Entry, nav, service selection | — | route to service |
| Questionnaire | Wizard form, 3 variants (new/refi/insurance), 1–5 borrowers, validation, conditional logic | config (question defs) | `QuestionnaireAnswer` (typed) |
| Calculation Engine | Mix calc (Shpitzer / Equal Principal), refi compare, repayment capacity, eligibility, insurance premium | `QuestionnaireAnswer`, rate tables | `CalcResult` / `MortgageMix` |
| Dials | Show 5 mix options, risk speedometer, detail charts, refi side-by-side | `CalcResult` | user selection |
| Personal Area | Tabbed area per request; personal/mortgage data, docs, approvals, collateral, messages | user data | — |
| Document Upload | Drag-drop, dynamic required-doc list, advisor review | loan type + borrower profile | `Document` records |
| Insurance | 5 offers, ministry rating, premium compare, consent to pull policy | questionnaire + rate tables | `InsuranceOffer` |
| Post-Mortgage | Mix pie, per-track breakdown, running balance, multi-draw, alerts | `ActiveMortgage` | alerts |
| Admin | Configure dials, rate tables, global params, advisor assignment | — | config |
| Advisor | Task list, client list, full client view, doc review, manual doc requests | client data | edits/approvals |
| Auth | OTP (email/phone/ID), role-based access | — | session |
| Bank-Report Parser | Adapter per bank → standardized fields | uploaded PDF/file | normalized mortgage record |

---

## 5. Key Data Entities

`User` · `Borrower` · `MortgageRequest` (new/refi/insurance) · `QuestionnaireAnswer` · `MortgageMix` (5 dials) · `MortgageTrack` · `Document` · `BankApproval` · `InsuranceOffer` · `ActiveMortgage` · `MortgageDisbursement` · `Advisor` · `Task` · `InterestRateTable` · `GlobalParameters`

> Detailed field-level schema TBD per entity as each module is built. Add schema sections here as they solidify.

---

## 6. Decisions (resolved unless marked)

1. ✅ **Tech stack** — Next.js (React+TS) + **Supabase** (Postgres + Auth/OTP + Storage) + Prisma. EU region (Std 13).
2. ✅ **Build mode** — BUILD FRESH (no accessible prototype; Base44 version inaccessible). Port the simulator's
   calc logic into a clean module; spec = requirements; mockups = design.
   **Build order (client-chosen):** calc engine → manager/config backbone → customer flow → customer accounts.
   Supabase Auth is stood up in the backbone phase to protect the admin area.
3. ✅ **Calculation formulas** — taken from the simulator: `PMT`/`calcRoute` (Shpitzer + Equal-Principal, linkage,
   balloon/grace); risk score = share-weighted `riskRules` (see simulator-engine.html).
4. ✅ **Default dial/mix definitions** — the 5 שעונים from `CLOCK_TEMPLATES` (clock1–5) in the simulator.
5. ✅ **Reference data** — rate tables, doc lists, parser keywords, consent forms all in hand (`assets/reference/`,
   `assets/forms/`). Open item: real insurance tariff numbers (were in missing insurance-rates.js) — obtain at
   Insurance module (module 6).
6. ✅ **Business-rule defaults** (admin-editable, not hardcoded): max repayment 40% · loan-term age cap 85 ·
   credit-history lookback 7 yr · expected annual index 3% · non-owner borrower counts 50% of net income.
7. ✅ **Repo/folder structure** — single Next.js app (App Router, `src/`). See §9.
8. ✅ **i18n** — next-intl, Hebrew-first, **no URL routing yet** (single locale). Add ru/fr/en by extending
   `src/i18n/config.ts` + a `messages/<locale>.json` + routing. Tailwind v4 + `dir="rtl"` on `<html>`.

---

## 9. Actual project structure (as built)

```
simplesave/
├─ src/
│  ├─ app/                 # App Router (layout.tsx = he/rtl, page.tsx = home)
│  ├─ components/layout/   # shared UI (SiteHeader)
│  ├─ modules/<feature>/   # one self-contained folder per module (home; admin next)
│  ├─ lib/
│  │  ├─ calc/             # ✅ ported calc engine — pure, testable (finance/route/mix/risk)
│  │  ├─ contracts/        # ✅ typed objects between layers (mortgage.ts)
│  │  └─ db.ts             # ✅ Prisma singleton (pg driver adapter, pooled)
│  └─ i18n/                # config.ts, request.ts
├─ messages/he.json        # all UI strings (externalized)
├─ prisma/
│  ├─ schema.prisma        # ✅ config-backbone models
│  └─ seed.mjs             # ✅ seeds config from simulator defaults
├─ prisma.config.ts        # ✅ Prisma 7 connection config (DIRECT_URL)
├─ public/logo.png
├─ assets/                 # logo source, forms/, reference/ (client material)
└─ .env.local              # secrets (gitignored) — Supabase/Prisma URLs + keys
```

Stack: Next 16 · React 19 · Tailwind 4 · next-intl 4 · Prisma 7 (+ @prisma/adapter-pg) · Supabase (EU) · Vitest.

**DB connection (Prisma 7):** URLs in `prisma.config.ts` (CLI/migrations → `DIRECT_URL`, session pooler 5432);
runtime via `@prisma/adapter-pg` with the pooled `DATABASE_URL` (6543). Schema synced with `db push` (not
`migrate dev`) for now. Config-backbone tables seeded; user/borrower/request entities come in their phases.

---

## 7. Track Types (for calc engine & admin config)

- **Fixed:** 4–30 yr, index-linked or not.
- **Variable:** changes every X months, 4–30 yr.
- **Prime:** 4–30 yr, no index.
- A mix = up to 10 tracks, each with configurable %.

---

## 8. Roles & Access

| Role | Access |
|---|---|
| Customer | Questionnaire → Dials → Personal Area → Documents → Approvals |
| Advisor | Client list, tasks, document review, data edits |
| Admin | Full control: dials, rates, advisor assignment, global parameters |

Shared single login entry (personal area), OTP-based.
