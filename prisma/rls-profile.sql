-- Defense-in-depth RLS for the Profile table.
-- NOTE: the app reads/writes Profile via Prisma on the privileged pooled
-- connection, which BYPASSES RLS — so authorization is enforced in the app
-- layer (src/lib/auth). These policies only constrain direct Supabase-client
-- (anon/auth) access, e.g. from the browser.
alter table "Profile" enable row level security;

-- A logged-in user may read their own profile row; nobody may write via the
-- client (writes go through the server/Prisma or the service role).
drop policy if exists "profile_self_read" on "Profile";
create policy "profile_self_read"
  on "Profile" for select
  to authenticated
  using ((select auth.uid()) = id);
