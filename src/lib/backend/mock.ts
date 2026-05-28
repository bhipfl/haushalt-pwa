import { emptyData, type AppData, type Op } from "../types";
import { applyOp } from "../reducer";
import type { Backend } from "./types";

const KEY = "haushalt:data:v1";

function read(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyData();
    return { ...emptyData(), ...(JSON.parse(raw) as AppData) };
  } catch {
    return emptyData();
  }
}

function write(data: AppData) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Lokales Demo-Backend: speichert alles im Browser (localStorage). */
export const mockBackend: Backend = {
  mode: "demo",
  async bootstrap(_pin: string) {
    await delay(120);
    return read();
  },
  async mutate(_pin: string, op: Op) {
    await delay(80);
    const next = applyOp(read(), op);
    write(next);
    return next;
  },
};
