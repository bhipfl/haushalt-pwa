import type { AppData, Op } from "./types";
import { addCadence, toISODate } from "./recurrence";
import { parseISO } from "date-fns";

const upsert = <T extends { id: string }>(arr: T[], item: T): T[] => {
  const i = arr.findIndex((x) => x.id === item.id);
  if (i === -1) return [...arr, item];
  const copy = arr.slice();
  copy[i] = item;
  return copy;
};

const without = <T extends { id: string }>(arr: T[], id: string): T[] =>
  arr.filter((x) => x.id !== id);

/** Reine Funktion: wendet eine Operation auf den Zustand an. Wird vom
 *  Demo-Backend UND fuer optimistische UI-Updates genutzt. */
export function applyOp(data: AppData, op: Op): AppData {
  switch (op.action) {
    case "members.add":
    case "members.update":
      return { ...data, members: upsert(data.members, op.payload) };
    case "members.remove":
      return { ...data, members: without(data.members, op.payload.id) };

    case "shopping.add":
    case "shopping.update":
      return { ...data, shopping: upsert(data.shopping, op.payload) };
    case "shopping.toggle":
      return {
        ...data,
        shopping: data.shopping.map((s) =>
          s.id === op.payload.id ? { ...s, erledigt: !s.erledigt } : s
        ),
      };
    case "shopping.remove":
      return { ...data, shopping: without(data.shopping, op.payload.id) };
    case "shopping.clearChecked":
      return { ...data, shopping: data.shopping.filter((s) => !s.erledigt) };

    case "contributions.add":
    case "contributions.update":
      return { ...data, contributions: upsert(data.contributions, op.payload) };
    case "contributions.remove":
      return { ...data, contributions: without(data.contributions, op.payload.id) };

    case "fixedcosts.add":
    case "fixedcosts.update":
      return { ...data, fixedCosts: upsert(data.fixedCosts, op.payload) };
    case "fixedcosts.remove":
      return { ...data, fixedCosts: without(data.fixedCosts, op.payload.id) };

    case "pots.entry":
      return { ...data, potLedger: upsert(data.potLedger, op.payload) };
    case "pots.removeEntry":
      return { ...data, potLedger: without(data.potLedger, op.payload.id) };

    case "tasks.add":
    case "tasks.update":
      return { ...data, tasks: upsert(data.tasks, op.payload) };
    case "tasks.remove":
      return { ...data, tasks: without(data.tasks, op.payload.id) };
    case "tasks.complete": {
      return {
        ...data,
        tasks: data.tasks.map((t) => {
          if (t.id !== op.payload.id) return t;
          const next =
            t.rhythmus === "einmalig"
              ? t.naechsteFaelligkeit
              : toISODate(addCadence(parseISO(op.payload.when), t.rhythmus));
          return {
            ...t,
            zuletztErledigt: op.payload.when,
            erledigtVon: op.payload.doneBy,
            naechsteFaelligkeit: next,
            aktiv: t.rhythmus === "einmalig" ? false : t.aktiv,
          };
        }),
      };
    }

    case "private.add":
    case "private.update":
      return { ...data, privateExpenses: upsert(data.privateExpenses, op.payload) };
    case "private.remove":
      return { ...data, privateExpenses: without(data.privateExpenses, op.payload.id) };

    case "data.replace":
      return op.payload;

    default:
      return data;
  }
}
