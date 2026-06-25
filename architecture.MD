# SimpleSave — Architecture (architecture.MD)

> Living document. Describes every layer of the project so any session can understand the build.
> **Update this file whenever module boundaries, interfaces, or the stack change.**
> Last updated: 2026-06-25 (session 1 — project kickoff, no code yet).

---

## 1. Status

**Phase:** Ready to build — reference data gathered, key decisions resolved (see §6). Awaiting go-ahead to scaffold.
**Code written so far:** none. Only tracking files (`rules.MD`, `architecture.MD`, `progress.MD`).
**Tech stack (DECIDED 2026-06-25):** Next.js (React + TypeScript) full-stack · PostgreSQL · Prisma ORM.
Hebrew-first RTL, i18n-ready, accessibility-first. Hosting TBD.

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

1. ✅ **Tech stack** — Next.js (React+TS) + PostgreSQL + Prisma. Hosting TBD.
2. ✅ **Build mode** — BUILD FRESH (no accessible prototype; Base44 version inaccessible). Port the simulator's
   calc logic into a clean module; spec = requirements; mockups = design.
3. ✅ **Calculation formulas** — taken from the simulator: `PMT`/`calcRoute` (Shpitzer + Equal-Principal, linkage,
   balloon/grace); risk score = share-weighted `riskRules` (see simulator-engine.html).
4. ✅ **Default dial/mix definitions** — the 5 שעונים from `CLOCK_TEMPLATES` (clock1–5) in the simulator.
5. ✅ **Reference data** — rate tables, doc lists, parser keywords, consent forms all in hand (`assets/reference/`,
   `assets/forms/`). Open item: real insurance tariff numbers (were in missing insurance-rates.js) — obtain at
   Insurance module (module 6).
6. ✅ **Business-rule defaults** (admin-editable, not hardcoded): max repayment 40% · loan-term age cap 85 ·
   credit-history lookback 7 yr · expected annual index 3% · non-owner borrower counts 50% of net income.
7. ⏳ **Repo/folder structure** — single Next.js app; decide app-router layout at scaffold time.
8. ⏳ **i18n library** + RTL approach — decide at scaffold time (Hebrew-first, structure for ru/fr/en).

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
