import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — bypasses RLS, server only. Used for Storage
 * operations (the app enforces authorization in the app layer, same as Prisma's
 * privileged connection; see src/lib/auth/session.ts).
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/** Private bucket holding customer document uploads. Created by scripts/setup-storage.mjs. */
export const DOCUMENTS_BUCKET = "documents";
