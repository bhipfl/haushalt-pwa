import { emptyData, type AppData, type Op } from "../types";
import { AuthError, type Backend } from "./types";

const URL = import.meta.env.VITE_API_URL as string;

interface ApiResponse {
  ok: boolean;
  data?: AppData;
  error?: string;
  code?: string;
}

const MONTHS: Record<string, string> = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

/**
 * Google Sheets wandelt Datums-Strings in echte Datums-Werte um; Apps Script
 * liefert sie dann als locale-String (z. B. "Mon Jun 01 2026 00:00:00 GMT+0200").
 * Hier normalisieren wir alles zurueck auf "yyyy-MM-dd".
 */
function normDate(v?: string): string | undefined {
  if (!v) return v;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  // Format "Wkd Mon DD YYYY ..." (locale-unabhaengiges Englisch von Date.toString)
  const m = v.match(/[A-Za-z]{3}\s+([A-Za-z]{3})\s+(\d{1,2})\s+(\d{4})/);
  if (m && MONTHS[m[1]]) {
    return `${m[3]}-${MONTHS[m[1]]}-${m[2].padStart(2, "0")}`;
  }
  const d = new Date(v);
  if (!isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  }
  return v;
}

function normalize(data: AppData): AppData {
  data.shopping?.forEach((s) => (s.createdAt = normDate(s.createdAt) as string));
  data.contributions?.forEach((c) => (c.ersteFaelligkeit = normDate(c.ersteFaelligkeit)));
  data.fixedCosts?.forEach((f) => (f.ersteFaelligkeit = normDate(f.ersteFaelligkeit) as string));
  data.potLedger?.forEach((p) => (p.datum = normDate(p.datum) as string));
  data.tasks?.forEach((t) => {
    t.naechsteFaelligkeit = normDate(t.naechsteFaelligkeit) as string;
    t.zuletztErledigt = normDate(t.zuletztErledigt);
  });
  data.privateExpenses?.forEach((e) => (e.datum = normDate(e.datum) as string));
  return data;
}

async function handle(res: Response): Promise<AppData> {
  let json: ApiResponse;
  try {
    json = (await res.json()) as ApiResponse;
  } catch {
    throw new Error("Unerwartete Antwort vom Server.");
  }
  if (!json.ok) {
    if (json.code === "AUTH") throw new AuthError(json.error);
    throw new Error(json.error || "Serverfehler.");
  }
  return normalize({ ...emptyData(), ...(json.data as AppData) });
}

/** Live-Backend: Google Apps Script Web-App auf einem Google Sheet. */
export const appsScriptBackend: Backend = {
  mode: "live",
  async bootstrap(pin: string) {
    const u = `${URL}?action=bootstrap&pin=${encodeURIComponent(pin)}`;
    const res = await fetch(u, { method: "GET", redirect: "follow" });
    return handle(res);
  },
  async mutate(pin: string, op: Op) {
    // text/plain => "simple request" => kein CORS-Preflight bei Apps Script
    const res = await fetch(URL, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ pin, action: op.action, payload: op.payload }),
    });
    return handle(res);
  },
};
