import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { getSessionUser, getProfile } from "@/lib/auth/session";
import { signOut } from "@/modules/auth/actions";

/**
 * Top navigation, shown on all pages. Auth-aware: the "אזור אישי" button always
 * opens the personal area (/account); when signed in, a logout button appears
 * (and serves as the visible logged-in indicator).
 */
export async function SiteHeader() {
  const t = await getTranslations("common");
  const tAdvisor = await getTranslations("advisor");
  const user = await getSessionUser();
  const profile = user ? await getProfile() : null;
  const isAdvisor = profile?.role === "ADVISOR";
  // Dev convenience: expose the advisor link to anyone locally (the area's own
  // gate still applies). In production only real advisors see it.
  const showAdvisorLink = isAdvisor || process.env.NODE_ENV !== "production";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center" aria-label={t("appName")}>
          <Image src="/logo.png" alt={t("appName")} width={150} height={53} priority className="h-9 w-auto" />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link href="/" className="hover:text-brand-700">{t("home")}</Link>
          <Link href="/about" className="hover:text-brand-700">{t("about")}</Link>
        </nav>

        <div className="ms-auto flex items-center gap-2">
          {showAdvisorLink && (
            <Link
              href="/advisor"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
            >
              {tAdvisor("navLink")}
              {!isAdvisor && <span className="ms-1 text-xs text-muted">(dev)</span>}
            </Link>
          )}
          <Link
            href="/account"
            className="rounded-lg border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            {t("personalArea")}
          </Link>
          {user && (
            <form action={signOut}>
              <button className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-800">
                {t("logout")}
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
