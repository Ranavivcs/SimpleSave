/**
 * Personal-area "mortgage data" completion questionnaire (Phase 4). Global
 * (not per-borrower) — about the property & loan. New-mortgage oriented;
 * refinance-specific fields (מטרת המחזור / סכום להכנסה) are a TODO variant.
 * Pure config; text = i18n keys under `questionnaire.mortgageData.*`.
 */
import type { Questionnaire } from "@/lib/questionnaire";

const NS = "questionnaire.mortgageData";
const opt = (v: string) => ({ value: v, labelKey: `${NS}.opt.${v}` });

export const mortgageData: Questionnaire = {
  id: "mortgage-data",
  variant: "new",
  titleKey: `${NS}.title`,
  minBorrowers: 1,
  maxBorrowers: 5,
  sections: [
    {
      id: "status",
      titleKey: `${NS}.sections.status`,
      fields: [
        { id: "purchaseStatus", type: "choice", labelKey: `${NS}.f.purchaseStatus`, required: true, options: [opt("searching"), opt("signed"), opt("aboutToSign")] },
        { id: "signDate", type: "date", labelKey: `${NS}.f.signDate`, visibleWhen: { field: "purchaseStatus", op: "eq", value: "signed", scope: "global" } },
        { id: "moneyNeededWhen", type: "choice", labelKey: `${NS}.f.moneyNeededWhen`, options: [opt("thisMonth"), opt("twoMonths"), opt("threePlus")], visibleWhen: { field: "purchaseStatus", op: "eq", value: "signed", scope: "global" } },
      ],
    },
    {
      id: "property",
      titleKey: `${NS}.sections.property`,
      fields: [
        { id: "purchaseType", type: "choice", labelKey: `${NS}.f.purchaseType`, helpKey: `${NS}.help.purchaseType`, required: true, options: [opt("firstProperty"), opt("housingImprovement"), opt("additional")] },
        { id: "priorOwnership", type: "yesno", labelKey: `${NS}.f.priorOwnership`, helpKey: `${NS}.help.priorOwnership`, visibleWhen: { field: "purchaseType", op: "eq", value: "firstProperty", scope: "global" } },
        { id: "propertySource", type: "choice", labelKey: `${NS}.f.propertySource`, helpKey: `${NS}.help.propertySource`, options: [opt("contractor"), opt("secondHand"), opt("mechirLamishtaken"), opt("selfBuild")] },
        { id: "propertyRegistration", type: "choice", labelKey: `${NS}.f.propertyRegistration`, options: [opt("tabu"), opt("minhal"), opt("chevraMeshakenet")] },
        { id: "addrCity", type: "text", labelKey: `${NS}.f.addrCity`, required: true },
        { id: "addrStreet", type: "text", labelKey: `${NS}.f.addrStreet` },
        { id: "addrNumber", type: "text", labelKey: `${NS}.f.addrNumber` },
        { id: "addrApt", type: "text", labelKey: `${NS}.f.addrApt` },
        { id: "rooms", type: "number", labelKey: `${NS}.f.rooms`, min: 1, step: 0.5 },
        {
          id: "propertyDetails",
          type: "table",
          labelKey: `${NS}.f.propertyDetails`,
          columns: [
            { id: "kind", type: "choice", labelKey: `${NS}.cols.kind`, options: [opt("house"), opt("duplex"), opt("apartment")] },
            { id: "floor", type: "number", labelKey: `${NS}.cols.floor` },
            { id: "buildingAge", type: "number", labelKey: `${NS}.cols.buildingAge`, min: 0 },
            { id: "areaSqm", type: "number", labelKey: `${NS}.cols.areaSqm`, min: 0 },
          ],
        },
      ],
    },
    {
      id: "finance",
      titleKey: `${NS}.sections.finance`,
      fields: [
        { id: "propertyValue", type: "number", labelKey: `${NS}.f.propertyValue`, required: true, min: 0, step: 10000 },
        { id: "valueSource", type: "choice", labelKey: `${NS}.f.valueSource`, options: [opt("self"), opt("appraiser"), opt("contractor")] },
        { id: "equity", type: "number", labelKey: `${NS}.f.equity`, required: true, min: 0, step: 10000 },
        {
          id: "equitySource",
          type: "table",
          labelKey: `${NS}.f.equitySource`,
          helpKey: `${NS}.help.equitySource`,
          columns: [
            { id: "source", type: "choice", labelKey: `${NS}.cols.source`, options: [opt("osh"), opt("savings"), opt("loans"), opt("family"), opt("keren"), opt("other")] },
            { id: "amount", type: "number", labelKey: `${NS}.cols.amount`, min: 0 },
          ],
        },
        { id: "desiredPaymentMin", type: "number", labelKey: `${NS}.f.desiredPaymentMin`, min: 0, step: 100 },
        { id: "desiredPaymentMax", type: "number", labelKey: `${NS}.f.desiredPaymentMax`, min: 0, step: 100 },
      ],
    },
    {
      id: "extra",
      titleKey: `${NS}.sections.extra`,
      fields: [
        { id: "priorApplication", type: "yesno", labelKey: `${NS}.f.priorApplication` },
        { id: "priorApplicationBanks", type: "text", labelKey: `${NS}.f.priorApplicationBanks`, visibleWhen: { field: "priorApplication", op: "truthy", scope: "global" } },
        { id: "agreeTransferAccount", type: "choice", labelKey: `${NS}.f.agreeTransferAccount`, options: [opt("yes"), opt("no"), opt("wantDetails")] },
      ],
    },
  ],
};
