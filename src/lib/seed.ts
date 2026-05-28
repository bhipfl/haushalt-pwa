import { addDays, format, startOfMonth } from "date-fns";
import type { AppData } from "./types";
import { newId } from "./id";
import { todayISO } from "./recurrence";

const iso = (d: Date) => format(d, "yyyy-MM-dd");

/** Beispiel-Haushalt zum Ausprobieren (nur Demo-Modus). Ersetzt vorhandene Daten. */
export function demoData(): AppData {
  const anna = newId();
  const ben = newId();
  const monthStart = startOfMonth(new Date());
  const day = (n: number) => iso(addDays(monthStart, n - 1));

  const lebensmittel = newId();
  const urlaub = newId();
  const notgroschen = newId();
  const essengehen = newId();

  return {
    members: [
      { id: anna, name: "Anna", color: "#db2777" },
      { id: ben, name: "Ben", color: "#0d9488" },
    ],
    contributions: [
      { id: newId(), person: anna, label: "Beitrag", betrag: 1100, rhythmus: "monatlich" },
      { id: newId(), person: ben, label: "Beitrag", betrag: 1100, rhythmus: "monatlich" },
    ],
    fixedCosts: [
      { id: newId(), name: "Miete", typ: "fixkosten", betrag: 1250, rhythmus: "monatlich", ersteFaelligkeit: day(1), kategorie: "Wohnen", aktiv: true },
      { id: newId(), name: "Strom", typ: "fixkosten", betrag: 95, rhythmus: "monatlich", ersteFaelligkeit: day(3), kategorie: "Wohnen", aktiv: true },
      { id: newId(), name: "Internet & Telefon", typ: "fixkosten", betrag: 40, rhythmus: "monatlich", ersteFaelligkeit: day(5), kategorie: "Wohnen", aktiv: true },
      { id: newId(), name: "Handyvertrag", typ: "fixkosten", betrag: 30, rhythmus: "monatlich", ersteFaelligkeit: day(8), kategorie: "Kommunikation", aktiv: true },
      { id: newId(), name: "Rundfunkbeitrag", typ: "fixkosten", betrag: 55.08, rhythmus: "vierteljaehrlich", ersteFaelligkeit: day(15), kategorie: "Sonstiges", aktiv: true },
      { id: newId(), name: "Haftpflicht", typ: "fixkosten", betrag: 85, rhythmus: "jaehrlich", ersteFaelligkeit: day(20), kategorie: "Versicherung", aktiv: true },
      { id: newId(), name: "Hausratversicherung", typ: "fixkosten", betrag: 120, rhythmus: "jaehrlich", ersteFaelligkeit: day(22), kategorie: "Versicherung", aktiv: true },
      { id: lebensmittel, name: "Lebensmittel", typ: "ruecklage", betrag: 500, rhythmus: "monatlich", ersteFaelligkeit: day(1), kategorie: "Essen", aktiv: true },
      { id: essengehen, name: "Essen gehen", typ: "ruecklage", betrag: 150, rhythmus: "monatlich", ersteFaelligkeit: day(1), kategorie: "Freizeit", aktiv: true },
      { id: notgroschen, name: "Notgroschen", typ: "ruecklage", betrag: 200, rhythmus: "monatlich", ersteFaelligkeit: day(1), kategorie: "Sparen", aktiv: true },
      { id: urlaub, name: "Urlaub", typ: "ruecklage", betrag: 250, rhythmus: "monatlich", ersteFaelligkeit: day(1), kategorie: "Sparen", aktiv: true },
    ],
    potLedger: [
      { id: newId(), ruecklageId: notgroschen, datum: day(1), betrag: 1400, notiz: "Startbestand" },
      { id: newId(), ruecklageId: urlaub, datum: day(1), betrag: 750, notiz: "Startbestand" },
      { id: newId(), ruecklageId: lebensmittel, datum: day(2), betrag: 500 },
      { id: newId(), ruecklageId: lebensmittel, datum: day(6), betrag: -82.4, notiz: "Wocheneinkauf" },
    ],
    tasks: [
      { id: newId(), titel: "Müll & Gelber Sack rausbringen", rhythmus: "woechentlich", zustaendig: ben, naechsteFaelligkeit: todayISO(), aktiv: true },
      { id: newId(), titel: "Bad putzen", rhythmus: "woechentlich", zustaendig: anna, naechsteFaelligkeit: iso(addDays(new Date(), 2)), aktiv: true },
      { id: newId(), titel: "Staubsaugen & Wischen", rhythmus: "woechentlich", zustaendig: "beide", naechsteFaelligkeit: iso(addDays(new Date(), 1)), aktiv: true },
      { id: newId(), titel: "Wäsche waschen", rhythmus: "woechentlich", zustaendig: anna, naechsteFaelligkeit: iso(addDays(new Date(), -1)), aktiv: true },
      { id: newId(), titel: "Großeinkauf", rhythmus: "woechentlich", zustaendig: "beide", naechsteFaelligkeit: iso(addDays(new Date(), 3)), aktiv: true },
      { id: newId(), titel: "Blumen gießen", rhythmus: "taeglich", zustaendig: ben, naechsteFaelligkeit: todayISO(), aktiv: true },
    ],
    shopping: [
      { id: newId(), name: "Milch", ort: "kuehlregal", menge: "2 L", erledigt: false, addedBy: anna, recurring: true, createdAt: todayISO() },
      { id: newId(), name: "Joghurt", ort: "kuehlregal", erledigt: false, addedBy: ben, createdAt: todayISO() },
      { id: newId(), name: "Äpfel", ort: "obst_gemuese", menge: "1 kg", erledigt: false, addedBy: anna, createdAt: todayISO() },
      { id: newId(), name: "Bananen", ort: "obst_gemuese", erledigt: true, addedBy: ben, createdAt: todayISO() },
      { id: newId(), name: "Vollkornbrot", ort: "backwaren", erledigt: false, addedBy: anna, recurring: true, createdAt: todayISO() },
      { id: newId(), name: "Nudeln", ort: "trockenwaren", menge: "500 g", erledigt: false, addedBy: ben, createdAt: todayISO() },
      { id: newId(), name: "Spülmittel", ort: "haushalt", erledigt: false, addedBy: anna, createdAt: todayISO() },
    ],
    privateExpenses: [
      { id: newId(), datum: day(4), person: ben, betrag: 34.9, notiz: "Geschenk Nachbarn (gemeinsam)", erstattet: false },
    ],
  };
}
