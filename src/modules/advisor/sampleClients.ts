import type { AdvisorClient } from "./types";

/**
 * POC mock data for the advisor "my clients" tab.
 *
 * The customer personal area is still in-memory (no persisted MortgageRequest /
 * Borrower entities yet), so there is no real client table to read. Per the
 * POC priority this typed mock backs the screen so the flow is demoable now;
 * a later phase swaps this for a Prisma-backed query of the advisor's clients.
 */
export const SAMPLE_ADVISOR_NAME = "גל אסרף";

export const sampleClients: AdvisorClient[] = [
  {
    id: "c1",
    name: "ישראל ישראלי",
    email: "israel.israeli@gmail.com",
    advisorName: SAMPLE_ADVISOR_NAME,
    status: "before",
    stage: "personal",
    approvedBanks: [],
    nextTreatment: "2026-06-29",
    unreadMessages: 2,
    notes: "",
    request: { type: "new-mortgage", propertyValue: 1_500_000, equity: 500_000, loanAmount: 1_000_000 },
    documents: [
      { id: "d1", nameKey: "id", status: "approved" },
      { id: "d2", nameKey: "payslips", status: "pending" },
      { id: "d3", nameKey: "bankStatements", status: "pending" },
    ],
    messages: [
      { id: "m1", from: "customer", text: "שלום, העליתי את תלושי השכר. אפשר לבדוק?", at: "2026-06-25T09:10:00" },
      { id: "m2", from: "customer", text: "מתי נוכל לקבוע פגישה?", at: "2026-06-25T09:12:00" },
    ],
  },
  {
    id: "c2",
    name: "אביוד אסרף",
    email: "avihud.asraf@gmail.com",
    advisorName: SAMPLE_ADVISOR_NAME,
    status: "in",
    stage: "approval",
    approvedBanks: ["leumi", "hapoalim"],
    nextTreatment: "2026-07-02",
    unreadMessages: 1,
    notes: "ממתין לאישור עקרוני ממזרחי.",
    request: { type: "new-mortgage", propertyValue: 2_100_000, equity: 700_000, loanAmount: 1_400_000 },
    documents: [
      { id: "d1", nameKey: "id", status: "approved" },
      { id: "d2", nameKey: "payslips", status: "approved" },
      { id: "d3", nameKey: "bankStatements", status: "rejected", note: "הדף חתוך, נא להעלות מחדש." },
      { id: "d4", nameKey: "taxReturn", status: "requested" },
    ],
    messages: [
      { id: "m1", from: "advisor", text: "קיבלתי את המסמכים, תודה.", at: "2026-06-24T14:00:00" },
      { id: "m2", from: "customer", text: "מצוין, אשלח את דוח המס בהקדם.", at: "2026-06-24T14:30:00" },
    ],
  },
  {
    id: "c3",
    name: "דנה כהן",
    email: "dana.cohen@gmail.com",
    advisorName: SAMPLE_ADVISOR_NAME,
    status: "in",
    stage: "mortgage",
    approvedBanks: ["discount"],
    nextTreatment: "2026-07-10",
    unreadMessages: 0,
    notes: "",
    request: { type: "refinance", propertyValue: 1_800_000, equity: 600_000, loanAmount: 900_000 },
    documents: [
      { id: "d1", nameKey: "id", status: "approved" },
      { id: "d2", nameKey: "bankStatements", status: "pending" },
    ],
    messages: [],
  },
  {
    id: "c4",
    name: "מאיה לוי",
    email: "maya.levi@gmail.com",
    advisorName: SAMPLE_ADVISOR_NAME,
    status: "after",
    stage: "done",
    approvedBanks: ["mizrahi", "beinleumi"],
    nextTreatment: null,
    unreadMessages: 0,
    notes: "התהליך הושלם, משכנתא בוצעה.",
    request: { type: "new-mortgage", propertyValue: 2_600_000, equity: 1_000_000, loanAmount: 1_600_000 },
    documents: [
      { id: "d1", nameKey: "id", status: "approved" },
      { id: "d2", nameKey: "payslips", status: "approved" },
      { id: "d3", nameKey: "bankStatements", status: "approved" },
      { id: "d4", nameKey: "taxReturn", status: "approved" },
    ],
    messages: [
      { id: "m1", from: "advisor", text: "כל המסמכים אושרו, התהליך הושלם בהצלחה!", at: "2026-06-20T11:00:00" },
    ],
  },
];
