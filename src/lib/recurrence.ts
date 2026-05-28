import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  format,
  isBefore,
  parseISO,
  startOfDay,
} from "date-fns";
import type { Cadence } from "./types";
import { cadenceMonthlyFactor } from "./constants";

export const todayISO = () => format(new Date(), "yyyy-MM-dd");

export function toISODate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function addCadence(date: Date, cadence: Cadence): Date {
  switch (cadence) {
    case "taeglich":
      return addDays(date, 1);
    case "woechentlich":
      return addWeeks(date, 1);
    case "monatlich":
      return addMonths(date, 1);
    case "vierteljaehrlich":
      return addMonths(date, 3);
    case "halbjaehrlich":
      return addMonths(date, 6);
    case "jaehrlich":
      return addYears(date, 1);
    case "einmalig":
      return date;
  }
}

/** Naechstes Auftreten >= ref (Tagesgenau). Bei "einmalig" das Startdatum selbst. */
export function nextOccurrence(start: string, cadence: Cadence, ref: Date = new Date()): string {
  let d = startOfDay(parseISO(start));
  if (cadence === "einmalig") return toISODate(d);
  const r = startOfDay(ref);
  let guard = 0;
  while (isBefore(d, r) && guard++ < 10000) d = addCadence(d, cadence);
  return toISODate(d);
}

/** Liste der naechsten Auftreten innerhalb von `days` Tagen ab heute. */
export function occurrencesWithin(start: string, cadence: Cadence, days: number): string[] {
  const out: string[] = [];
  const limit = addDays(startOfDay(new Date()), days);
  let d = startOfDay(parseISO(nextOccurrence(start, cadence)));
  let guard = 0;
  while (!isBefore(limit, d) && guard++ < 1000) {
    out.push(toISODate(d));
    if (cadence === "einmalig") break;
    d = addCadence(d, cadence);
  }
  return out;
}

export function monthlyAmount(betrag: number, cadence: Cadence): number {
  return betrag * cadenceMonthlyFactor[cadence];
}

export function yearlyAmount(betrag: number, cadence: Cadence): number {
  return monthlyAmount(betrag, cadence) * 12;
}

export function daysUntil(iso: string): number {
  return differenceInCalendarDays(startOfDay(parseISO(iso)), startOfDay(new Date()));
}
