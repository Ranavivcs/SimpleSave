"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Dev-only preview of the advisor area (no ADVISOR account required), mirroring
 * the personal area's guest bypass. Disabled in production — there the real
 * role guard (requireAdvisor) applies.
 */
export async function previewAsAdvisor() {
  if (process.env.NODE_ENV === "production") redirect("/login?redirect=/advisor");
  (await cookies()).set("advisor-preview", "1", {
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
    sameSite: "lax",
  });
  redirect("/advisor");
}
