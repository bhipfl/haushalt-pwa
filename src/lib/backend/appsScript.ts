import { emptyData, type AppData, type Op } from "../types";
import { AuthError, type Backend } from "./types";

const URL = import.meta.env.VITE_API_URL as string;

interface ApiResponse {
  ok: boolean;
  data?: AppData;
  error?: string;
  code?: string;
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
  return { ...emptyData(), ...(json.data as AppData) };
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
