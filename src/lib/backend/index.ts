import type { Backend } from "./types";
import { mockBackend } from "./mock";
import { appsScriptBackend } from "./appsScript";

const apiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

export const isDemo = !apiUrl;

export const backend: Backend = isDemo ? mockBackend : appsScriptBackend;

export { AuthError } from "./types";
export type { Backend } from "./types";
