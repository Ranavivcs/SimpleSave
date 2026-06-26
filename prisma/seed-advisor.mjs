/**
 * Seed the advisor area's POC clients (Phase 6) — the same scenario the UI was
 * built against, now persisted so doc reviews + messages survive reloads.
 *
 * Idempotent: clears AdvisorClient (documents/messages cascade) and re-inserts.
 * Separate from the config seed (seed.mjs) so each can run independently.
 *
 * Run: npm run db:seed:advisor
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ADVISOR = "גל אסרף";

const CLIENTS = [
  {
    name: "ישראל ישראלי",
    email: "israel.israeli@gmail.com",
    status: "BEFORE",
    stage: "PERSONAL",
    approvedBanks: [],
    nextTreatment: new Date("2026-06-29"),
    notes: "",
    requestType: "new-mortgage",
    propertyValue: 1_500_000,
    equity: 500_000,
    loanAmount: 1_000_000,
    documents: [
      { nameKey: "id", status: "APPROVED" },
      { nameKey: "payslips", status: "PENDING" },
      { nameKey: "bankStatements", status: "PENDING" },
    ],
    messages: [
      { sender: "CUSTOMER", text: "שלום, העליתי את תלושי השכר. אפשר לבדוק?", read: false, sentAt: new Date("2026-06-25T09:10:00") },
      { sender: "CUSTOMER", text: "מתי נוכל לקבוע פגישה?", read: false, sentAt: new Date("2026-06-25T09:12:00") },
    ],
  },
  {
    name: "אביוד אסרף",
    email: "avihud.asraf@gmail.com",
    status: "IN",
    stage: "APPROVAL",
    approvedBanks: ["leumi", "hapoalim"],
    nextTreatment: new Date("2026-07-02"),
    notes: "ממתין לאישור עקרוני ממזרחי.",
    requestType: "new-mortgage",
    propertyValue: 2_100_000,
    equity: 700_000,
    loanAmount: 1_400_000,
    documents: [
      { nameKey: "id", status: "APPROVED" },
      { nameKey: "payslips", status: "APPROVED" },
      { nameKey: "bankStatements", status: "REJECTED", note: "הדף חתוך, נא להעלות מחדש." },
      { nameKey: "taxReturn", status: "REQUESTED" },
    ],
    messages: [
      { sender: "ADVISOR", text: "קיבלתי את המסמכים, תודה.", read: true, sentAt: new Date("2026-06-24T14:00:00") },
      { sender: "CUSTOMER", text: "מצוין, אשלח את דוח המס בהקדם.", read: false, sentAt: new Date("2026-06-24T14:30:00") },
    ],
  },
  {
    name: "דנה כהן",
    email: "dana.cohen@gmail.com",
    status: "IN",
    stage: "MORTGAGE",
    approvedBanks: ["discount"],
    nextTreatment: new Date("2026-07-10"),
    notes: "",
    requestType: "refinance",
    propertyValue: 1_800_000,
    equity: 600_000,
    loanAmount: 900_000,
    documents: [
      { nameKey: "id", status: "APPROVED" },
      { nameKey: "bankStatements", status: "PENDING" },
    ],
    messages: [],
  },
  {
    name: "מאיה לוי",
    email: "maya.levi@gmail.com",
    status: "AFTER",
    stage: "DONE",
    approvedBanks: ["mizrahi", "beinleumi"],
    nextTreatment: null,
    notes: "התהליך הושלם, משכנתא בוצעה.",
    requestType: "new-mortgage",
    propertyValue: 2_600_000,
    equity: 1_000_000,
    loanAmount: 1_600_000,
    documents: [
      { nameKey: "id", status: "APPROVED" },
      { nameKey: "payslips", status: "APPROVED" },
      { nameKey: "bankStatements", status: "APPROVED" },
      { nameKey: "taxReturn", status: "APPROVED" },
    ],
    messages: [
      { sender: "ADVISOR", text: "כל המסמכים אושרו, התהליך הושלם בהצלחה!", read: true, sentAt: new Date("2026-06-20T11:00:00") },
    ],
  },
];

async function main() {
  await prisma.advisorClient.deleteMany(); // cascades documents + messages

  for (const c of CLIENTS) {
    await prisma.advisorClient.create({
      data: {
        name: c.name,
        email: c.email,
        advisorName: ADVISOR,
        status: c.status,
        stage: c.stage,
        approvedBanks: c.approvedBanks,
        nextTreatment: c.nextTreatment,
        notes: c.notes,
        requestType: c.requestType,
        propertyValue: c.propertyValue,
        equity: c.equity,
        loanAmount: c.loanAmount,
        documents: { create: c.documents.map((d, i) => ({ ...d, order: i })) },
        messages: { create: c.messages },
      },
    });
  }

  const [clients, docs, msgs] = await Promise.all([
    prisma.advisorClient.count(),
    prisma.advisorClientDocument.count(),
    prisma.advisorClientMessage.count(),
  ]);
  console.log("Advisor seed ✓", { clients, documents: docs, messages: msgs });
}

main()
  .catch((e) => {
    console.error("ADVISOR SEED FAILED:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
