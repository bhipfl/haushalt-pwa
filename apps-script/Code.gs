/**
 * Haushalt-PWA – Backend (Google Apps Script Web-App auf einem Google Sheet).
 *
 * EINRICHTUNG (einmalig):
 *  1. Neues Google Sheet anlegen -> Erweiterungen -> Apps Script.
 *  2. Diesen Code komplett einfuegen, unten HOUSEHOLD_PIN aendern, speichern.
 *  3. Bereitstellen -> Neue Bereitstellung -> Typ "Web-App".
 *       - Ausfuehren als: Ich
 *       - Zugriff: Jede:r (auch anonym)
 *  4. Web-App-URL kopieren und im Frontend als VITE_API_URL hinterlegen.
 *  Die benoetigten Tabs werden beim ersten Aufruf automatisch angelegt.
 */

const HOUSEHOLD_PIN = "1234"; // <-- HIER EUREN GEMEINSAMEN PIN EINTRAGEN

/* ----- Schema: [feldname, typ] je Tab. id muss immer Spalte 1 sein. ----- */
const SCHEMAS = {
  Members: [["id", "s"], ["name", "s"], ["color", "s"]],
  Shopping: [
    ["id", "s"], ["name", "s"], ["ort", "s"], ["menge", "s"],
    ["erledigt", "b"], ["addedBy", "s"], ["recurring", "b"], ["createdAt", "s"],
  ],
  Contributions: [["id", "s"], ["person", "s"], ["label", "s"], ["betrag", "n"], ["rhythmus", "s"]],
  FixedCosts: [
    ["id", "s"], ["name", "s"], ["typ", "s"], ["betrag", "n"], ["rhythmus", "s"],
    ["ersteFaelligkeit", "s"], ["kategorie", "s"], ["aktiv", "b"], ["notiz", "s"],
  ],
  PotLedger: [["id", "s"], ["ruecklageId", "s"], ["datum", "s"], ["betrag", "n"], ["notiz", "s"]],
  Tasks: [
    ["id", "s"], ["titel", "s"], ["rhythmus", "s"], ["zustaendig", "s"],
    ["naechsteFaelligkeit", "s"], ["zuletztErledigt", "s"], ["erledigtVon", "s"], ["aktiv", "b"],
  ],
  PrivateExpenses: [
    ["id", "s"], ["datum", "s"], ["person", "s"], ["betrag", "n"], ["notiz", "s"], ["erstattet", "b"],
  ],
};

// AppData-Schluessel -> Tab-Name
const TAB_FOR_KEY = {
  members: "Members",
  shopping: "Shopping",
  contributions: "Contributions",
  fixedCosts: "FixedCosts",
  potLedger: "PotLedger",
  tasks: "Tasks",
  privateExpenses: "PrivateExpenses",
};

// Action-Praefix -> Tab-Name
const TAB_FOR_PREFIX = {
  members: "Members",
  shopping: "Shopping",
  contributions: "Contributions",
  fixedcosts: "FixedCosts",
  pots: "PotLedger",
  tasks: "Tasks",
  private: "PrivateExpenses",
};

/* --------------------------- Web-App-Endpunkte --------------------------- */

function doGet(e) {
  try {
    const action = e.parameter.action;
    if (!checkPin(e.parameter.pin)) return authError();
    if (action === "bootstrap") return ok(buildAppData());
    return error("Unbekannte Aktion: " + action);
  } catch (err) {
    return error(String(err));
  }
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return error("Ungueltiger Body");
  }
  if (!checkPin(body.pin)) return authError();

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    handle(body.action, body.payload || {});
    return ok(buildAppData());
  } catch (err) {
    return error(String(err));
  } finally {
    lock.releaseLock();
  }
}

/* ------------------------------ Mutationen ------------------------------- */

function handle(action, payload) {
  if (action === "data.replace") {
    for (const key in TAB_FOR_KEY) rewriteAll(TAB_FOR_KEY[key], payload[key] || []);
    return;
  }

  const [prefix, op] = action.split(".");

  if (prefix === "shopping" && op === "toggle") {
    const item = getById("Shopping", payload.id);
    if (item) {
      item.erledigt = !item.erledigt;
      upsert("Shopping", item);
    }
    return;
  }
  if (action === "shopping.clearChecked") {
    const rest = readSheet("Shopping").filter((x) => !x.erledigt);
    rewriteAll("Shopping", rest);
    return;
  }
  if (prefix === "tasks" && op === "complete") {
    const t = getById("Tasks", payload.id);
    if (t) {
      t.zuletztErledigt = payload.when;
      t.erledigtVon = payload.doneBy;
      t.naechsteFaelligkeit =
        t.rhythmus === "einmalig" ? t.naechsteFaelligkeit : addCadence(payload.when, t.rhythmus);
      if (t.rhythmus === "einmalig") t.aktiv = false;
      upsert("Tasks", t);
    }
    return;
  }
  if (prefix === "pots") {
    if (op === "entry") upsert("PotLedger", payload);
    else if (op === "removeEntry") removeById("PotLedger", payload.id);
    return;
  }

  const tab = TAB_FOR_PREFIX[prefix];
  if (!tab) throw new Error("Unbekannter Bereich: " + prefix);
  if (op === "add" || op === "update") upsert(tab, payload);
  else if (op === "remove") removeById(tab, payload.id);
  else throw new Error("Unbekannte Operation: " + action);
}

/* --------------------------- Sheet-Zugriff ------------------------------- */

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  const schema = SCHEMAS[name];
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(schema.map((c) => c[0]));
    sh.setFrozenRows(1);
  } else if (sh.getLastRow() === 0) {
    sh.appendRow(schema.map((c) => c[0]));
    sh.setFrozenRows(1);
  }
  return sh;
}

function readSheet(name) {
  const sh = getSheet(name);
  const schema = SCHEMAS[name];
  const last = sh.getLastRow();
  if (last < 2) return [];
  const values = sh.getRange(2, 1, last - 1, schema.length).getValues();
  return values
    .filter((row) => row[0] !== "" && row[0] !== null)
    .map((row) => {
      const obj = {};
      schema.forEach(([key, type], i) => {
        let v = row[i];
        // Sheets wandelt Datums-Strings automatisch in Date-Werte -> zurueck zu yyyy-MM-dd
        if (v instanceof Date) v = Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd");
        if (type === "b") obj[key] = v === true || v === "TRUE" || v === "true";
        else if (type === "n") obj[key] = v === "" || v === null ? 0 : Number(v);
        else if (v !== "" && v !== null) obj[key] = String(v);
      });
      return obj;
    });
}

function getById(name, id) {
  return readSheet(name).find((x) => x.id === id) || null;
}

function rowFor(name, obj) {
  return SCHEMAS[name].map(([key, type]) => {
    const v = obj[key];
    if (v === undefined || v === null) return type === "b" ? false : type === "n" ? 0 : "";
    if (type === "n") return Number(v);
    if (type === "b") return !!v;
    return v;
  });
}

function upsert(name, obj) {
  const sh = getSheet(name);
  const last = sh.getLastRow();
  const ids = last < 2 ? [] : sh.getRange(2, 1, last - 1, 1).getValues().map((r) => r[0]);
  const idx = ids.indexOf(obj.id);
  const row = rowFor(name, obj);
  if (idx === -1) sh.appendRow(row);
  else sh.getRange(idx + 2, 1, 1, row.length).setValues([row]);
}

function removeById(name, id) {
  const sh = getSheet(name);
  const last = sh.getLastRow();
  if (last < 2) return;
  const ids = sh.getRange(2, 1, last - 1, 1).getValues().map((r) => r[0]);
  const idx = ids.indexOf(id);
  if (idx > -1) sh.deleteRow(idx + 2);
}

function rewriteAll(name, objs) {
  const sh = getSheet(name);
  const schema = SCHEMAS[name];
  const last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, schema.length).clearContent();
  if (!objs || !objs.length) return;
  const rows = objs.map((o) => rowFor(name, o));
  sh.getRange(2, 1, rows.length, schema.length).setValues(rows);
}

function buildAppData() {
  const data = {};
  for (const key in TAB_FOR_KEY) data[key] = readSheet(TAB_FOR_KEY[key]);
  return data;
}

/* ------------------------------ Helfer ----------------------------------- */

function addCadence(dateStr, cadence) {
  const d = new Date(dateStr + "T00:00:00");
  switch (cadence) {
    case "taeglich": d.setDate(d.getDate() + 1); break;
    case "woechentlich": d.setDate(d.getDate() + 7); break;
    case "monatlich": d.setMonth(d.getMonth() + 1); break;
    case "vierteljaehrlich": d.setMonth(d.getMonth() + 3); break;
    case "halbjaehrlich": d.setMonth(d.getMonth() + 6); break;
    case "jaehrlich": d.setFullYear(d.getFullYear() + 1); break;
    default: return dateStr;
  }
  return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function checkPin(pin) {
  return String(pin) === String(HOUSEHOLD_PIN);
}

function ok(data) {
  return json({ ok: true, data: data });
}
function error(msg) {
  return json({ ok: false, error: msg });
}
function authError() {
  return json({ ok: false, code: "AUTH", error: "PIN ist nicht korrekt." });
}
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
