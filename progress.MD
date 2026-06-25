# SimpleSave — Progress Log (progress.MD)

> Tracks every change made per session, where the project is headed, what's done, and what's left.
> **Update this at the end of (and during) every session** so the next chat knows exactly where we stand.
> Newest session at the top.

---

## Where the project is headed (the big picture)

SimpleSave: an Israeli mortgage comparison & management platform with 3 services
(New Mortgage, Refinancing/מחזור, Insurance), 3 roles (Customer, Advisor, Admin),
Hebrew-first RTL, config-driven, modular.

**Agreed build order** (one module at a time, user approval between each):
1. Questionnaire + Dials (guest flow)  ← *first target*
2. Registration + Personal Area shell
3. Document upload
4. Admin panel (dials + rates config)
5. Advisor panel
6. Insurance module
7. Post-mortgage tracking

---

## Overall checklist

- [x] Tracking files created (rules / architecture / progress)
- [x] Tech stack decided — Next.js (React+TS) + PostgreSQL + Prisma
- [ ] Reference data gathered (rates, doc lists, dial defs, formulas, sample bank reports)
- [ ] Project scaffold
- [ ] Module 1: Questionnaire + Dials (guest flow)
- [ ] Module 2: Registration + Personal Area shell
- [ ] Module 3: Document upload
- [ ] Module 4: Admin panel
- [ ] Module 5: Advisor panel
- [ ] Module 6: Insurance module
- [ ] Module 7: Post-mortgage tracking

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
