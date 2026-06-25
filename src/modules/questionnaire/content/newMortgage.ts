/**
 * Production new-mortgage questionnaire content (Phase 3B).
 *
 * Pure config — drives the generic wizard via the 3A engine. All user-facing
 * text is i18n keys under `questionnaire.newMortgage.*` (single source of truth
 * in messages/he.json). Field ids match the eligibility mapper (see ../mappers).
 */
import type { Questionnaire } from "@/lib/questionnaire";

const NS = "questionnaire.newMortgage";

export const newMortgage: Questionnaire = {
  id: "new-mortgage",
  variant: "new",
  titleKey: `${NS}.title`,
  minBorrowers: 1,
  maxBorrowers: 5,
  sections: [
    {
      id: "property",
      titleKey: `${NS}.sections.property`,
      fields: [
        {
          id: "purchaseType",
          type: "choice",
          labelKey: `${NS}.fields.purchaseType`,
          helpKey: `${NS}.help.purchaseType`,
          required: true,
          options: [
            { value: "single", labelKey: `${NS}.purchaseType.single` },
            { value: "additional", labelKey: `${NS}.purchaseType.additional` },
            { value: "allPurpose", labelKey: `${NS}.purchaseType.allPurpose` },
            { value: "housingImprovement", labelKey: `${NS}.purchaseType.housingImprovement` },
            { value: "mechirLamishtaken", labelKey: `${NS}.purchaseType.mechirLamishtaken` },
          ],
        },
        { id: "propertyValue", type: "number", labelKey: `${NS}.fields.propertyValue`, helpKey: `${NS}.help.propertyValue`, required: true, min: 100000, step: 10000 },
        { id: "requestedLoan", type: "number", labelKey: `${NS}.fields.requestedLoan`, helpKey: `${NS}.help.requestedLoan`, required: true, min: 0, step: 10000 },
        { id: "equity", type: "number", labelKey: `${NS}.fields.equity`, helpKey: `${NS}.help.equity`, required: true, min: 0, step: 10000 },
      ],
    },
    {
      id: "finance",
      titleKey: `${NS}.sections.finance`,
      fields: [
        { id: "hasOtherIncome", type: "yesno", labelKey: `${NS}.fields.hasOtherIncome`, helpKey: `${NS}.help.hasOtherIncome` },
        {
          id: "extraMonthlyIncome",
          type: "number",
          labelKey: `${NS}.fields.extraMonthlyIncome`,
          helpKey: `${NS}.help.extraMonthlyIncome`,
          required: true,
          min: 0,
          step: 500,
          visibleWhen: { field: "hasOtherIncome", op: "truthy", scope: "global" },
        },
        { id: "fixedMonthlyExpenses", type: "number", labelKey: `${NS}.fields.fixedMonthlyExpenses`, helpKey: `${NS}.help.fixedMonthlyExpenses`, min: 0, step: 500 },
      ],
    },
    {
      id: "borrowers",
      titleKey: `${NS}.sections.borrowers`,
      fields: [
        { id: "birthDate", type: "date", labelKey: `${NS}.fields.birthDate`, helpKey: `${NS}.help.birthDate`, required: true, perBorrower: true, max: "2008-01-01" },
        {
          id: "employmentType",
          type: "choice",
          labelKey: `${NS}.fields.employmentType`,
          helpKey: `${NS}.help.employmentType`,
          required: true,
          perBorrower: true,
          options: [
            { value: "employed", labelKey: `${NS}.employment.employed` },
            { value: "selfEmployed", labelKey: `${NS}.employment.selfEmployed` },
          ],
        },
        { id: "netMonthlyIncome", type: "number", labelKey: `${NS}.fields.netMonthlyIncome`, helpKey: `${NS}.help.netMonthlyIncome`, required: true, perBorrower: true, min: 0, step: 500 },
        { id: "isMortgagor", type: "yesno", labelKey: `${NS}.fields.isMortgagor`, helpKey: `${NS}.help.isMortgagor`, perBorrower: true },
      ],
    },
  ],
};
