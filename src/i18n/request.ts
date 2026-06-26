import { getRequestConfig } from "next-intl/server";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { defaultLocale } from "./config";

/**
 * Provides the active locale + messages to Server Components.
 *
 * Single-locale (Hebrew) for now — no i18n routing. When more languages are
 * added, resolve the locale here (e.g. from a cookie or the URL) instead of
 * the fixed default.
 *
 * Messages come from `messages/<locale>.json` (the shared base) PLUS every
 * `messages/<locale>/*.json` namespace file deep-merged on top. Per-feature
 * namespace files let each contributor own their strings in a private file
 * instead of all editing the single shared base — which avoids merge conflicts
 * on `messages/<locale>.json` when feature branches land together.
 */

type Messages = Record<string, unknown>;

function isPlainObject(value: unknown): value is Messages {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Recursively merge `source` into `target` (source wins on leaf collisions). */
function deepMerge(target: Messages, source: Messages): Messages {
  for (const key of Object.keys(source)) {
    const next = source[key];
    const prev = target[key];
    target[key] =
      isPlainObject(prev) && isPlainObject(next)
        ? deepMerge({ ...prev }, next)
        : next;
  }
  return target;
}

const cache: Record<string, Messages> = {};

function loadMessages(locale: string): Messages {
  if (process.env.NODE_ENV === "production" && cache[locale]) {
    return cache[locale];
  }

  const dir = join(process.cwd(), "messages");
  const base = JSON.parse(
    readFileSync(join(dir, `${locale}.json`), "utf-8"),
  ) as Messages;

  let nsFiles: string[] = [];
  try {
    nsFiles = readdirSync(join(dir, locale)).filter((f) => f.endsWith(".json"));
  } catch {
    // No namespace directory yet — base file only.
  }

  const merged = nsFiles.sort().reduce<Messages>((acc, file) => {
    const ns = JSON.parse(
      readFileSync(join(dir, locale, file), "utf-8"),
    ) as Messages;
    return deepMerge(acc, ns);
  }, base);

  if (process.env.NODE_ENV === "production") cache[locale] = merged;
  return merged;
}

export default getRequestConfig(async () => {
  const locale = defaultLocale;
  return { locale, messages: loadMessages(locale) };
});
