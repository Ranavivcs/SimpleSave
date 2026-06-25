/**
 * Seed the CONFIG BACKBONE from the client's simulator defaults
 * (CLOCK_TEMPLATES, defaultGeneralRates, defaultRiskRules, global params, document list).
 *
 * Idempotent: clears the config tables and re-inserts. Re-running resets config to
 * defaults (admin edits would be overwritten) — intended for initial setup only.
 *
 * Run: npm run db:seed
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Hebrew (simulator) → DB enum mappings
const IDX = { "ללא": "NONE", "מדד": "CPI", "דולר": "USD", "אירו": "EUR" };
const KIND = { fixed: "FIXED", variable: "VARIABLE", prime: "PRIME" };

// ---- rate bands (simulator defaultGeneralRates; whole 4–30 range) ----
const RATE_DEFS = [
  ["fixedUnlinked", 0.0462],
  ["fixedLinked", 0.0462],
  ["variable36Unlinked", 0.047],
  ["variable36Linked", 0.047],
  ["variable60Unlinked", 0.047],
  ["variable60Linked", 0.047],
  ["variable18_24Unlinked", 0.047],
  ["variable18_24Linked", 0.047],
  ["prime", 0.0456],
];

// ---- the 5 dial templates (simulator CLOCK_TEMPLATES) ----
const CLOCKS = [
  { key: "clock1", name: "שעון 1", order: 1, tracks: [
    { kind: "fixed", sharePct: 17, indexType: "ללא", yearStep: 5, anchor: 0.0462 },
    { kind: "fixed", sharePct: 17, indexType: "מדד", yearStep: 5, anchor: 0.0462 },
    { kind: "variable", sharePct: 30, indexType: "ללא", changeMonths: 36, yearStep: 3, anchorType: 'אג"ח', anchor: 0.047, margin: 0 },
    { kind: "variable", sharePct: 15, indexType: "מדד", changeMonths: 60, yearStep: 5, anchorType: 'אג"ח', anchor: 0.047, margin: 0 },
    { kind: "prime", sharePct: 21, indexType: "ללא", changeMonths: 1, yearStep: 10, anchorType: "פריים", anchor: 0.0456, margin: 0 },
  ] },
  { key: "clock2", name: "שעון 2", order: 2, tracks: [
    { kind: "fixed", sharePct: 33, indexType: "ללא", yearStep: 5, anchor: 0.0462 },
    { kind: "fixed", sharePct: 0, indexType: "מדד", yearStep: 5, anchor: 0.0462 },
    { kind: "variable", sharePct: 30, indexType: "ללא", changeMonths: 36, yearStep: 3, anchorType: 'אג"ח', anchor: 0.047, margin: 0 },
    { kind: "variable", sharePct: 0, indexType: "מדד", changeMonths: 60, yearStep: 5, anchorType: 'אג"ח', anchor: 0.047, margin: 0 },
    { kind: "prime", sharePct: 37, indexType: "ללא", changeMonths: 1, yearStep: 10, anchorType: "פריים", anchor: 0.0456, margin: 0 },
  ] },
  { key: "clock3", name: "שעון 3", order: 3, tracks: [
    { kind: "fixed", sharePct: 35, indexType: "ללא", yearStep: 5, anchor: 0.0462 },
    { kind: "fixed", sharePct: 0, indexType: "מדד", yearStep: 5, anchor: 0.0462 },
    { kind: "variable", sharePct: 0, indexType: "ללא", changeMonths: 36, yearStep: 3, anchorType: 'אג"ח', anchor: 0.047, margin: 0 },
    { kind: "variable", sharePct: 0, indexType: "מדד", changeMonths: 60, yearStep: 5, anchorType: 'אג"ח', anchor: 0.047, margin: 0 },
    { kind: "prime", sharePct: 65, indexType: "ללא", changeMonths: 1, yearStep: 10, anchorType: "פריים", anchor: 0.0456, margin: 0 },
  ] },
  { key: "clock4", name: "שעון 4", order: 4, tracks: [
    { kind: "fixed", sharePct: 17, indexType: "ללא", yearStep: 5, anchor: 0.0462 },
    { kind: "fixed", sharePct: 17, indexType: "מדד", yearStep: 5, anchor: 0.0462 },
    { kind: "variable", sharePct: 30, indexType: "ללא", changeMonths: 36, yearStep: 3, anchorType: 'אג"ח', anchor: 0.047, margin: 0 },
    { kind: "variable", sharePct: 15, indexType: "מדד", changeMonths: 60, yearStep: 5, anchorType: 'אג"ח', anchor: 0.047, margin: 0 },
    { kind: "prime", sharePct: 21, indexType: "ללא", changeMonths: 1, yearStep: 10, anchorType: "פריים", anchor: 0.0456, margin: 0 },
  ] },
  { key: "clock5", name: "שעון 5", order: 5, tracks: [
    { kind: "fixed", sharePct: 33, indexType: "ללא", yearStep: 5, anchor: 0.0462 },
    { kind: "fixed", sharePct: 0, indexType: "מדד", yearStep: 5, anchor: 0.0462 },
    { kind: "variable", sharePct: 0, indexType: "ללא", changeMonths: 36, yearStep: 3, anchorType: 'אג"ח', anchor: 0.047, margin: 0 },
    { kind: "variable", sharePct: 0, indexType: "מדד", changeMonths: 60, yearStep: 5, anchorType: 'אג"ח', anchor: 0.047, margin: 0 },
    { kind: "prime", sharePct: 67, indexType: "ללא", changeMonths: 1, yearStep: 10, anchorType: "פריים", anchor: 0.0456, margin: 0 },
  ] },
];

// ---- risk rules (simulator defaultRiskRules) ----
const RISK = [
  { routeKind: "PRIME", fromMonths: 1, toMonths: 12, indexed: "NO", exitPenalty: "נמוך", risk: 1 },
  { routeKind: "VARIABLE", fromMonths: 1, toMonths: 59, indexed: "NO", exitPenalty: "בינוני", risk: 2 },
  { routeKind: "VARIABLE", fromMonths: 1, toMonths: 59, indexed: "YES", exitPenalty: "בינוני", risk: 3 },
  { routeKind: "VARIABLE", fromMonths: 60, toMonths: 360, indexed: "NO", exitPenalty: "גבוה", risk: 3 },
  { routeKind: "VARIABLE", fromMonths: 60, toMonths: 360, indexed: "YES", exitPenalty: "גבוה", risk: 4 },
  { routeKind: "FIXED", fromMonths: 48, toMonths: 360, indexed: "NO", exitPenalty: "גבוה", risk: 3 },
  { routeKind: "FIXED", fromMonths: 48, toMonths: 360, indexed: "YES", exitPenalty: "גבוה", risk: 4 },
];

// ---- document requirements (spec lines 500–552) ----
const DOCS = [
  { name: "כתבי הסמכה", appliesTo: "all", condition: "קובץ מצורף לחתימה", requiredToProceed: true },
  { name: 'עו"ש 3 חודשים אחרונים (כל החשבונות)', appliesTo: "all", requiredToProceed: true },
  { name: "תלושי שכר 3 חודשים אחרונים", appliesTo: "employed", requiredToProceed: true },
  { name: "צילום ת.ז + ספח (כולל גב התעודה אם ביומטרית)", appliesTo: "all", requiredToProceed: true },
  { name: "פירוט הלוואות (אם יש)", appliesTo: "all", requiredToProceed: true },
  { name: "פירוט קרן השתלמות", appliesTo: "all", condition: "לא חובה", requiredToProceed: false },
  { name: 'אישור רו"ח על הכנסות 1-5/26', appliesTo: "self-employed", requiredToProceed: true },
  { name: "שומת מס לשנת 25", appliesTo: "self-employed", requiredToProceed: true },
  { name: "חוזה שכירות", appliesTo: "all", condition: "מי שמשכיר/שוכר", requiredToProceed: true },
  { name: "דוח התנהלות משכנתא שנתיים אחרונות", appliesTo: "refinance", requiredToProceed: true },
  { name: "דוח יתרות משכנתא", appliesTo: "refinance", requiredToProceed: true },
  { name: 'חוזה רכישה + מש"ח + הצהרת נכונות נתונים', appliesTo: "new", condition: "לא נדרש בלכל מטרה", requiredToProceed: false },
  { name: "פרטי ערב", appliesTo: "all", condition: "אם יש ערבים/לווים נוספים שאינם בעלי הזכויות", requiredToProceed: true },
  { name: "הערכת שמאי", appliesTo: "all", condition: "דירה חדשה / מחזור", requiredToProceed: false },
  { name: "נסח טאבו / חברה משכנת / מנהל", appliesTo: "all", condition: "מחזור / דירה חדשה", requiredToProceed: false },
];

async function main() {
  // clear (cascade deletes DialTrack via DialTemplate)
  await prisma.dialTemplate.deleteMany();
  await prisma.riskRule.deleteMany();
  await prisma.rateBand.deleteMany();
  await prisma.datedRate.deleteMany();
  await prisma.documentRequirement.deleteMany();
  await prisma.globalParameters.deleteMany();

  // global parameters (single active row)
  await prisma.globalParameters.create({
    data: {
      isActive: true,
      expectedIndexAnnual: 0.03,
      expectedDollarAnnual: 0,
      expectedEuroAnnual: 0,
      primeRate: 0.0456,
      maxRepaymentPct: 0.4,
      loanTermMaxAge: 85,
      creditLookbackYrs: 7,
    },
  });

  // rate bands (housing + all-purpose)
  const bands = [];
  for (const purpose of ["HOUSING", "ALL_PURPOSE"]) {
    for (const [routeKey, anchor] of RATE_DEFS) {
      bands.push({ purpose, routeKey, fromYears: 4, toYears: 30, anchor, margin: 0 });
    }
  }
  await prisma.rateBand.createMany({ data: bands });

  // dial templates + nested tracks
  for (const clock of CLOCKS) {
    await prisma.dialTemplate.create({
      data: {
        key: clock.key,
        name: clock.name,
        order: clock.order,
        shortenFixed: true,
        linkedFixedFirst: true,
        tracks: {
          create: clock.tracks.map((t, i) => ({
            order: i,
            kind: KIND[t.kind],
            sharePct: t.sharePct,
            indexType: IDX[t.indexType],
            changeMonths: t.changeMonths ?? null,
            yearStep: t.yearStep ?? null,
            anchorType: t.anchorType ?? null,
            anchor: t.anchor ?? null,
            margin: t.margin ?? 0,
          })),
        },
      },
    });
  }

  // risk rules
  await prisma.riskRule.createMany({
    data: RISK.map((r, i) => ({ ...r, order: i })),
  });

  // document requirements
  await prisma.documentRequirement.createMany({
    data: DOCS.map((d, i) => ({
      name: d.name,
      appliesTo: d.appliesTo,
      condition: d.condition ?? null,
      requiredToProceed: d.requiredToProceed,
      order: i,
    })),
  });

  // summary
  const [gp, rb, dt, dk, rr, dr] = await Promise.all([
    prisma.globalParameters.count(),
    prisma.rateBand.count(),
    prisma.dialTemplate.count(),
    prisma.dialTrack.count(),
    prisma.riskRule.count(),
    prisma.documentRequirement.count(),
  ]);
  console.log("Seeded ✓", {
    globalParameters: gp,
    rateBands: rb,
    dialTemplates: dt,
    dialTracks: dk,
    riskRules: rr,
    documentRequirements: dr,
  });
}

main()
  .catch((e) => {
    console.error("SEED FAILED:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
