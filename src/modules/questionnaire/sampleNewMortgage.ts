/**
 * DEMO questionnaire definition for the `/demo/questionnaire` route. Not
 * production content — a small new-mortgage sample that exercises the 3A engine
 * (choice / number / date / yes-no, a conditional field, per-borrower fields).
 *
 * Production new-mortgage content lives in ./content/newMortgage.ts.
 * The answer→eligibility mapper is shared (./mappers).
 */
import type { Questionnaire } from "@/lib/questionnaire";

export { answerToEligibilityInput } from "./mappers";

export const sampleNewMortgage: Questionnaire = {
  id: "demo-new-mortgage",
  variant: "new",
  titleKey: "demo.title",
  minBorrowers: 1,
  maxBorrowers: 5,
  sections: [
    {
      id: "property",
      titleKey: "demo.sections.property",
      fields: [
        {
          id: "purchaseType",
          type: "choice",
          labelKey: "demo.fields.purchaseType",
          helpKey: "demo.help.purchaseType",
          required: true,
          options: [
            { value: "single", labelKey: "demo.purchaseType.single" },
            { value: "additional", labelKey: "demo.purchaseType.additional" },
            { value: "mechirLamishtaken", labelKey: "demo.purchaseType.mechirLamishtaken" },
          ],
        },
        { id: "propertyValue", type: "number", labelKey: "demo.fields.propertyValue", helpKey: "demo.help.propertyValue", required: true, min: 100000, step: 10000 },
        { id: "requestedLoan", type: "number", labelKey: "demo.fields.requestedLoan", helpKey: "demo.help.requestedLoan", required: true, min: 0, step: 10000 },
        { id: "equity", type: "number", labelKey: "demo.fields.equity", helpKey: "demo.help.equity", required: true, min: 0, step: 10000 },
        { id: "hasOtherIncome", type: "yesno", labelKey: "demo.fields.hasOtherIncome", helpKey: "demo.help.hasOtherIncome" },
        {
          id: "extraMonthlyIncome",
          type: "number",
          labelKey: "demo.fields.extraMonthlyIncome",
          helpKey: "demo.help.extraMonthlyIncome",
          required: true,
          min: 0,
          step: 500,
          visibleWhen: { field: "hasOtherIncome", op: "truthy", scope: "global" },
        },
        { id: "fixedMonthlyExpenses", type: "number", labelKey: "demo.fields.fixedMonthlyExpenses", helpKey: "demo.help.fixedMonthlyExpenses", min: 0, step: 500 },
      ],
    },
    {
      id: "borrowers",
      titleKey: "demo.sections.borrowers",
      fields: [
        { id: "birthDate", type: "date", labelKey: "demo.fields.birthDate", helpKey: "demo.help.birthDate", required: true, perBorrower: true, max: "2008-01-01" },
        { id: "netMonthlyIncome", type: "number", labelKey: "demo.fields.netMonthlyIncome", helpKey: "demo.help.netMonthlyIncome", required: true, perBorrower: true, min: 0, step: 500 },
        { id: "isMortgagor", type: "yesno", labelKey: "demo.fields.isMortgagor", helpKey: "demo.help.isMortgagor", perBorrower: true },
      ],
    },
  ],
};
