/**
 * Personal-area "personal data" completion questionnaire (Phase 4), per borrower.
 * Pure config for the questionnaire engine; all text is i18n keys under
 * `questionnaire.personalData.*`. Reuses the wizard in "save" mode.
 */
import type { Questionnaire } from "@/lib/questionnaire";

const NS = "questionnaire.personalData";
const opt = (v: string) => ({ value: v, labelKey: `${NS}.opt.${v}` });

export const personalData: Questionnaire = {
  id: "personal-data",
  variant: "new",
  titleKey: `${NS}.title`,
  minBorrowers: 1,
  maxBorrowers: 5,
  sections: [
    {
      id: "identity",
      titleKey: `${NS}.sections.identity`,
      fields: [
        { id: "firstName", type: "text", labelKey: `${NS}.f.firstName`, perBorrower: true, required: true },
        { id: "lastName", type: "text", labelKey: `${NS}.f.lastName`, perBorrower: true, required: true },
        { id: "gender", type: "choice", labelKey: `${NS}.f.gender`, perBorrower: true, required: true, options: [opt("male"), opt("female")] },
        { id: "maritalStatus", type: "choice", labelKey: `${NS}.f.maritalStatus`, perBorrower: true, required: true, options: [opt("single"), opt("married"), opt("divorced"), opt("widowed")] },
        { id: "birthDate", type: "date", labelKey: `${NS}.f.birthDate`, perBorrower: true, required: true, max: "2008-01-01" },
        { id: "education", type: "choice", labelKey: `${NS}.f.education`, perBorrower: true, required: true, options: [opt("highschool"), opt("postsecondary"), opt("bachelor"), opt("master")] },
      ],
    },
    {
      id: "contact",
      titleKey: `${NS}.sections.contact`,
      fields: [
        { id: "phone", type: "text", labelKey: `${NS}.f.phone`, perBorrower: true, required: true },
        { id: "email", type: "text", labelKey: `${NS}.f.email`, perBorrower: true, required: true },
        { id: "addrCity", type: "text", labelKey: `${NS}.f.addrCity`, perBorrower: true, required: true },
        { id: "addrStreet", type: "text", labelKey: `${NS}.f.addrStreet`, perBorrower: true },
        { id: "addrNumber", type: "text", labelKey: `${NS}.f.addrNumber`, perBorrower: true },
        { id: "addrApt", type: "text", labelKey: `${NS}.f.addrApt`, perBorrower: true },
      ],
    },
    {
      id: "employment",
      titleKey: `${NS}.sections.employment`,
      fields: [
        { id: "employmentStatus", type: "choice", labelKey: `${NS}.f.employmentStatus`, perBorrower: true, options: [opt("employee"), opt("selfEmployed"), opt("controllingOwner")] },
        { id: "profession", type: "text", labelKey: `${NS}.f.profession`, perBorrower: true },
        { id: "workplace", type: "text", labelKey: `${NS}.f.workplace`, perBorrower: true },
        { id: "workSeniorityYears", type: "number", labelKey: `${NS}.f.workSeniorityYears`, perBorrower: true, min: 0, step: 1 },
      ],
    },
    {
      id: "declarations",
      titleKey: `${NS}.sections.declarations`,
      fields: [
        { id: "additionalCitizenship", type: "yesno", labelKey: `${NS}.f.additionalCitizenship`, perBorrower: true },
        { id: "publicFigure", type: "yesno", labelKey: `${NS}.f.publicFigure`, perBorrower: true },
        { id: "healthOk", type: "yesno", labelKey: `${NS}.f.healthOk`, perBorrower: true },
        { id: "creditIssues", type: "yesno", labelKey: `${NS}.f.creditIssues`, helpKey: `${NS}.help.creditIssues`, perBorrower: true, required: true },
      ],
    },
    {
      id: "finances",
      titleKey: `${NS}.sections.finances`,
      fields: [
        { id: "netMonthlyIncome", type: "number", labelKey: `${NS}.f.netMonthlyIncome`, helpKey: `${NS}.help.netMonthlyIncome`, perBorrower: true, required: true, min: 0, step: 500 },
        {
          id: "loans",
          type: "table",
          labelKey: `${NS}.f.loans`,
          perBorrower: true,
          columns: [
            { id: "lender", type: "text", labelKey: `${NS}.cols.lender` },
            { id: "amount", type: "number", labelKey: `${NS}.cols.amount`, min: 0 },
            { id: "monthlyPayment", type: "number", labelKey: `${NS}.cols.monthlyPayment`, min: 0 },
            { id: "endDate", type: "date", labelKey: `${NS}.cols.endDate` },
          ],
        },
        {
          id: "extraIncome",
          type: "table",
          labelKey: `${NS}.f.extraIncome`,
          perBorrower: true,
          columns: [
            { id: "type", type: "text", labelKey: `${NS}.cols.type` },
            { id: "amount", type: "number", labelKey: `${NS}.cols.amount`, min: 0 },
          ],
        },
        { id: "additionalProperties", type: "yesno", labelKey: `${NS}.f.additionalProperties`, helpKey: `${NS}.help.additionalProperties`, perBorrower: true },
        {
          id: "propertiesTable",
          type: "table",
          labelKey: `${NS}.f.propertiesTable`,
          perBorrower: true,
          visibleWhen: { field: "additionalProperties", op: "truthy", scope: "borrower" },
          columns: [
            { id: "kind", type: "choice", labelKey: `${NS}.cols.kind`, options: [opt("house"), opt("duplex"), opt("apartment")] },
            { id: "city", type: "text", labelKey: `${NS}.cols.city` },
            { id: "value", type: "number", labelKey: `${NS}.cols.value`, min: 0 },
            { id: "mortgage", type: "number", labelKey: `${NS}.cols.mortgage`, min: 0 },
          ],
        },
      ],
    },
  ],
};
