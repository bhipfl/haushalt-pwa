import type { ShopLocation } from "./types";
import { guessLocation, normalizeName } from "./categorize";

/**
 * Selbstlernende Abteilungs-Zuordnung. Korrigiert man einen Artikel von Hand,
 * merkt sich die App `name -> Abteilung` (lokal pro Geraet, offline) und nutzt
 * das beim naechsten Mal mit Vorrang vor dem statischen Woerterbuch.
 */

const KEY = "haushalt:learnedOrt:v1";

function load(): Record<string, ShopLocation> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, ShopLocation>) : {};
  } catch {
    return {};
  }
}

function save(map: Record<string, ShopLocation>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* localStorage nicht verfuegbar -> Lernen einfach ueberspringen */
  }
}

/** Merkt sich die Zuordnung name -> Abteilung. */
export function learnLocation(name: string, ort: ShopLocation): void {
  const key = normalizeName(name);
  if (!key) return;
  const map = load();
  map[key] = ort;
  save(map);
}

/** Gelerntes hat Vorrang, dann das Woerterbuch. null = nichts bekannt. */
export function resolveLocation(name: string): ShopLocation | null {
  const key = normalizeName(name);
  if (key) {
    const learned = load()[key];
    if (learned) return learned;
  }
  return guessLocation(name);
}
