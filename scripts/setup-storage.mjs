/**
 * One-off (idempotent) Supabase Storage setup: creates the private `documents`
 * bucket customer uploads go to. Run: node scripts/setup-storage.mjs
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local", quiet: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
if (listErr) throw listErr;

if (buckets.some((b) => b.name === "documents")) {
  console.log("bucket `documents` already exists");
} else {
  const { error } = await supabase.storage.createBucket("documents", {
    public: false,
    fileSizeLimit: "10MB",
  });
  if (error) throw error;
  console.log("created private bucket `documents` (10MB limit)");
}
