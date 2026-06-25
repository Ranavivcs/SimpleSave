import { describe, expect, it } from "vitest";
import type { Questionnaire } from "../contracts/questionnaire";
import { evalCondition } from "./conditions";
import {
  createEmptyAnswer,
  setBorrowerCount,
  globalContext,
  borrowerContext,
  renderableFields,
  validateQuestionnaire,
  isComplete,
  firstInvalidSectionIndex,
} from "./engine";

/**
 * A synthetic questionnaire exercising every field type, per-borrower fields,
 * a conditional field, a conditional table, and borrower- vs global-scope
 * conditions. (Real new/refi/insurance content lands in phase 3B.)
 */
const q: Questionnaire = {
  id: "test",
  variant: "new",
  titleKey: "t.title",
  minBorrowers: 1,
  maxBorrowers: 5,
  sections: [
    {
      id: "loan",
      titleKey: "t.loan",
      fields: [
        {
          id: "purpose",
          type: "choice",
          labelKey: "k",
          required: true,
          options: [
            { value: "buy", labelKey: "k" },
            { value: "refi", labelKey: "k" },
          ],
        },
        { id: "price", type: "number", labelKey: "k", required: true, min: 100000, max: 10000000 },
        { id: "hasExtra", type: "yesno", labelKey: "k" },
        {
          id: "extraAmount",
          type: "number",
          labelKey: "k",
          required: true,
          min: 0,
          visibleWhen: { field: "hasExtra", op: "truthy", scope: "global" },
        },
        {
          id: "loans",
          type: "table",
          labelKey: "k",
          minRows: 1,
          maxRows: 3,
          visibleWhen: { field: "purpose", op: "eq", value: "refi", scope: "global" },
          columns: [
            { id: "bank", type: "text", labelKey: "k", required: true },
            { id: "balance", type: "number", labelKey: "k", required: true, min: 0 },
          ],
        },
      ],
    },
    {
      id: "borrowers",
      titleKey: "t.borrowers",
      fields: [
        { id: "fullName", type: "text", labelKey: "k", required: true, perBorrower: true, minLength: 2 },
        { id: "birth", type: "date", labelKey: "k", required: true, perBorrower: true, max: "2010-01-01" },
        { id: "income", type: "range", labelKey: "k", perBorrower: true, min: 0, max: 100000 },
        { id: "selfEmployed", type: "yesno", labelKey: "k", perBorrower: true },
        {
          id: "incomeDocs",
          type: "choice",
          labelKey: "k",
          multiple: true,
          perBorrower: true,
          minSelected: 1,
          options: [
            { value: "p1", labelKey: "k" },
            { value: "p2", labelKey: "k" },
          ],
          // borrower-scoped: shown only for self-employed borrowers
          visibleWhen: { field: "selfEmployed", op: "truthy", scope: "borrower" },
        },
      ],
    },
  ],
};

describe("answer construction", () => {
  it("createEmptyAnswer seeds one borrower and empty maps", () => {
    const a = createEmptyAnswer(q);
    expect(a.borrowerCount).toBe(1);
    expect(a.borrowers).toHaveLength(1);
    expect(a.values).toEqual({});
    expect(a.variant).toBe("new");
  });

  it("setBorrowerCount clamps to [min,max] and preserves data", () => {
    let a = createEmptyAnswer(q);
    a.borrowers[0].fullName = "אבי";
    a = setBorrowerCount(q, a, 3);
    expect(a.borrowerCount).toBe(3);
    expect(a.borrowers).toHaveLength(3);
    expect(a.borrowers[0].fullName).toBe("אבי"); // preserved
    expect(a.borrowers[1]).toEqual({}); // padded

    expect(setBorrowerCount(q, a, 99).borrowerCount).toBe(5); // clamp high
    expect(setBorrowerCount(q, a, 0).borrowerCount).toBe(1); // clamp low
    expect(setBorrowerCount(q, a, 1).borrowers).toHaveLength(1); // shrink
  });
});

describe("evalCondition — operators & scope", () => {
  const ctx = { global: { a: 5, b: "x", tags: ["m", "n"] }, borrower: { a: 99 } };

  it("comparison + membership operators", () => {
    expect(evalCondition({ field: "a", op: "eq", value: 5, scope: "global" }, ctx)).toBe(true);
    expect(evalCondition({ field: "a", op: "ne", value: 5, scope: "global" }, ctx)).toBe(false);
    expect(evalCondition({ field: "a", op: "gt", value: 4, scope: "global" }, ctx)).toBe(true);
    expect(evalCondition({ field: "a", op: "lte", value: 5, scope: "global" }, ctx)).toBe(true);
    expect(evalCondition({ field: "b", op: "in", value: ["x", "y"], scope: "global" }, ctx)).toBe(true);
    expect(evalCondition({ field: "tags", op: "includes", value: "n", scope: "global" }, ctx)).toBe(true);
    expect(evalCondition({ field: "missing", op: "empty", scope: "global" }, ctx)).toBe(true);
    expect(evalCondition({ field: "b", op: "notEmpty", scope: "global" }, ctx)).toBe(true);
  });

  it("scope resolution: global / borrower / auto", () => {
    expect(evalCondition({ field: "a", op: "eq", value: 5, scope: "global" }, ctx)).toBe(true);
    expect(evalCondition({ field: "a", op: "eq", value: 99, scope: "borrower" }, ctx)).toBe(true);
    // auto prefers borrower when it holds the key, else global
    expect(evalCondition({ field: "a", op: "eq", value: 99 }, ctx)).toBe(true);
    expect(evalCondition({ field: "b", op: "eq", value: "x" }, ctx)).toBe(true);
  });

  it("all / any / not composition", () => {
    const c = {
      all: [
        { field: "a", op: "gt" as const, value: 1, scope: "global" as const },
        { any: [{ field: "b", op: "eq" as const, value: "z", scope: "global" as const }, { not: { field: "b", op: "empty" as const, scope: "global" as const } }] },
      ],
    };
    expect(evalCondition(c, ctx)).toBe(true);
  });

  it("absent condition is always true", () => {
    expect(evalCondition(undefined, ctx)).toBe(true);
  });
});

describe("visibility", () => {
  it("conditional field hidden until its trigger is set", () => {
    const a = createEmptyAnswer(q);
    const ids = () => renderableFields(q.sections[0], a).map((r) => r.field.id);
    expect(ids()).not.toContain("extraAmount");
    a.values.hasExtra = true;
    expect(ids()).toContain("extraAmount");
  });

  it("per-borrower field expands once per borrower", () => {
    let a = createEmptyAnswer(q);
    a = setBorrowerCount(q, a, 2);
    const names = renderableFields(q.sections[1], a).filter((r) => r.field.id === "fullName");
    expect(names).toHaveLength(2);
    expect(names.map((r) => r.path)).toEqual(["borrowers[0].fullName", "borrowers[1].fullName"]);
  });

  it("borrower-scoped condition is evaluated per borrower", () => {
    let a = createEmptyAnswer(q);
    a = setBorrowerCount(q, a, 2);
    a.borrowers[0].selfEmployed = true; // only borrower 0 is self-employed
    const docs = renderableFields(q.sections[1], a).filter((r) => r.field.id === "incomeDocs");
    expect(docs).toHaveLength(1);
    expect(docs[0].borrowerIndex).toBe(0);
    // sanity: contexts resolve independently
    expect(evalCondition({ field: "selfEmployed", op: "truthy", scope: "borrower" }, borrowerContext(a, 0))).toBe(true);
    expect(evalCondition({ field: "selfEmployed", op: "truthy", scope: "borrower" }, borrowerContext(a, 1))).toBe(false);
    expect(globalContext(a).borrower).toBeUndefined();
  });
});

describe("validation", () => {
  it("empty answer flags required globals + per-borrower fields, hides conditionals", () => {
    const a = createEmptyAnswer(q);
    const errors = validateQuestionnaire(q, a);
    const codesByPath = Object.fromEntries(errors.map((e) => [e.path, e.code]));
    expect(codesByPath["values.purpose"]).toBe("required");
    expect(codesByPath["values.price"]).toBe("required");
    expect(codesByPath["borrowers[0].fullName"]).toBe("required");
    expect(codesByPath["borrowers[0].birth"]).toBe("required");
    // hidden fields produce no errors
    expect(codesByPath["values.extraAmount"]).toBeUndefined();
    expect(codesByPath["values.loans"]).toBeUndefined();
    // messageKey + interpolation params are carried, never raw text
    expect(errors.every((e) => e.messageKey === `validation.${e.code}`)).toBe(true);
  });

  it("type-specific constraints: number range, text length, date max, multi-choice", () => {
    const a = createEmptyAnswer(q);
    a.values.purpose = "buy";
    a.values.price = 50000; // below min
    a.borrowers[0].fullName = "א"; // too short
    a.borrowers[0].birth = "2020-05-01"; // after max
    a.borrowers[0].selfEmployed = true;
    a.borrowers[0].incomeDocs = []; // visible now, minSelected 1
    const byPath = Object.fromEntries(validateQuestionnaire(q, a).map((e) => [e.path, e]));
    expect(byPath["values.price"].code).toBe("min");
    expect(byPath["values.price"].params).toEqual({ min: 100000 });
    expect(byPath["borrowers[0].fullName"].code).toBe("minLength");
    expect(byPath["borrowers[0].birth"].code).toBe("max");
    expect(byPath["borrowers[0].incomeDocs"].code).toBe("minSelected");
  });

  it("conditional table validates rows + minRows", () => {
    const a = createEmptyAnswer(q);
    a.values.purpose = "refi"; // reveals the loans table (minRows 1)
    a.values.price = 1000000;
    a.borrowers[0].fullName = "אבי כהן";
    a.borrowers[0].birth = "1990-01-01";

    // table empty -> minRows error
    expect(validateQuestionnaire(q, a).some((e) => e.path === "values.loans" && e.code === "minRows")).toBe(true);

    // one invalid row -> nested column errors with indexed paths
    a.values.loans = [{ bank: "", balance: -5 }];
    const errs = validateQuestionnaire(q, a);
    expect(errs.some((e) => e.path === "values.loans[0].bank" && e.code === "required")).toBe(true);
    expect(errs.some((e) => e.path === "values.loans[0].balance" && e.code === "min")).toBe(true);

    // fix the row -> complete
    a.values.loans = [{ bank: "לאומי", balance: 250000 }];
    expect(isComplete(q, a)).toBe(true);
  });

  it("a fully valid new-purchase answer is complete", () => {
    let a = createEmptyAnswer(q);
    a = setBorrowerCount(q, a, 2);
    a.values.purpose = "buy";
    a.values.price = 1500000;
    a.values.hasExtra = true;
    a.values.extraAmount = 200000;
    for (const b of a.borrowers) {
      b.fullName = "לקוח לדוגמה";
      b.birth = "1985-06-01";
    }
    expect(validateQuestionnaire(q, a)).toEqual([]);
    expect(isComplete(q, a)).toBe(true);
    expect(firstInvalidSectionIndex(q, a)).toBe(-1);

    // break one borrower -> points at the borrowers section (index 1)
    a.borrowers[1].fullName = "";
    expect(firstInvalidSectionIndex(q, a)).toBe(1);
  });
});
