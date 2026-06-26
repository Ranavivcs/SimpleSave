"use server";

import { cookies } from "next/headers";

/**
 * Marks a personal-area tab complete (key = `${type}:${tab}`) so the next tab
 * unlocks. POC: stored in a cookie; moves to the DB with persistence. Reading is
 * done directly from cookies in the server components that render the tabs.
 */
export async function markTabDone(key: string): Promise<void> {
  (await cookies()).set(`done:${key}`, "1", {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });
}
