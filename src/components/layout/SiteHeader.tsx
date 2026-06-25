import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";

/**
 * Dynamic top navigation, shown on all pages unless explicitly excluded.
 * (Spec: לוגו בולט + ניווט דינמי בכל הדפים.)
 */
export function SiteHeader() {
  const t = useTranslations("common");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center" aria-label={t("appName")}>
          <Image
            src="/logo.png"
            alt={t("appName")}
            width={150}
            height={53}
            priority
            className="h-9 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link href="/" className="hover:text-brand-700">
            {t("home")}
          </Link>
          <Link href="/about" className="hover:text-brand-700">
            {t("about")}
          </Link>
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            {t("personalArea")}
          </Link>
        </div>
      </div>
    </header>
  );
}
