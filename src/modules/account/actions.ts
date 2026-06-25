"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/** Enter the personal area as a guest (no account). Remembered via a cookie. */
export async function continueAsGuest() {
  (await cookies()).set("guest", "1", {
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
    sameSite: "lax",
  });
  redirect("/account");
}
