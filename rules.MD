# SimpleSave — Working Rules (rules.MD)

> **READ THIS FILE BEFORE ANY CHANGE TO THE CODE OR ANY PROJECT FILE.**
> This is the contract for how work is done on SimpleSave. It overrides convenience.

---

## 0. The Reading Order (do this before touching anything)

Before any change/update to the code:

1. **Read `rules.MD`** (this file) — the guidelines you must follow.
2. **Read `architecture.MD`** — to understand the layer/module you are about to touch and how it connects to others.
3. **Read `progress.MD`** — to know the current state, what's done, and what's in flight.
4. **Then act** according to what those files tell you.

After any change, **update `progress.MD`** (always) and **`architecture.MD`** (if the structure/interfaces changed).

---

## 1. Core Rules (from the client)

1. Before any change to the code, go over this `rules.MD`.
2. Before any change/update, make sure you are **not duplicating something that already exists** or breaking something relevant to another part of the system. Search first.
3. Before any change/update to the code, **ask the user.** Do not implement a module or make non-trivial changes without explicit go-ahead.
4. Before any change/update, **read the relevant MD** per the reading order above.
5. **Keep the code modular** — understandable, efficient, and easy to change or extend in the future.

---

## 2. Modularity & Separation (non-negotiable)

- **Every screen, every calculator, every role area is an independent, swappable module.**
- **Nothing is hardcoded in more than one place.** A value, rule, or string lives in exactly one source of truth.
- **Clean interfaces between modules.** Modules communicate through typed data objects, not by reaching into each other's internals:
  - Questionnaire → produces a typed answer object.
  - Calculator → consumes that object, produces a typed result.
  - Dials → display the result.
  - No direct coupling between these layers.
- **The calculation engine is a standalone, testable service** with no UI or DB dependencies. Pure business logic in, pure result out.
- **Config-driven, not code-driven.** Interest rate tables, document lists, dial definitions, and global parameters come from the database/config and are editable by admin. Never hardcode them in components.

---

## 3. Before You Write — Checklist

- [ ] Did I read rules / architecture / progress?
- [ ] Did I search the codebase to confirm this thing doesn't already exist?
- [ ] Does this belong in an existing module, or is it genuinely new?
- [ ] Am I introducing a hardcoded value that should be config? (If yes — stop, make it config.)
- [ ] Does this change any cross-module interface? (If yes — note it, update architecture.MD, flag to user.)
- [ ] Did the user approve this scope?

---

## 4. Domain & Compliance Constraints (must always hold)

- **Language:** Hebrew-first, RTL. Architecture must support future languages (Russian, French, English) — **no hardcoded user-facing strings**; everything goes through i18n.
- **Security:** Israeli Privacy Protection Law **Standard 13**. OTP auth, role-based access, encrypted document storage.
- **Accessibility:** Full WCAG / Israeli disability standard compliance. Every UI module must be accessible.
- **Responsive:** Desktop-first, mobile-friendly.
- **Color scheme:** blue, white, black.

### Validation rules that must be enforced consistently (single source of truth)
- Max loan-to-value: **75%** primary / **50%** additional or all-purpose / **90%** government "Mechir LaMishtaken".
- Max monthly repayment: **40%** of net income, where net = (all borrowers' net + extra income) − fixed expenses.
- Loan term capped at **age 85** of the oldest borrower.
- Borrowers supported: **1–5**.

---

## 5. Build Order (do not build everything at once)

Build incrementally, in this order, **one module at a time, with user approval between each**:

1. Questionnaire + Dials (guest flow)
2. Registration + Personal Area shell
3. Document upload
4. Admin panel (dials + rates config)
5. Advisor panel
6. Insurance module
7. Post-mortgage tracking

**Not yet (stub hooks only):** real bank API integration, payment gateway, mobile app, non-Hebrew languages, insurance occupation/discount tables.

---

## 6. Asking the User

- If scope is unclear, **ask before implementing.**
- The **client controls the pace.** Do not run ahead to the next module without a green light.
- Surface trade-offs with a recommendation, not an open-ended menu.

---

## 7. After Every Change

- Update `progress.MD` (what changed, why, what's next).
- Update `architecture.MD` if any structure, module boundary, or interface changed.
- Never leave the tracking files stale — they are how the next session understands the project.
