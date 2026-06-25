# SimpleSave — Progress Log (progress.MD)

> Tracks every change made per session, where the project is headed, what's done, and what's left.
> **Update this at the end of (and during) every session** so the next chat knows exactly where we stand.
> Newest session at the top.

---

## 📍 NEXT SESSION — START HERE (handoff, 2026-06-25)

**Read order before ANY work:** `rules.MD` → `architecture.MD` → `ROADMAP.md` → this file. Then act.
**Hard rules:** ASK before any `git commit`/`push` ([[ask-before-commit-push]]); ASK before starting a new module; keep it modular & config-driven; no hardcoded values/strings.

**Project in one line:** SimpleSave — Israeli mortgage comparison/management platform (new · refinance · insurance), 3 roles (customer/advisor/admin), Hebrew-first RTL, config-driven.
**Build order:** calc engine → manager/config backbone → customer flow → customer accounts.

**Done (Phases 0, 1, 2A, 2B, 2C; + Phase 3A/3B engine cores):**
- Next.js 16 app (App Router, TS, Tailwind 4, next-intl he/RTL) + home page. `npm run build` green.
- Pure calc engine `src/lib/calc` (+ `src/lib/contracts`) — 7/7 parity tests vs the simulator.
- Supabase (EU/Frankfurt) via Prisma 7 (pg driver adapter) — `src/lib/db.ts`.
- Config schema pushed + **seeded**: 5 dial templates, 18 rate bands, global params, 7 risk rules, 15 doc requirements.
- **Phase 3A + 3B engine cores (merged to `main`):** pure questionnaire engine (`src/lib/questionnaire`) + eligibility/repayment-capacity engine (`src/lib/eligibility`) + their contracts. 34/34 tests green, tsc clean.
- **Phase 2C (auth) — DONE:** Supabase email-OTP login (`/login`) · `Profile` + `UserRole` (customer/advisor/admin) · app-layer guards (`src/lib/auth`) · `/admin` gated by `proxy.ts` + `requireAdmin()`. Admin `ranaviv.cs@gmail.com` bootstrapped; RLS on `Profile` (defense-in-depth). **Guest calculator stays public.**

**▶ NEXT — Phase 2D:**
- **2D:** Admin config UI — CRUD over the seeded config (dial editor = mockup 4, rate tables = mockup 6, global params). Put it under `src/modules/admin`, rendered inside the now-guarded `/admin` area.
- Then **Phase 3** (customer flow) needs a **template→engine resolver**: map DB enums→Hebrew domain values, resolve anchor/margin from `RateBand`, and pick track years from `yearStep` via the optimizer (port the simulator's `calculateMixToRange`). (3A questionnaire engine + 3B eligibility core already merged.)
- **Auth for new admin pages:** place them under `/admin` (covered by `requireAdmin()` in `src/app/admin/layout.tsx`); re-check role in any server mutation (Prisma bypasses RLS).

**How to run (Windows; Bash + PowerShell tools available):**
- **First-time setup (REQUIRED before running, on EVERY machine):** copy **`.env.example` → `.env.local`** and fill in the team's shared Supabase keys + DB password. Everyone uses the SAME shared project (ref `iknokcilvdzbmevxhisy`, EU `eu-central-1`), so the values are identical for all teammates. Pooler host is **`aws-1-eu-central-1`**; `DATABASE_URL`=pooled 6543, `DIRECT_URL`=session pooler 5432; alphanumeric DB password. `.env.local` is gitignored — **never commit it** (Std 13).
- `npm install` (auto `prisma generate`) → `npm run db:push` → `npm run db:seed` → `npm run dev` (localhost:3000) → `npm test` → `npx tsc --noEmit`.

**Prisma 7 gotchas (newer than training — see AGENTS.md):** URLs live in `prisma.config.ts` (DIRECT_URL), not schema · runtime needs `@prisma/adapter-pg` (no `datasourceUrl`) · we added `postinstall: prisma generate` · using `db push` (not `migrate dev`, which needs a shadow DB awkward on the pooler).

**Open inputs/blockers:** sample bank reports → Phase 3D · pricing + payment gateway → Phase 4 · insurance tariff tables + gov.il ratings → Phase 7.
**Security TODO:** rotate the Supabase `service_role` key before real data (it passed through chat; tables empty now).

---

## ✅ Feature branches 3A/3B — MERGED to main (2026-06-25)

`feat/phase-3a-questionnaire-engine` then `feat/phase-3b-eligibility-engine` (stacked) were merged into `main`
in order 3A → 3B (fast-forward, **zero conflicts**). Post-merge on `main`: **34/34 tests pass, tsc clean.**
The remote feature branches can be deleted once `main` is pushed.

---

## Phase status (see ROADMAP.md for detail)

- [x] Phase 0 — Setup & foundation (scaffold, i18n/RTL, home page)
- [x] Phase 1 — Calculation engine (pure, parity-tested)
- [x] Phase 2A — Supabase + Prisma wired
- [x] Phase 2B — Config seeded
- [x] Phase 2C — Auth (OTP) + roles + admin guard
- [ ] Phase 2D — Admin config UI  ← **next**
- [~] Phase 3 — Customer guest flow: ✅ 3A questionnaire engine · ✅ 3B eligibility core · ✅ 3C resolver (config→engine) · ✅ new-mortgage questionnaire UI (`/questionnaire/new-mortgage`) · ✅ 3C dials UI (מסך השעונים) · ⏳ mortgage-data page (placeholder) · ⏳ refi/insurance questionnaires · ⏳ 3D refi · ⏳ 3E insurance
- [ ] Phase 4 — Customer accounts & personal area
- [ ] Phase 5 — Document upload
- [ ] Phase 6 — Advisor panel
- [ ] Phase 7 — Insurance module
- [ ] Phase 8 — Post-mortgage tracking

---

## Session 14 — 2026-06-26 — Phase 3C: dials screen (מסך השעונים) ✅

**Done — the 5-dial results screen after the new-mortgage questionnaire, driven by the resolver + calc engine.**
- **New module `src/modules/dials/`:** `DialsScreen` (fetches via a server action, loading/empty/error states, in-memory select + expand), `DialCard` (name · speedometer · 3 metrics · בחר שעון/פירוט), `Speedometer` (custom SVG gauge — 5 segments green→red, needle at `risk.level`, Hebrew `risk.label` inside, "קבל פירוט" link), `PaymentChart` (custom SVG: monthly-payment line + cumulative principal/interest stacked areas). No chart dependency.
- **`dialView.ts` (pure, tested):** `toDialCards` maps `ResolvedDial[]` → light card view-models, aggregating the per-track schedules into combined monthly + cumulative series (`interestAndIndexation = interest + indexation`).
- **`actions.ts` (`"use server"`):** `getDials(input)` = `loadDialsConfig()` → `resolveDials()` → `toDialCards()`. Verified end-to-end against the live DB: 5 dials resolve (clock1–5), metrics + risk + 240-pt chart series, all in-range for a ₪700k / 3k–8k request.
- **Wizard seam:** `QuestionnaireWizard` gained an optional `renderResult(answer, onReset)` (default = eligibility `ResultCard`); `NewMortgageWizard` passes it to show `<DialsScreen>` (loanAmount = value−equity, purpose from loan type, min/max from desired payment). Reusable for refi/insurance later.
- **Placeholder:** speedometer "קבל פירוט" → `/questionnaire/new-mortgage/mortgage-data` stub (the full mortgage-data page is the next module).
- All copy in `messages/he.json` (`dials.*`). `npx tsc --noEmit` clean; **58/58 tests** (incl. new `dialView.test.ts`); pages compile (200), demo redirect intact.
- **Bank of Israel rate (checked, not changed):** current BoI rate **3.75%** (cut 2026-05-25) → Israeli prime ≈ **5.25%**; seeded prime **4.56%** is stale by ~0.7pp. Rates are admin-editable config → update via Phase 2D / re-seed (shared DB left untouched per client choice).

**Not committed** — awaiting approval (per [[ask-before-commit-push]]).

**Next:** the mortgage-data page ("דף נתוני משכנתא") that "קבל פירוט" opens; or Phase 2D admin config UI (also lets the admin fix the stale prime).

---

## Session 13 — 2026-06-25 — Phase 3: new-mortgage questionnaire flow (real route) ✅

**Done — the production "משכנתא חדשה" guest flow at the real route, per the client's exact question spec.**
- **Route:** `/questionnaire/new-mortgage` (`src/app/questionnaire/new-mortgage/page.tsx`) — the home-page card now lands here (was a 404). `/demo/questionnaire` now 307-redirects to it.
- **Config:** `src/modules/new-mortgage/newMortgageQuestionnaire.ts` — questionnaire definition in spec order across 3 sections: (S1) loan type · property source · property value · equity; (S2, per-borrower, count 1–5) birth date · net income; (S3) additional income (ℹ️) · fixed expenses (ℹ️) · desired payment min/max. All copy in `messages/he.json` (`newMortgage.*`; shared UI `wizard.*`).
- **Effective LTV (two-question model):** `answerToEligibilityInput` maps loan type + property source → the engine's `PurchaseType`. Mechir LaMishtaken (a *source*) → 90% (min ₪100k equity); else the loan-type cap (single 75 / improvement 70 / additional & all-purpose 50). Loan amount is derived (value − equity); no separate loan question.
- **Cross-field gating (`validateNewMortgage`):** reuses the eligibility engine as the single source of truth — equity below the per-type requirement blocks "Next" with small red text (25% single / 30% improvement / 50% additional·all-purpose / 10%-but-≥₪100k Mechir); equity ≥ property value blocked (loan would be ≤ 0); desired max > 40% of net income blocked; min ≤ max enforced. A live "estimated loan = value − equity" line shows beside the equity field.
- **Borrowers step:** each borrower also has a **name** and an **"is the borrower the property owner?"** toggle. A non-owner is a non-mortgagor, so their income counts at 50% (engine `nonMortgagorIncomeFactor`) — drives the repayment-capacity math.
- **Wizard generalized:** `QuestionnaireWizard` now takes `{ questionnaire, mapToEligibility, extraValidate?, renderSummary? }` (one wizard for all variants — no duplication); domain errors are merged with the engine's static validation and shown live. Shared UI strings moved `demo.*` → `wizard.*`; `FieldInput` updated. Removed the superseded `sampleNewMortgage.ts`.
- **Added `vitest.config.ts`** (maps the `@/*` alias) so module tests can use `@/...` imports.
- **Verify:** `npx tsc --noEmit` clean (with Prisma client generated); **51/51 tests** (40 prior + 11 new in `newMortgage.test.ts`: LTV combos, equity gate, 40% cap, range order); `npm run dev` → `/questionnaire/new-mortgage` 200, `/demo/questionnaire` 307, spec strings render.

**Deferred (per spec):** additional-income / fixed-expenses per-row tables move to the Personal Area phase (stage 1 = single sum). Refi & insurance questionnaire content still to come; 3C dials UI consumes `resolveDials` next.

**Not committed** — awaiting approval (per [[ask-before-commit-push]]).

**Next:** 3C dials UI (mockups 2 & 13) on top of `resolveDials`, or Phase 2D admin config UI.

---

## Session 12 — 2026-06-25 — Phase 2C: Auth (email OTP) + roles + admin guard ✅

**Done — passwordless auth, role model, and a protected admin area. Guest flow untouched.**
- **Supabase clients** (`src/lib/supabase/{server,client,middleware}.ts`) via `@supabase/ssr` — cookie-based, SSR-safe.
- **`src/proxy.ts`** (Next 16 renamed the `middleware` convention → `proxy`): refreshes the session app-wide and redirects anonymous `/admin/*` hits to `/login`. Public routes (home/questionnaire/dials) pass through — **anonymous calculator stays open**.
- **Role model:** Prisma `Profile` (`id`=auth uuid · `email` · `role` `UserRole{CUSTOMER|ADVISOR|ADMIN}`) pushed to DB; single source of truth for authz.
- **App-layer guards** (`src/lib/auth/session.ts`): `getSessionUser`/`getProfile`/`requireUser`/`requireRole`/`requireAdmin`. Enforced in the app layer because Prisma's pooled connection **bypasses RLS** (RLS = defense-in-depth).
- **Login** (`/login` + `src/modules/auth`): email → OTP code → verify, via server actions (httpOnly session cookies). All copy in `messages/he.json` (`auth.*`); the header already linked here.
- **Admin area** (`/admin`): `layout.tsx` calls `requireAdmin()` (the real role gate) + logout; placeholder page for the 2D config UI (`admin.*` strings).
- **Bootstrap:** `npm run create-admin -- <email>` (service_role) → created auth user + Profile ADMIN for **ranaviv.cs@gmail.com** (id `73f29084…`). Idempotent (promotes existing users).
- **RLS:** `prisma/rls-profile.sql` — RLS on `Profile` + `profile_self_read` policy (applied & verified).
- **Env:** code now consumes `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` (already in `.env.example`). New deps: `@supabase/ssr`, `@supabase/supabase-js`.
- **Verify:** `npm run build` ✓ (`/` static, `/login` + `/admin` dynamic, Proxy active), `tsc` clean, **34/34 tests** green.

**Deferred (defense-in-depth, not blocking):** custom access-token hook to put `role` in the JWT (for direct-client/RLS authz); per-role RLS on the config tables. The app-layer guard is the primary control.

**Not committed** — awaiting approval (per [[ask-before-commit-push]]).

**Next:** Phase 2D — admin config UI (CRUD over seeded config) under the guarded `/admin`.

## Session 12 — 2026-06-25 — Phase 3C (part 1): dial resolver (config→engine) ✅

**Done — the bridge from seeded config to the calc engine. Pure + tested. NO UI yet (next step).**
- `src/lib/dials/` (branched off `main` `0e8294f`, which already has 3A/3B):
  - `contracts.ts` — config DTOs (decoupled from Prisma) + `ResolveDialsInput` / `ResolvedDial`.
  - `rates.ts` — enum maps (DB→engine Hebrew), `rateBandKey`, `allowedYears`/`candidateYears`, `resolveRate` (ports the simulator's `generalRateKey` / `allowedYears` / `generalRateForRoute`).
  - `optimizer.ts` — `optimizeYears` (port of `calculateMixToRange`: coarse sweep + local refine + shorten-fixed) — fits track terms so the mix's first payment lands in a desired range.
  - `resolver.ts` — `resolveDials` / `resolveDial`: split loan by share → optimize terms → resolve rates → `computeDial` (mix + risk).
  - `loadConfig.ts` — the ONLY DB file (Prisma → DTOs), keeping the resolver pure.
  - `index.ts` barrel + `dials.test.ts`.
- **6 tests** (allowed terms by `yearStep`, rate-band key mapping, end-to-end clock1: shares→amounts, rate resolution, optimizer in-range, risk). **40/40 total pass**, tsc clean.
- Config-driven & pure: reads rate bands / global params / dial templates from config; no hardcoding; DB isolated in `loadConfig`.

**Next (NOT in this branch):** 3C dials **UI** (mockups 2 & 13) consumes `resolveDials`. Branch `feat/phase-3c-dial-resolver`, off latest `main` (merges cleanly).

---

## Session 11 — 2026-06-25 — Merge 3A+3B to main · env.example · 2nd-machine onboarding ✅

**Done — parallel branches landed on `main` + a fresh machine brought online.**
- Cloned `main` to a new machine and recreated `.env.local` from the shared Supabase values. **Pooler host corrected to `aws-1-eu-central-1`** (was the unknown in setup); both pooled (6543) + session (5432) verified — `DialTemplate` reads back 5 rows.
- Merged `feat/phase-3a-questionnaire-engine` → `feat/phase-3b-eligibility-engine` into `main` (order 3A→3B, fast-forward, **zero conflicts**). `main` now carries the questionnaire + eligibility engines. **34/34 tests, tsc clean.**
- Added a tracked **`.env.example`** template (un-ignored via `!.env.example` in `.gitignore`) so a fresh clone has the env scaffold to fill — **no secrets committed**. Onboarding step documented in the handoff "First-time setup" above.

**Next:** Phase 2C (Supabase Auth/OTP + roles + admin route guard), per build order. (3A/3B engine cores done; 3B questionnaire *content* + `QuestionnaireAnswer → EligibilityInput` adapter + 3C dials still to come.)

## Session 11 — 2026-06-25 — Phase 3A UI: questionnaire wizard **DEMO** ✅

**Done — a labeled DEMO that shows the 3A + 3B engines working in the browser. NOT the production customer flow.**
- Route: `/demo/questionnaire` (`src/app/demo/questionnaire/page.tsx`) — under `/demo`, with a visible "🚧 הדגמה בלבד" badge + subtitle so it can't be mistaken for the real UI.
- `src/modules/questionnaire/`: `QuestionnaireWizard.tsx` (client wizard — steps, 1–5 borrowers, conditional fields, live validation), `FieldInput.tsx` (generic field renderer + hover tooltips via the engine's `helpKey`), `sampleNewMortgage.ts` (sample questionnaire + `answerToEligibilityInput` mapper).
- `messages/he.json` — `demo.*` strings (labels, help tooltips, results). No hardcoded strings.
- On submit it runs the 3B eligibility engine and shows max loan / required equity / capacity / term + violations.
- **In-memory only** (no DB, no auth). Sample questions are placeholders — real per-variant content + dials (3C) need Phase-2 config.
- Verified: `next dev` serves it (HTTP 200, RTL Hebrew, no runtime errors); `tsc` clean (except the env-only `db.ts`); 34 engine tests still pass.

**Branch:** `feat/phase-3a-wizard-ui`, stacked on `feat/phase-3b-eligibility-engine` (→ merge order: 3A → 3B → this, if it's merged at all; it's a demo).

---

## Session 10 — 2026-06-25 — Phase 3B (core): eligibility & repayment-capacity engine ✅

**Done — pure eligibility engine. Parallel track, branched off main `c88b98a`. Standalone like the calc engine — no DB, no questionnaire dependency.**
- `src/lib/contracts/eligibility.ts` — typed contracts: `PurchaseType` (single / additional / allPurpose / housingImprovement / mechirLamishtaken), `EligibilityBorrower`, `EligibilityInput`, `EligibilityLimits` (every regulatory limit, resolved from config), `EligibilityResult` (+ `EligibilityViolation`).
- `src/lib/eligibility/`:
  - `income.ts` — `qualifyingIncome` (non-mortgagor income ×0.5, +extra −fixed, floored 0), `maxMonthlyPayment` (×ratio), `withinCapacity`.
  - `property.ts` — `ltvCapFor`, `maxLoanByLtv`, `requiredEquity` (LTV complement; 25% floor unless exempt; ₪ floor), `maxLoanAmount`.
  - `age.ts` — `ageInYears`, `oldestAge`, `maxLoanTermYears` (capped by age 85 of the oldest borrower).
  - `index.ts` — `assessEligibility` + `DEFAULT_ELIGIBILITY_LIMITS` (mirrors the Phase-2B seeded `GlobalParameters`) + barrel.
- `messages/he.json` — added an `eligibility.*` namespace (engine emits keys only; Hebrew text here = single source of truth).
- **Config-driven & pure:** every limit (LTV caps, 40% ratio, age 85, 25%/₪100k equity, non-mortgagor 0.5) is a parameter resolved from config — defaults match the seed. No hardcoding, no I/O.
- **Tests:** `src/lib/eligibility/eligibility.test.ts` — 14 tests (income weighting, LTV/equity per purchase type, Mechir ₪100k floor, age/term cap, every violation path, custom-limit override). **21/21 total pass** (calc + eligibility); my files `tsc`-clean.

**Scope:** the eligibility *core* of Phase 3B. The `QuestionnaireAnswer → EligibilityInput` adapter + the new-mortgage questionnaire definition come next (they build on the Phase-3A contracts — separate branch/PR). Did **not** build 3C (dials — needs Phase-2 rate tables).

**Spec point to confirm:** Mechir-LaMishtaken "min ₪100k" is implemented as a minimum *equity* amount (≈10%); confirm it isn't a min *loan* amount.

**Not committed** — on branch `feat/phase-3b-eligibility-engine`, awaiting approval (per [[ask-before-commit-push]]).

---

## Session 9 — 2026-06-25 — Phase 2B: config seeded ✅

**Done — config backbone populated from simulator defaults & verified.**
- `prisma/seed.mjs` (run via `npm run db:seed`): idempotent (clears + re-inserts config tables).
- Seeded: **1** GlobalParameters · **18** RateBand (9 housing + 9 all-purpose) · **5** DialTemplate · **25** DialTrack · **7** RiskRule · **15** DocumentRequirement.
- Values verified by read-back: clock1 = 17/17/30/15/21 (matches CLOCK_TEMPLATES); params index 0.03 / prime 0.0456 / maxRepay 0.40 / age 85 / lookback 7.
- Hebrew↔enum mapping in seed (ללא→NONE, מדד→CPI, fixed→FIXED, …). DialTrack stores yearStep (the optimizer picks actual years later, in Phase 3).

**Not committed** — awaiting approval (per [[ask-before-commit-push]]).

**Next:** Phase 2C — Supabase Auth (OTP) + roles + admin route guard, then 2D — admin config UI (CRUD over this seeded data). Then Phase 3 customer flow consumes it.

---

## Session 9 — 2026-06-25 — Phase 3A: questionnaire engine (framework) ✅

**Done — the pure, config-driven questionnaire framework. Parallel track to the coworker's Phase 2B (no file overlap).**
- `src/lib/contracts/questionnaire.ts` — typed contracts: `Questionnaire` / `QuestionnaireSection` / field union (text · number · date · yesno · choice · range · table) · `Condition` (all/any/not + field operators, `global`/`borrower`/`auto` scope) · `QuestionnaireAnswer` (`values` + `borrowers[]`) · `ValidationError`.
- `src/lib/questionnaire/`:
  - `conditions.ts` — `evalCondition` (boolean expression tree; ops eq/ne/in/gt../includes/truthy/empty…; scope resolution) + `isEmptyValue`.
  - `validation.ts` — `validateField` (per-type constraints → `ValidationError` carrying an i18n `messageKey` + interpolation params, **never raw text**). `minRows`/`minSelected` act as effective "at least N" gates for config authors.
  - `engine.ts` — answer construction (`createEmptyAnswer`, `setBorrowerCount` clamped 1–5), visibility (`visibleSections`, `renderableFields` with per-borrower expansion), validation (`validateSection`, `validateQuestionnaire`, `isComplete`, `firstInvalidSectionIndex`).
  - `index.ts` — barrel.
- `messages/he.json` — added a `validation.*` namespace (engine emits keys only; Hebrew text lives here = single source of truth, i18n-ready).
- **Tests:** `src/lib/questionnaire/questionnaire.test.ts` — 13 tests (operators + scope, visibility, per-borrower expansion, every field type, conditional table with nested row errors, completeness). **20/20 total pass** (calc + questionnaire); my files are `tsc`-clean.
- **Pure** — no React/Next/DB imports; the eventual wizard UI renders on top of these helpers. Output `QuestionnaireAnswer` is the typed contract the Phase-1 calc engine consumes.

**Scope boundary (per ROADMAP):** built **3A only** (the framework). Did **not** build 3B (new-mortgage question content) or 3C (dials screen) — those consume real Phase-2 config (dial templates, rate tables) the coworker is defining now.

**Env note:** `node_modules` was empty → ran `npm install`. The `prisma generate` postinstall fails locally without `.env.local` (Supabase), so `src/lib/db.ts` shows a `tsc` error **on my machine only** — it's the coworker's Phase-2 file with a generated client, clean on theirs. Reverted the incidental `package-lock.json` churn from the install.

**Not committed** — on branch `feat/phase-3a-questionnaire-engine`, awaiting approval (per [[ask-before-commit-push]]).

**Next:** on user go-ahead — commit + open a PR for 3A. Then 3B (new-mortgage questionnaire config + UI) once Phase 2 config lands.

---

## Session 8 — 2026-06-25 — Phase 2A: Supabase + Prisma wired ✅

**Done — DB layer live and verified end-to-end.**
- Supabase project: **EU region (eu-central-1 / Frankfurt)**, ref `iknokcilvdzbmevxhisy`. (Sydney project recreated in EU for Std 13.)
- `.env.local` filled (gitignored): Supabase URL/anon/service + pooled `DATABASE_URL` (6543) + session `DIRECT_URL` (5432).
- **Prisma 7 specifics handled (newer than training — see AGENTS.md):**
  - Connection URLs moved to `prisma.config.ts` (CLI/migrations use `DIRECT_URL`); schema datasource is provider-only.
  - Runtime uses a **driver adapter** (`@prisma/adapter-pg`) with the pooled URL — `datasourceUrl`/`datasources` constructor options were removed in v7.
  - Added `postinstall: prisma generate` (v7 removed the auto post-install hook).
- `prisma/schema.prisma` — config-backbone models pushed to DB via `prisma db push`: GlobalParameters, RateBand, DatedRate, DialTemplate, DialTrack, RiskRule, DocumentRequirement (+ enums).
- `src/lib/db.ts` — Prisma singleton via pg adapter (pooled). Verified: `select 1` ok + table count works through the pooler.
- `tsc` clean, 7/7 calc tests still pass.

**Gotchas logged:** DB password with `!` failed (encoding ambiguity) → reset to alphanumeric; password reset needs ~30–60s to propagate to the pooler (P1000/P1001 until it does). Direct connection is IPv6-only on this network → using session pooler (5432) for `DIRECT_URL`.

**Security TODO (client):** rotate the `service_role` key before real data (it was pasted in chat). Tables are empty; low risk now.

**Not committed** — awaiting approval (per [[ask-before-commit-push]]). (`.env.local` is gitignored, won't be committed.)

**Next:** Phase 2B — seed the config from simulator defaults (5 dial templates, rate bands, global params, risk rules, doc requirements) via `prisma/seed.mjs`.

---

## Session 7 — 2026-06-25 — Phase 1A: calc engine ported ✅

**Done — the pure calculation engine, parity-tested against the simulator.**
- `src/lib/contracts/mortgage.ts` — typed contracts (MortgageTrack, MixParams, RouteResult, MixResult, RiskRule, RiskResult). Domain values kept in Hebrew to match simulator + bank parser.
- `src/lib/calc/`:
  - `finance.ts` — `num`, `PMT`
  - `route.ts` — `calcRoute` (Shpitzer & Equal-Principal, CPI/FX linkage, balloon/grace, daily interest) — **annual-index mode** (actual-monthly-index is a later post-mortgage feature)
  - `mix.ts` — `calcMix` (aggregates: firstPay, total, interest, indexation, avgRate/Years, maxN)
  - `risk.ts` — `defaultRiskRules` + `mixRisk` (share-weighted 1–5, labels)
  - `index.ts` — barrel + `computeDial(tracks, params, rules)` convenience
- Engine is **pure** (no UI/DB/I-O), consumes RESOLVED rates (rate-table lookup deferred to Phase 2 config).
- **Verification:** built a throwaway Node "oracle" from the simulator's exact functions → captured ground-truth numbers → `calc.test.ts` asserts the port matches (+ independent closed-form Shpitzer check). **7/7 tests pass**; `tsc --noEmit` clean. Oracle deleted (numbers baked into tests with provenance).

**Not committed** — awaiting approval (per [[ask-before-commit-push]]).

**Next:** Phase 2A — Supabase + Prisma (🔒 needs the client's Supabase project: URL + keys, EU region). Or, if preferred, do Phase 3A (questionnaire engine) which doesn't need the DB.

---

## Session 6 — 2026-06-25 — Roadmap + re-sequenced build order + Supabase

**Decisions (client):**
- **Build order changed** to **engine → manager/config backbone → customer flow → customer accounts**
  (was guest-flow-first). Rationale: config-driven system — customer dials consume admin-defined config, so build
  that backbone first, no throwaway seeding. Calc engine stays first (pure, order-independent).
- **Database = Supabase**, used for **Postgres + Auth(OTP) + Storage** (+ RLS for roles). EU region for Std 13.
  Prisma talks to Supabase Postgres via the pooler; Supabase Auth handles OTP; Supabase Storage handles documents.
  Supabase Auth is set up in the backbone phase so the admin area is protected (full customer registration/personal
  area stays a later phase).

**Done:** wrote `ROADMAP.md` (session-by-session: goal / needs / done-when), re-sequenced for the above; linked in
README; synced architecture.MD (stack + order).

**Not committed** — awaiting approval (per [[ask-before-commit-push]]).

**Next:** commit roadmap+doc updates, then **Phase 1A — calc engine port** (pure TS + Vitest parity tests vs the
simulator). Phase 2A (Supabase) is blocked until the client creates the Supabase project (URL + keys, EU region).

---

## Session 5 — 2026-06-25 — Scaffold + home page (build green)

**Done**
- Scaffolded Next.js app into `simplesave/` (generated in temp `ss-scaffold`, merged in to preserve git/README).
- Versions (NEWER than training data — see AGENTS.md): **Next 16.2.9 · React 19.2 · Tailwind 4 · next-intl 4 · Prisma 7**.
- Installed deps: next-intl, @prisma/client, prisma (dev), vitest (dev). `npm install` clean.
- **i18n (next-intl, Hebrew-first, no URL routing yet):**
  - `src/i18n/config.ts` (locales/dir — single source for adding ru/fr/en later)
  - `src/i18n/request.ts` (getRequestConfig → he + messages)
  - `next.config.ts` wraps `createNextIntlPlugin`
  - `messages/he.json` (common/home/services strings)
- **Layout/theme:** root `layout.tsx` = `lang=he dir=rtl`, Heebo font, NextIntlClientProvider; `globals.css` brand theme (blue/white/black tokens via Tailwind `@theme`). Logo → `public/logo.png`.
- **Home page** (mockup 3): `src/app/page.tsx` + `src/components/layout/SiteHeader.tsx` + `src/modules/home/ServiceCard.tsx`. Hero + 3 service cards → link to `/questionnaire/{new-mortgage|refinance|insurance}`.
- `npm run build` ✅ compiles, typechecks, prerenders.
- package.json renamed to `simplesave`; added test/prisma scripts.

**Not yet committed** — awaiting approval (per [[ask-before-commit-push]]).

**Next (Module 1 continued):** calc-engine port (`src/lib/calc/`, pure + Vitest tests vs simulator numbers) → typed contracts (`src/lib/contracts/`) → questionnaire wizard → dials screen. No DB/auth yet (guest flow).

---

## Session 4 — 2026-06-25 — Key decisions resolved + consent forms received

**Client rulings (now binding):**
1. **No separate JS files exist** — stop waiting on document-engine.js / insurance-rates.js / document-worker.js.
   The simulator HTML is the source of truth. *(Caveat: the actual insurance tariff numbers were in the external
   insurance-rates.js, which we don't have. Re-confirm/obtain the real tariff tables when we reach the Insurance
   module — module 6, late in build order. Not blocking now.)*
2. **Discrepancies are non-issues** — values are config-driven anyway. Defaults set as admin-editable params:
   max repayment **40%**, loan-term age cap **85**, credit-history lookback **7 years**. No longer "open."
3. **No existing prototype to port** — only on Base44 (no access). → **BUILD FRESH in Next.js.**
   Engine = port the simulator's calc logic; requirements = the spec; design = the mockups.

**Received & committed:** 7 consent/authorization PDFs → `assets/forms/`
- Bank authorization (כתב הסמכה): Leumi, Hapoalim (2 versions), Mizrahi, Discount, Beinleumi.
- Self-employed income form: אישור רו"ח (לשכת רו"ח nusach).
- (Not yet provided, may be needed later: authorization forms for Jerusalem / Mercantile / Otzar HaChayal / Igud; insurance data-release consent form.)

**Status: effectively unblocked to start building.** Next step = plan the architecture/scaffold + Module 1
(Questionnaire + Dials guest flow), pending client go-ahead per rules.MD #3.

---

## Session 3 — 2026-06-25 — Mockups reviewed + repo initialized

**Done**
- Viewed all 13 mockup images embedded in the spec docx. Map:
  1 admin dashboard (clients/leads) · 2 dials new-mortgage · 3 home page · 4 admin clock/template editor ·
  5 admin advisors · 6 rate-tables editor · **7 LOGO** · 8 advisor dashboard · 9 advisor client profile ·
  10 admin client mortgage-data · 11 advisor client summary (+PDF) · 12 dials refinance (before/after) · 13 summary charts.
- **Key observation:** mockups 1–3,5,8–12 are screenshots of a polished LIGHT-theme React-style RUNNING app (address bar shows `/AdvisorArea`). A working SimpleSave prototype likely already exists → decide PORT vs REBUILD before scaffolding. Mockups 4 & 6 are the dark-theme simulator (the engine HTML).
- Blanks filled: **logo** (saved `assets/logo.png`) + **visual design language** (blue/white light theme, speedometer dials, tab layouts).
- **Git repo initialized** in `simplesave/` (branch `main`): added `.gitignore` (excludes env/uploads/PII), `README.md`.
- Copied all client reference material into `assets/reference/` (simulator-engine.html, system-design-spec.docx, mockups/01–13) — committed for continuity.
- `gh` CLI not installed; using plain git over HTTPS.

**GitHub connected** ✅
- Remote: https://github.com/Ranavivcs/SimpleSave (origin, branch `main`).
- Remote had a stub `# SimpleSave` README; merged with `--allow-unrelated-histories -X ours` (kept our richer README), pushed `4f05b21`.

**Open / blocked**
- ⚠️ 3 discrepancies still unresolved (repayment %, age cap, credit lookback) — see Session 2.
- Still missing attachments: insurance rate Excel, the 3 JS files (document-engine.js / insurance-rates.js / document-worker.js), consent PDFs.
- **New decision raised:** is there an existing prototype codebase we should port, given the mockups are of a running app?

---

## Session 2 — 2026-06-25 — Master spec received

**Artifact received: `עיצוב מערכת 6.26((.docx`** — the full SimpleSave system-design / requirements doc (736 lines text + 13 embedded mockup images, extracted to temp).
This is the platform spec that wraps the engine (the HTML simulator). Together they cover ~all of the system.

**Blanks now filled by the spec:**
- Home/About + tagline "SimpleSave – פשוט לחסוך".
- All 3 entry flows + 3 onboarding/purchase types (תמהיל+אישורים / ליווי אינטרנטי / יועץ אישי), each with distinct screen sequence & locks.
- Personal area tabs: personal data · mortgage data · אישור עקרוני (bank principal-approval / rate tender) · documents · collateral (בטחונות) · messages to advisor.
- Full questionnaires (new / refi / insurance) field-by-field: type, per-borrower flag, conditions — plus personal-data & mortgage-data completion questions (doc lines 261–497).
- Document requirement list, dynamic, with conditions + required-to-proceed flags (lines 500–552).
- Admin area: dial/template config, market-rate tables (housing & all-purpose), global params (index/prime/anchor/FX), lead→advisor assignment, monthly index update.
- Advisor area: self tasks, "my clients" sorted by follow-up date / messages, client status (before/in/after process), full editable client mirror.
- Post-mortgage area: pie of mix + per-track + running balances (principal/interest/index paid, payments remaining) + multi-draw "פעימות" with alerts.
- Annex A glossary; Annex B per-bank balance-report extraction steps + call-center phones; parser keyword list (lines 724–736) — explains the HTML bank adapters.

**Business rules confirmed/refined (single source of truth → put in config):**
- LTV: single 75% / additional 50% / all-purpose 50% / שיפור דיור 70% / מחיר למשתכן 90% (min ₪100k = ~10% equity).
- Min equity 25% (except Mechir LaMishtaken).
- Non-owner (לא ממשכן) borrower → only 50% of net income counts toward capacity.
- Eligibility (זכאות משרד השיכון): implement "ותיקים בארץ" track ONLY for now. Link: gov.il/he/pages/mortgage_guide.
- Expected annual index default 3%.
- Insurance: premium resets annually at payments 1,13,25…; by age+gender+smoker+opening principal; ratings from gov.il/he/pages/service_index_all; rate tables from attached Excel (mortgage tariffs only); STUB discount + occupation tables.

**⚠️ OPEN DISCREPANCIES — need client ruling (do not code until resolved):**
1. Max repayment ratio: 38% (doc line 113) vs 40% (line 127 + brief). 
2. Loan-term age cap: 85 (new) vs refi table 80 (line 148) vs refi text 85 (line 180).
3. Credit-history lookback: 7 years (line 380) vs 5 years (line 275).

**Still missing (referenced as "צירפתי" attachments, not provided):**
- Insurance rate Excel (may overlap with insurance-rates.js).
- JS files: document-engine.js, insurance-rates.js, document-worker.js.
- Consent/authorization PDFs: כתבי הסמכה, insurance data-release form, self-employed רו"ח income forms.
- Logo + brand hex.
- (Have: 13 mockup images extracted from docx — available to view for screen layout reference.)

**Plan impact:** spec + engine together are enough to design the full module map & data model. Next: resolve the 3 discrepancies, get remaining attachments, then propose scaffold + Module 1 (Questionnaire + Dials).

---

## Session 1 — 2026-06-25 — Kickoff

**Done**
- Reviewed the full SimpleSave developer briefing.
- Created project folder `simplesave/` (kept separate from the unrelated `interview-prep-bot/`).
- Created `rules.MD` — working contract + reading order + modularity/compliance rules.
- Created `architecture.MD` — layers, modules, entities, pending decisions.
- Created `progress.MD` — this file.

**Open questions raised with the user (blocking build)**
- Tech stack (FE framework / backend / DB / hosting).
- Reference data needed before coding the calc engine & dials:
  - Interest rate tables (housing & all-purpose) by track type/term.
  - The 5 default dial/mix definitions and their tracks.
  - Exact Shpitzer / Equal-Principal formulas + risk-score definition.
  - Document requirement lists per loan type / borrower profile.
  - Insurance company list + Finance Ministry rating source (gov.il link).
  - Sample bank mortgage reports (1 per bank) for the parser adapters.
  - Logo + exact brand hex values (blue/white/black).

**Decisions made**
- Tech stack: **Next.js (React + TypeScript) + PostgreSQL + Prisma**. Hosting TBD.
- Reference data: client will **send files next** before we build the calc engine.

**Next steps**
- ⏳ Awaiting reference files from client (rate tables, 5 dial defs, formulas + risk-score
  definition, document lists, insurance company list/gov.il source, sample bank reports, branding).
- Once received (or enough to start): scaffold the Next.js project → start Module 1
  (Questionnaire + Dials, guest flow).

**Notes**
- No application code written yet — by design (rules.MD: ask before building).

**Reference artifact received: `סימולטור_משכנתא.html`** (client's existing working simulator, 3309 lines)
- It is a complete, **validated** single-file mortgage-mix calculator (advisor/admin internal tool).
- Fills these blanks:
  - **5 dial definitions** → `CLOCK_TEMPLATES` clock1–5 (exact track mix + %). *These are the 5 dials.*
  - **Shpitzer & Equal-Principal formulas** → `PMT()` + `calcRoute()` (incl. CPI/FX linkage, balloon, grace, daily interest).
  - **Risk-score / speedometer** → `defaultRiskRules()` + `mixRisk()` (share-weighted 1–5, labels נמוכה→גבוהה מאוד).
  - **Rate tables** → `generalRateBands` (housing) / `allPurposeRateBands` / `datedRateBands`; defaults fixed 4.62% / variable 4.70% / prime 4.56%.
  - **Bank-report parser adapters** → Hapoalim, Mizrahi-Tefahot, Discount, Leumi, FIBI + CSV/TXT/JSON fallback.
  - **Refi comparison** → `buildProposalsFromCurrentMortgage()` (5 proposals vs current).
  - Bonus: early-repayment (היוון) fee calc, building-insurance template, full סילוקין schedules.
- Does NOT cover: platform/auth/roles/personal area/registration/OTP/multi-language, branding (uses dark theme not blue/white/black), insurance company list + gov.il ratings, document requirement lists.
- **Still missing (referenced by the HTML, not provided):** `document-engine.js`, `insurance-rates.js`, `document-worker.js`. Requested from client.

**Plan impact:** calc engine + dials + bank parser are effectively done & validated → task shifts to PORTING this proven engine into a clean typed/testable module, then building the platform around it.
