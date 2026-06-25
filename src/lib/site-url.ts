import { headers } from "next/headers";

/**
 * The app's public origin (e.g. http://localhost:3001), used to build absolute
 * URLs for Supabase email redirects.
 *
 * Prefers NEXT_PUBLIC_SITE_URL (set it in production); otherwise derives the
 * real origin from the incoming request headers — so it is always correct no
 * matter which port `next dev` actually bound to. Never hardcodes a port, which
 * is exactly the bug that sent magic links to whatever app sat on :3000.
 */
export async function getSiteUrl(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (fromEnv) return fromEnv;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
