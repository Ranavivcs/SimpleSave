import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { LoginForm } from "@/modules/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  const t = await getTranslations("auth");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="mb-1 text-2xl font-bold text-slate-900">
            {t("loginTitle")}
          </h1>
          <p className="mb-6 text-sm text-slate-600">{t("loginSubtitle")}</p>
          <LoginForm redirectTo={redirect} />
        </div>
      </main>
    </>
  );
}
