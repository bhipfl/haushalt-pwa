import type { AppData, Contribution, FixedCost, PotEntry } from "./types";
import { monthlyAmount, nextOccurrence, occurrencesWithin } from "./recurrence";

export const sumMonthlyContributions = (items: Contribution[]) =>
  items.reduce((s, c) => s + monthlyAmount(c.betrag, c.rhythmus), 0);

export const sumMonthly = (items: FixedCost[]) =>
  items.filter((f) => f.aktiv).reduce((s, f) => s + monthlyAmount(f.betrag, f.rhythmus), 0);

export const fixkosten = (data: AppData) => data.fixedCosts.filter((f) => f.typ === "fixkosten");
export const ruecklagen = (data: AppData) => data.fixedCosts.filter((f) => f.typ === "ruecklage");

export interface MonthlyBalance {
  income: number;
  fixed: number;
  reserves: number;
  rest: number;
}

export function monthlyBalance(data: AppData): MonthlyBalance {
  const income = sumMonthlyContributions(data.contributions);
  const fixed = sumMonthly(fixkosten(data));
  const reserves = sumMonthly(ruecklagen(data));
  return { income, fixed, reserves, rest: income - fixed - reserves };
}

export const potBalance = (ledger: PotEntry[], ruecklageId: string) =>
  ledger.filter((e) => e.ruecklageId === ruecklageId).reduce((s, e) => s + e.betrag, 0);

export interface Debit {
  fc: FixedCost;
  datum: string;
}

/** Anstehende Abbuchungen der naechsten `days` Tage, chronologisch. */
export function upcomingDebits(data: AppData, days: number): Debit[] {
  const out: Debit[] = [];
  for (const fc of data.fixedCosts) {
    if (!fc.aktiv) continue;
    for (const datum of occurrencesWithin(fc.ersteFaelligkeit, fc.rhythmus, days)) {
      out.push({ fc, datum });
    }
  }
  return out.sort((a, b) => a.datum.localeCompare(b.datum));
}

/** Naechste Abbuchung je Fixkostenposten (fuer Listenansicht). */
export function nextDebit(fc: FixedCost): string {
  return nextOccurrence(fc.ersteFaelligkeit, fc.rhythmus);
}

/** Saldo der privaten Auslagen je Person (nicht erstattet). */
export function privateBalances(data: AppData): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of data.privateExpenses) {
    if (e.erstattet) continue;
    out[e.person] = (out[e.person] ?? 0) + e.betrag;
  }
  return out;
}
