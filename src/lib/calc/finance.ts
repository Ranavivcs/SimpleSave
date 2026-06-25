/** Low-level financial primitives. Ported verbatim from the source simulator. */

/** Safe numeric coercion: non-finite → 0. */
export function num(v: unknown): number {
  const n = parseFloat(v as string);
  return isFinite(n) ? n : 0;
}

/**
 * Loan payment (Excel PMT semantics, returns a negative number for an outflow).
 * @param r monthly rate, @param n number of periods, @param pv present value.
 */
export function PMT(r: number, n: number, pv: number): number {
  if (n <= 0) return 0;
  if (r === 0) return -pv / n;
  return -(r * pv) / (1 - Math.pow(1 + r, -n));
}
