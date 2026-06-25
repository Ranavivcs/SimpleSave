import { useTranslations } from "next-intl";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ServiceCard } from "@/modules/home/ServiceCard";

const HomeIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
    <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const RefreshIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 21v-5h5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ShieldIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
    <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function HomePage() {
  const t = useTranslations();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-brand-50 to-white">
          <div className="mx-auto max-w-6xl px-4 py-16 text-center">
            <h1 className="text-3xl font-extrabold text-brand-900 sm:text-4xl">
              {t("home.welcome")}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
              {t("home.subtitle")}
            </p>
            <a
              href="/login"
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-brand-700 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-brand-900"
            >
              {t("home.enterSystem")}
            </a>
          </div>
        </section>

        {/* Services */}
        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-6 md:grid-cols-3">
            <ServiceCard
              href="/questionnaire/new-mortgage"
              icon={HomeIcon}
              iconBg="bg-brand-600"
              title={t("services.newMortgage.title")}
              description={t("services.newMortgage.desc")}
              bullets={[
                t("services.newMortgage.bullet1"),
                t("services.newMortgage.bullet2"),
                t("services.newMortgage.bullet3"),
              ]}
              cta={t("common.start")}
            />
            <ServiceCard
              href="/questionnaire/refinance"
              icon={RefreshIcon}
              iconBg="bg-emerald-500"
              title={t("services.refinance.title")}
              description={t("services.refinance.desc")}
              bullets={[
                t("services.refinance.bullet1"),
                t("services.refinance.bullet2"),
                t("services.refinance.bullet3"),
              ]}
              cta={t("common.start")}
            />
            <ServiceCard
              href="/questionnaire/insurance"
              icon={ShieldIcon}
              iconBg="bg-amber-500"
              title={t("services.insurance.title")}
              description={t("services.insurance.desc")}
              bullets={[
                t("services.insurance.bullet1"),
                t("services.insurance.bullet2"),
                t("services.insurance.bullet3"),
              ]}
              cta={t("common.start")}
            />
          </div>
        </section>
      </main>
    </>
  );
}
