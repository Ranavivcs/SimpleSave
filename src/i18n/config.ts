/**
 * Central i18n configuration.
 *
 * The app ships Hebrew-first (RTL). Additional languages (ru / fr / en) are
 * structurally supported: add the locale here + a messages/<locale>.json file,
 * then introduce locale routing. Nothing else hardcodes the language.
 */

export const locales = ["he"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "he";

/** Text direction per locale. */
export const localeDirection: Record<Locale, "rtl" | "ltr"> = {
  he: "rtl",
};

export function getDirection(locale: Locale): "rtl" | "ltr" {
  return localeDirection[locale] ?? "ltr";
}
