import type { AppData, Contribution, FixedCost, PotEntry } from "./types";
import { monthlyAmount, nextOccurrence, occurrencesWithin } from "./recurrence";

export const sumMonthlyContributions = (items: Contribution[]) =>
  items.reduce((s, c) => s + monthlyAmount(c.betrag, c.rhythmus), 0);

export const sumMonthly = (items: FixedCost[]) =>
  items.filter((f) => f.aktiv).reduce((s, f) => s + monthlyAmount(f.betrag, f.rhythmus), 0);

export const fixkosten = (data: AppData) => data.fixedCosts.filter((f) => f.typ === "fixkosten");
/** Konsum-Budgets (Lebensmittel, Freizeit, Puffer …). Intern weiter als typ "ruecklage" gespeichert. */
export const konsum = (data: AppData) => data.fixedCosts.filter((f) => f.typ === "ruecklage");

export interface MonthlyBalance {
  income: number;
  fixed: number;
  konsum: number;
  rest: number;
}

export function monthlyBalance(data: AppData): MonthlyBalance {
  const income = sumMonthlyContributions(data.contributions);
  const fixed = sumMonthly(fixkosten(data));
  const k = sumMonthly(konsum(data));
  return { income, fixed, konsum: k, rest: income - fixed - k };
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

export interface Flow {
  kind: "in" | "out";
  label: string;
  sub?: string;
  /** Vorzeichenbehaftet: rein > 0, raus < 0. */
  betrag: number;
  datum: string;
}

/**
 * Geldfluss der naechsten `days` Tage, chronologisch:
 * Einnahmen (rein) + Fixkosten-Abbuchungen (raus). Konsum-Budgets sind keine
 * datierten Buchungen und tauchen hier bewusst nicht auf.
 */
export function upcomingFlows(data: AppData, days: number): Flow[] {
  const out: Flow[] = [];
  for (const c of data.contributions) {
    if (!c.ersteFaelligkeit) continue;
    const who = data.members.find((m) => m.id === c.person)?.name;
    for (const datum of occurrencesWithin(c.ersteFaelligkeit, c.rhythmus, days)) {
      out.push({ kind: "in", label: c.label, sub: who, betrag: c.betrag, datum });
    }
  }
  for (const f of data.fixedCosts) {
    if (!f.aktiv || f.typ !== "fixkosten") continue;
    for (const datum of occurrencesWithin(f.ersteFaelligkeit, f.rhythmus, days)) {
      out.push({ kind: "out", label: f.name, betrag: -f.betrag, datum });
    }
  }
  return out.sort((a, b) => a.datum.localeCompare(b.datum));
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
