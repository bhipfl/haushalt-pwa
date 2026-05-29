import type { ShopLocation } from "./types";

/**
 * Heuristische Zuordnung eines Artikelnamens zu einer Laden-Abteilung.
 * Deutsch, inkl. typischer Komposita (z. B. "Apfelsaft" -> Getränke).
 * Erkennung per Teilstring; bei mehreren Treffern gewinnt das laengste
 * Stichwort (so schlaegt "apfelsaft" das kuerzere "apfel").
 */

const KEYWORDS: Record<ShopLocation, string[]> = {
  obst_gemuese: [
    "apfel", "äpfel", "banane", "birne", "traube", "weintraube", "beere", "erdbeere",
    "himbeere", "heidelbeere", "blaubeere", "brombeere", "preiselbeere", "orange", "mandarine",
    "clementine", "zitrone", "limette", "kiwi", "ananas", "mango", "melone", "wassermelone",
    "pfirsich", "nektarine", "pflaume", "kirsche", "avocado", "tomate", "gurke", "paprika",
    "zwiebel", "knoblauch", "kartoffel", "karotte", "möhre", "salat", "kopfsalat", "spinat",
    "brokkoli", "blumenkohl", "zucchini", "aubergine", "pilz", "champignon", "lauch",
    "porree", "sellerie", "rettich", "radieschen", "kürbis", "ingwer", "kräuter", "petersilie",
    "basilikum", "schnittlauch", "rucola", "feldsalat", "spargel", "fenchel", "kohl",
    "rosenkohl", "granatapfel", "feige", "weintrauben", "obst", "gemüse", "rhabarber",
  ],
  backwaren: [
    "brot", "brötchen", "semmel", "baguette", "toast", "toastbrot", "croissant", "brezel",
    "brezn", "kuchen", "torte", "gebäck", "hörnchen", "vollkornbrot", "knäckebrot", "zwieback",
    "bagel", "ciabatta", "fladenbrot", "muffin", "donut", "laugenstange", "körnerbrötchen",
  ],
  kuehlregal: [
    "milch", "buttermilch", "butter", "käse", "joghurt", "jogurt", "quark", "sahne", "schmand",
    "crème fraîche", "creme fraiche", "frischkäse", "mozzarella", "feta", "gouda", "parmesan",
    "hüttenkäse", "mascarpone", "ricotta", "margarine", "eier", "wurst", "schinken", "salami",
    "aufschnitt", "fleisch", "hackfleisch", "hähnchen", "hühnchen", "pute", "rind", "schwein",
    "steak", "würstchen", "bratwurst", "fisch", "lachs", "forelle", "garnelen", "tofu", "hummus",
    "pudding", "dessert", "kefir", "ayran", "leberwurst", "mett", "speck", "bacon", "fleischwurst",
    "tortellini", "gnocchi", "tortilla wraps",
  ],
  tiefkuehl: [
    "tiefkühl", "tiefkühlpizza", "eis", "eiscreme", "speiseeis", "pizza", "pommes",
    "fischstäbchen", "gefroren", "blätterteig", "rahmspinat", "tk",
  ],
  trockenwaren: [
    "nudel", "nudeln", "pasta", "spaghetti", "penne", "fusilli", "maccaroni", "makkaroni",
    "reis", "mehl", "zucker", "puderzucker", "salz", "pfeffer", "gewürz", "müsli", "müesli",
    "haferflocken", "cornflakes", "cerealien", "getreide", "linsen", "kichererbsen", "couscous",
    "bulgur", "quinoa", "grieß", "polenta", "öl", "olivenöl", "sonnenblumenöl", "essig",
    "ketchup", "senf", "mayo", "mayonnaise", "honig", "marmelade", "konfitüre", "nutella",
    "nussnougatcreme", "erdnussbutter", "tee", "kaffee", "kakao", "backpulver", "hefe",
    "vanillezucker", "paniermehl", "brühe", "tomatenmark", "passata", "kokosmilch", "sojasoße",
    "sojasauce", "brotaufstrich", "milchreis", "pesto", "dressing", "soße", "sauce",
  ],
  konserven: [
    "dose", "konserve", "mais", "kidneybohnen", "thunfisch", "sardinen", "sauerkraut",
    "oliven", "antipasti", "gewürzgurken", "rotkohl", "kichererbsen dose", "ananas dose",
  ],
  suesses: [
    "schokolade", "schoko", "riegel", "müsliriegel", "keks", "kekse", "gummibärchen", "bonbon",
    "lakritz", "chips", "flips", "cracker", "salzstangen", "nüsse", "erdnüsse", "mandeln",
    "studentenfutter", "popcorn", "snack", "praline", "waffel", "kaugummi", "haribo", "milka",
    "smarties", "schokoriegel",
  ],
  getraenke: [
    "wasser", "sprudel", "mineralwasser", "saft", "apfelsaft", "orangensaft", "multivitaminsaft",
    "limo", "limonade", "cola", "fanta", "sprite", "eistee", "bier", "wein", "rotwein", "weißwein",
    "sekt", "prosecco", "schnaps", "vodka", "wodka", "whiskey", "gin", "energy", "redbull",
    "smoothie", "getränk", "softdrink", "tonic", "spezi", "radler", "saftschorle", "schorle",
  ],
  drogerie: [
    "shampoo", "duschgel", "seife", "handseife", "zahnpasta", "zahnbürste", "zahncreme",
    "zahnseide", "deo", "deodorant", "rasierer", "rasierschaum", "bodylotion", "windel",
    "tampon", "binde", "watte", "wattestäbchen", "pflaster", "medikament", "tablette", "vitamine",
    "sonnencreme", "haarspray", "haargel", "parfüm", "makeup", "schminke", "feuchttücher",
    "kosmetik", "nagellack", "abschminktücher", "gesichtscreme", "handcreme",
  ],
  haushalt: [
    "spülmittel", "spüli", "geschirrspül", "spülmaschinentabs", "spülmaschine", "waschmittel",
    "weichspüler", "putzmittel", "allzweckreiniger", "reiniger", "schwamm", "spüllappen",
    "müllbeutel", "müllsack", "klopapier", "toilettenpapier", "küchenrolle", "küchentücher",
    "taschentücher", "alufolie", "frischhaltefolie", "backpapier", "batterie", "glühbirne",
    "kerze", "streichholz", "feuerzeug", "servietten", "zewa", "klarspüler", "badreiniger",
    "gefrierbeutel", "müllbeutel", "geschirrtuch",
  ],
  sonstiges: [],
};

/** Normalisiert einen Namen fuer Vergleich/Lern-Schluessel (klein, ohne Umlaute/Sonderzeichen). */
export function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Stichwoerter vorab normalisieren (einmalig).
const NORM_KEYWORDS: { loc: ShopLocation; kw: string }[] = (
  Object.keys(KEYWORDS) as ShopLocation[]
).flatMap((loc) => KEYWORDS[loc].map((kw) => ({ loc, kw: normalizeName(kw) })));

/** Rät die Abteilung anhand des Namens. null = nichts erkannt. */
export function guessLocation(raw: string): ShopLocation | null {
  const s = normalizeName(raw);
  if (!s) return null;
  let best: { loc: ShopLocation; len: number } | null = null;
  for (const { loc, kw } of NORM_KEYWORDS) {
    if (kw.length >= 3 && s.includes(kw) && (!best || kw.length > best.len)) {
      best = { loc, len: kw.length };
    }
  }
  return best ? best.loc : null;
}

/**
 * Trennt eine Eingabe in mehrere Artikel (Komma/Zeilenumbruch) und erkennt je
 * Artikel eine fuehrende Menge, z. B. "2 L Milch" -> { name: "Milch", menge: "2 L" }.
 */
export function parseItems(raw: string): { name: string; menge?: string }[] {
  return raw
    .split(/[,\n;]+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(parseOne);
}

function parseOne(s: string): { name: string; menge?: string } {
  // fuehrende Zahl (+ optionale Einheit/Stueck) als Menge abtrennen
  const m = s.match(/^(\d+(?:[.,]\d+)?\s*[a-zA-Zäöü]{0,5}\.?)\s+(.+)$/);
  if (m && m[2].trim()) {
    return { name: m[2].trim(), menge: m[1].trim().replace(/\s+/g, " ") };
  }
  return { name: s };
}
