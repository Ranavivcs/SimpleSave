import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth/session";
import { signOut } from "@/modules/auth/actions";
import { SiteHeader } from "@/components/layout/SiteHeader";

/**
 * Admin-area shell. `requireAdmin()` enforces the role on the server (redirects
 * non-admins) — this is the real guard; the middleware only blocks anonymous
 * access. The Phase-2D config UI renders inside this layout.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAdmin();
  const t = await getTranslations("admin");

  return (
    <>
      <SiteHeader />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <h1 className="text-xl font-bold text-slate-900">{t("areaTitle")}</h1>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>{t("loggedInAs", { email: profile.email })}</span>
            <form action={signOut}>
              <button className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-50">
                {t("logout")}
              </button>
            </form>
          </div>
        </div>
        {children}
      </div>
    </>
  );
}
