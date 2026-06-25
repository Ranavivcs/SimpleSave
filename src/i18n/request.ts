import { getRequestConfig } from "next-intl/server";
import { defaultLocale } from "./config";

/**
 * Provides the active locale + messages to Server Components.
 *
 * Single-locale (Hebrew) for now — no i18n routing. When more languages are
 * added, resolve the locale here (e.g. from a cookie or the URL) instead of
 * the fixed default.
 */
export default getRequestConfig(async () => {
  const locale = defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
