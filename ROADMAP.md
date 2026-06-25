# SimpleSave — Build Roadmap (ROADMAP.md)

> The forward plan: what we build in each session, what it needs, and what's done.
> Pairs with [progress.MD](progress.MD) (running log) and [architecture.MD](architecture.MD) (how it's built).
> **A "session" = a coherent chunk of work, not a calendar day.**
>
> **Order (client-chosen, 2026-06-25):** calc engine → **manager/config backbone** → customer flow → customer accounts.
> Rationale: the system is config-driven; the customer dials *consume* admin-defined config (dial templates,
> rate tables, global params), so we build that backbone first and avoid throwaway seeding.

## Status legend
✅ done · 🔜 next up · ⏳ planned · 🔒 blocked on input · ➿ continuous (cross-cutting)

---

## Phase 0 — Setup & foundation ✅ (done)

Tracking docs · decisions (stack, build-fresh, rule defaults) · reference (engine, spec, mockups, logo, forms) ·
GitHub connected · Next.js scaffold + i18n (he/RTL) + brand theme + **home page**.

---

## Phase 1 — Calculation engine ✅ (done)

| Session | Goal | Needs | Deliverables | Done when |
|---|---|---|---|---|
| **1A — Calc engine port** ✅ | Port the simulator math into a pure, testable module | simulator-engine.html (have) | `src/lib/calc/` (finance/route/mix/risk + `computeDial`) + typed `src/lib/contracts/`; **Vitest** parity tests vs simulator | ✅ 7/7 tests pass, numbers match simulator, tsc clean |

---

## Phase 2 — Manager / config backbone ⏳ (the new priority)

Stand up data + Supabase + the admin config that everything downstream reads.

| Session | Goal | Needs | Deliverables |
|---|---|---|---|
| **2A — Infra: Supabase + Prisma** | DB online | 🔒 Supabase project (URL + keys, **EU region** for Std 13) | Supabase Postgres wired via Prisma (pooler); `.env.example`; client/server helpers |
| **2B — Config data model + seed** | Single source of truth for config | simulator defaults (have) | Prisma models: `InterestRateTable` (housing + all-purpose, dated), `GlobalParameters` (index 3%/prime/anchors/FX), dial/clock templates, `RiskRule`, document-requirement lists; **seed** from simulator defaults |
| **2C — Auth + roles (Supabase)** | Protect admin; foundation for all roles | Supabase Auth | OTP via Supabase Auth, role model (customer/advisor/admin), RLS, admin route guard, admin login |
| **2D — Admin config UI** | Manager controls the system | mockups 4 & 6 | Dial/template editor (up to 10 tracks, %); rate-table editor (housing + all-purpose); global-params editor; monthly index update. All CRUD on Phase-2B data |

**Phase-2 exit:** an admin can log in and fully define the dials, rates, and parameters the engine will use.

---

## Phase 3 — Customer guest flow (Questionnaire → Dials) ⏳

Now consuming **real config** from Phase 2. No customer account yet (state in memory/URL).

| Session | Goal | Needs | Deliverables |
|---|---|---|---|
| **3A — Contracts + questionnaire engine** | Config-driven wizard framework | spec question tables (have) | Generic wizard (types: date/choice/yes-no/number/text/table/range; per-borrower; conditional logic; validation); typed `QuestionnaireAnswer` |
| **3B — New-mortgage questionnaire** | First variant | rule defaults (set) | New-mortgage config + UI (1–5 borrowers); LTV / age-85 / 40%-capacity validation |
| **3C — Dials screen** | The 5 שעונים | mockups 2 & 13 | Dials UI: monthly/total/interest+index, **speedometer** risk widget, detail charts (Chart.js), "select"; reads config + calc engine |
| **3D — Refinance variant** | מחזור + report upload | 🔒 sample bank reports (1/bank) | Refinance questionnaire; **bank-report parser** (adapter per bank, from simulator); existing-vs-new comparison (mockup 12) |
| **3E — Insurance intake (stub offers)** | Insurance questionnaire | — | Insurance variant; offers screen scaffold (premium calc → Phase 7) |

---

## Phase 4 — Customer accounts & personal area ⏳
Registration + 3 onboarding/purchase types (תמהיל+אישורים / ליווי אינטרנטי / יועץ אישי); consent screen; save guest
questionnaire on register; personal-area shell + tabs (personal data · mortgage data · אישור עקרוני · documents ·
collateral · messages); completion questions (spec lines 261–497). **Needs:** pricing + payment-gateway choice (🔒, UI hooks only).

## Phase 5 — Document upload ⏳
Dynamic required-doc list (loan type + borrower profile, spec lines 500–552); drag-drop + button; **Supabase Storage**
(encrypted, Std 13); advisor review (approve/reject → approved = links); manual doc requests.

## Phase 6 — Advisor panel ⏳
Self tasks; "my clients" sorted by follow-up / unread (mockup 8); status (before/in/after); full editable client mirror
(mockups 9–11); doc review; manual doc requirements; PDF export.

## Phase 7 — Insurance module 🔒
5 insurer offers; first/avg/total premium; **annual-reset premium calc** (payments 1,13,25…); gov.il rating;
existing-policy upload + savings; data-release consent (have). **Blocked on:** real **tariff tables** + (later) discount/occupation tables.

## Phase 8 — Post-mortgage tracking ⏳
Active mortgage: mix pie + per-track; running balances; **multi-draw "פעימות"** + upcoming-draw alerts; monthly
auto-update; alerts (refi opportunity / rate change / index rise). Mockups 12–13.

---

## ➿ Cross-cutting tracks (every session)
Security (Privacy Law **Std 13** — encrypted docs, RLS, no PII in git) · Accessibility (WCAG / Israeli std) ·
i18n structure (Hebrew-first, all strings in `messages/`) · Modularity (config-driven, single source of truth) ·
Testing · Responsive (desktop-first, mobile-friendly).

---

## 🔒 Open inputs still needed (and when they block)

| Needed | Blocks | When |
|---|---|---|
| **Supabase project** (URL + keys, EU region) | DB / auth / storage | Phase 2A |
| Sample bank balance reports (1 per bank, anonymized) | refinance parser | Phase 3D |
| Pricing per service + payment gateway choice | onboarding/payment | Phase 4 (UI hooks now) |
| Insurance tariff tables (+ discount/occupation later) | insurance offers | Phase 7 |
| gov.il ratings access method | insurer ratings | Phase 7 |

## Explicitly NOT building yet (per brief)
Real bank API integrations · payment gateway (UI hooks only) · mobile app · non-Hebrew languages (structure only) ·
insurance occupation/discount tables (stub hooks).
