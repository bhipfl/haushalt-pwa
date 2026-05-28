/** Parst eine deutsche/englische Betragseingabe ("12,50" oder "12.50") zu Number. */
export function parseAmount(s: string): number {
  const n = Number(String(s).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
