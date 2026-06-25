"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

export type AuthState = {
  sent?: boolean;
  email?: string;
  /** i18n key under the `auth` namespace — never a raw user-facing string. */
  errorKey?: string;
};

/** Step 1 — send a one-time email code (passwordless OTP). */
export async function sendOtp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { errorKey: "errorSend" };

  const next = String(formData.get("redirect") ?? "") || "/account";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      // Send the magic link back to THIS app's origin (not Supabase's dashboard
      // Site URL), so it can't open whatever else is running on another port.
      emailRedirectTo: `${await getSiteUrl()}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { email, errorKey: "errorSend" };

  return { sent: true, email };
}

/** Step 2 — verify the code, which establishes the session cookie, then redirect. */
export async function verifyOtp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();
  if (!email || !token) return { sent: true, email, errorKey: "errorVerify" };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) return { sent: true, email, errorKey: "errorVerify" };

  const redirectTo = String(formData.get("redirect") ?? "") || "/account?welcome=1";
  redirect(redirectTo);
}

/** Sign out and return to the home page. */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
