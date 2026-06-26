/**
 * Admin form helpers. Rates are stored as decimals (0.0456) but edited as
 * percentages (4.56) — convert at the UI/action boundary and round to kill
 * float noise so calc-engine parity is preserved.
 */

/** Stored decimal (0.0456) → percent for display (4.56). */
export function toPct(decimal: number): number {
  return Math.round(decimal * 1e6) / 1e4;
}

/** Edited percent string ("4.56") → stored decimal (0.0456). */
export function fromPct(value: FormDataEntryValue | null): number {
  return Math.round((Number(value) / 100) * 1e8) / 1e8;
}

/** Optional stored decimal → percent for display, or "" when null. */
export function toPctOpt(decimal: number | null): string {
  return decimal === null ? "" : String(toPct(decimal));
}

/** Optional edited percent → stored decimal, or null when empty. */
export function optPct(value: FormDataEntryValue | null): number | null {
  const s = String(value ?? "").trim();
  return s === "" ? null : Math.round((Number(s) / 100) * 1e8) / 1e8;
}

/** Parse a numeric form field. */
export function num(value: FormDataEntryValue | null): number {
  return Number(value);
}

/** Parse an integer form field. */
export function int(value: FormDataEntryValue | null): number {
  return Math.trunc(Number(value));
}

/** Parse an optional numeric field — empty string ⇒ null. */
export function optNum(value: FormDataEntryValue | null): number | null {
  const s = String(value ?? "").trim();
  return s === "" ? null : Number(s);
}

/** Parse an optional integer field — empty string ⇒ null. */
export function optInt(value: FormDataEntryValue | null): number | null {
  const n = optNum(value);
  return n === null ? null : Math.trunc(n);
}

/** Parse an optional text field — empty string ⇒ null. */
export function optStr(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s === "" ? null : s;
}
