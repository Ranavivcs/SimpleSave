/**
 * Bootstrap (or promote) an ADMIN user.
 *
 *   npm run create-admin -- <email>
 *
 * Creates the Supabase auth user if needed (email pre-confirmed so they can log
 * in via OTP immediately) and upserts their app-side Profile with role=ADMIN.
 * Uses the SERVICE_ROLE key — run locally only, never ship it client-side.
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";

const email = (process.argv[2] || process.env.ADMIN_EMAIL || "").trim();
if (!email) {
  console.error("Usage: npm run create-admin -- <email>");
  process.exit(1);
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// Find or create the auth user.
let userId;
const { data: created, error: createErr } =
  await supabaseAdmin.auth.admin.createUser({ email, email_confirm: true });

if (createErr) {
  // Likely already exists — look it up by email.
  const { data: list, error: listErr } =
    await supabaseAdmin.auth.admin.listUsers();
  if (listErr) throw listErr;
  const existing = list.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  if (!existing) throw createErr;
  userId = existing.id;
  console.log("Auth user already existed:", userId);
} else {
  userId = created.user.id;
  console.log("Created auth user:", userId);
}

// Upsert the Profile as ADMIN (Profile.id === auth user id).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
await prisma.profile.upsert({
  where: { id: userId },
  update: { role: "ADMIN", email },
  create: { id: userId, email, role: "ADMIN" },
});
await prisma.$disconnect();

console.log(`✅ ${email} is now ADMIN.`);
