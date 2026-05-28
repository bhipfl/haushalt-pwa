import type { AppData, Op } from "../types";

export interface Backend {
  mode: "demo" | "live";
  bootstrap(pin: string): Promise<AppData>;
  mutate(pin: string, op: Op): Promise<AppData>;
}

export class AuthError extends Error {
  constructor(message = "PIN ist nicht korrekt.") {
    super(message);
    this.name = "AuthError";
  }
}
