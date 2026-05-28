import type { Cadence, ShopLocation } from "./types";

export const cadenceLabels: Record<Cadence, string> = {
  taeglich: "täglich",
  woechentlich: "wöchentlich",
  monatlich: "monatlich",
  vierteljaehrlich: "vierteljährlich",
  halbjaehrlich: "halbjährlich",
  jaehrlich: "jährlich",
  einmalig: "einmalig",
};

export const cadenceMonthlyFactor: Record<Cadence, number> = {
  taeglich: 365 / 12,
  woechentlich: 52 / 12,
  monatlich: 1,
  vierteljaehrlich: 1 / 3,
  halbjaehrlich: 1 / 6,
  jaehrlich: 1 / 12,
  einmalig: 0,
};

/** Auswahl fuer Geld-Rhythmen (ohne taeglich). */
export const moneyCadences: Cadence[] = [
  "monatlich",
  "vierteljaehrlich",
  "halbjaehrlich",
  "jaehrlich",
  "einmalig",
];

/** Auswahl fuer Aufgaben-Rhythmen. */
export const taskCadences: Cadence[] = [
  "taeglich",
  "woechentlich",
  "monatlich",
  "vierteljaehrlich",
  "halbjaehrlich",
  "jaehrlich",
  "einmalig",
];

interface LocationMeta {
  label: string;
  emoji: string;
  /** Reihenfolge entlang eines typischen Ladenwegs. */
  order: number;
}

export const shopLocations: Record<ShopLocation, LocationMeta> = {
  obst_gemuese: { label: "Obst & Gemüse", emoji: "🥦", order: 1 },
  backwaren: { label: "Backwaren", emoji: "🥐", order: 2 },
  kuehlregal: { label: "Kühlregal", emoji: "🧀", order: 3 },
  tiefkuehl: { label: "Tiefkühl", emoji: "🧊", order: 4 },
  trockenwaren: { label: "Trockenwaren", emoji: "🍝", order: 5 },
  konserven: { label: "Konserven", emoji: "🥫", order: 6 },
  suesses: { label: "Süßes & Snacks", emoji: "🍫", order: 7 },
  getraenke: { label: "Getränke", emoji: "🧃", order: 8 },
  drogerie: { label: "Drogerie", emoji: "🧴", order: 9 },
  haushalt: { label: "Haushalt", emoji: "🧻", order: 10 },
  sonstiges: { label: "Sonstiges", emoji: "🛒", order: 99 },
};

export const shopLocationOrder = (Object.keys(shopLocations) as ShopLocation[]).sort(
  (a, b) => shopLocations[a].order - shopLocations[b].order
);

/** Mitglieder-Farben zur Auswahl. */
export const memberColors = [
  "#0d9488",
  "#6366f1",
  "#db2777",
  "#ea580c",
  "#0891b2",
  "#7c3aed",
  "#16a34a",
  "#d97706",
];
