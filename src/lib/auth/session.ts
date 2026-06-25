import { redirect } from "next/navigation";
import type { Profile, UserRole } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

/**
 * Server-side auth helpers. Authorization is enforced HERE (the app layer),
 * because the app's DB access goes through Prisma on a privileged pooled
 * connection that bypasses Postgres RLS. RLS is defense-in-depth only.
 *
 * These import next/headers + Prisma and must only run on the server.
 */

/** The authenticated Supabase user (revalidated against the auth server), or null. */
export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** The app-side Profile (the source of truth for role) for the current user, or null. */
export async function getProfile(): Promise<Profile | null> {
  const user = await getSessionUser();
  if (!user) return null;
  return prisma.profile.findUnique({ where: { id: user.id } });
}

/** Require any authenticated user; redirect to /login otherwise. */
export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** Require a specific role; redirect to /login if anonymous, or home if the role is wrong. */
export async function requireRole(role: UserRole): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== role) redirect("/");
  return profile;
}

/** Guard for the admin area. */
export async function requireAdmin(): Promise<Profile> {
  return requireRole("ADMIN");
}
