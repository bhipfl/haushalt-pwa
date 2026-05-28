import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { daysUntil } from "./recurrence";

const eurFmt = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export const eur = (n: number) => eurFmt.format(Number.isFinite(n) ? n : 0);

export const eurCompact = (n: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);

export const formatDate = (iso: string) => format(parseISO(iso), "dd.MM.yyyy", { locale: de });

export const formatDateShort = (iso: string) => format(parseISO(iso), "dd. MMM", { locale: de });

export const formatMonth = (iso: string) => format(parseISO(iso), "MMMM yyyy", { locale: de });

export const weekday = (iso: string) => format(parseISO(iso), "EEEE", { locale: de });

/** "heute", "morgen", "in 3 Tagen", "vor 2 Tagen" */
export function relativeDay(iso: string): string {
  const d = daysUntil(iso);
  if (d === 0) return "heute";
  if (d === 1) return "morgen";
  if (d === -1) return "gestern";
  if (d > 1) return `in ${d} Tagen`;
  return `vor ${Math.abs(d)} Tagen`;
}
