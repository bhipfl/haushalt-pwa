export type ID = string;

export type Cadence =
  | "taeglich"
  | "woechentlich"
  | "monatlich"
  | "vierteljaehrlich"
  | "halbjaehrlich"
  | "jaehrlich"
  | "einmalig";

export interface Member {
  id: ID;
  name: string;
  color: string;
}

export type ShopLocation =
  | "obst_gemuese"
  | "kuehlregal"
  | "tiefkuehl"
  | "backwaren"
  | "trockenwaren"
  | "konserven"
  | "suesses"
  | "getraenke"
  | "drogerie"
  | "haushalt"
  | "sonstiges";

export interface ShoppingItem {
  id: ID;
  name: string;
  ort: ShopLocation;
  menge?: string;
  erledigt: boolean;
  addedBy?: ID;
  recurring?: boolean;
  createdAt: string;
}

export interface Contribution {
  id: ID;
  person: ID;
  label: string;
  betrag: number;
  rhythmus: Cadence;
  /** Optional: wann das Geld (erstmals) reinkommt, fuer die Geldfluss-Timeline. */
  ersteFaelligkeit?: string; // yyyy-MM-dd
}

export type FixedCostType = "fixkosten" | "ruecklage";

export interface FixedCost {
  id: ID;
  name: string;
  typ: FixedCostType;
  betrag: number;
  rhythmus: Cadence;
  ersteFaelligkeit: string; // yyyy-MM-dd
  kategorie?: string;
  aktiv: boolean;
  notiz?: string;
}

/** Buchung auf einem Ruecklagen-Topf. betrag > 0 = Einlage, < 0 = Entnahme. */
export interface PotEntry {
  id: ID;
  ruecklageId: ID;
  datum: string; // yyyy-MM-dd
  betrag: number;
  notiz?: string;
}

/** zustaendig: Member-ID oder der Literal "beide". */
export interface Task {
  id: ID;
  titel: string;
  rhythmus: Cadence;
  zustaendig: string;
  naechsteFaelligkeit: string; // yyyy-MM-dd
  zuletztErledigt?: string;
  erledigtVon?: ID;
  aktiv: boolean;
}

export interface PrivateExpense {
  id: ID;
  datum: string;
  person: ID;
  betrag: number;
  notiz?: string;
  erstattet: boolean;
}

export interface AppData {
  members: Member[];
  shopping: ShoppingItem[];
  contributions: Contribution[];
  fixedCosts: FixedCost[];
  potLedger: PotEntry[];
  tasks: Task[];
  privateExpenses: PrivateExpense[];
}

export function emptyData(): AppData {
  return {
    members: [],
    shopping: [],
    contributions: [],
    fixedCosts: [],
    potLedger: [],
    tasks: [],
    privateExpenses: [],
  };
}

export type Op =
  | { action: "members.add"; payload: Member }
  | { action: "members.update"; payload: Member }
  | { action: "members.remove"; payload: { id: ID } }
  | { action: "shopping.add"; payload: ShoppingItem }
  | { action: "shopping.update"; payload: ShoppingItem }
  | { action: "shopping.toggle"; payload: { id: ID } }
  | { action: "shopping.remove"; payload: { id: ID } }
  | { action: "shopping.clearChecked"; payload: Record<string, never> }
  | { action: "contributions.add"; payload: Contribution }
  | { action: "contributions.update"; payload: Contribution }
  | { action: "contributions.remove"; payload: { id: ID } }
  | { action: "fixedcosts.add"; payload: FixedCost }
  | { action: "fixedcosts.update"; payload: FixedCost }
  | { action: "fixedcosts.remove"; payload: { id: ID } }
  | { action: "pots.entry"; payload: PotEntry }
  | { action: "pots.removeEntry"; payload: { id: ID } }
  | { action: "tasks.add"; payload: Task }
  | { action: "tasks.update"; payload: Task }
  | { action: "tasks.remove"; payload: { id: ID } }
  | { action: "tasks.complete"; payload: { id: ID; doneBy: ID; when: string } }
  | { action: "private.add"; payload: PrivateExpense }
  | { action: "private.update"; payload: PrivateExpense }
  | { action: "private.remove"; payload: { id: ID } }
  | { action: "data.replace"; payload: AppData };
