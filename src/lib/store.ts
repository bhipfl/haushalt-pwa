import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { backend, isDemo } from "./backend";
import { applyOp } from "./reducer";
import { APPDATA_KEY } from "./query";
import { useAuth } from "./auth";
import { emptyData, type AppData, type Member, type Op } from "./types";

// Schreibvorgaenge global serialisieren: immer nur EIN POST gleichzeitig.
// So kommen die Antworten in Reihenfolge an und die letzte enthaelt den
// vollstaendigen Stand (keine veraltete Momentaufnahme ueberschreibt mehr).
let writeChain: Promise<unknown> = Promise.resolve();
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeChain.then(fn, fn) as Promise<T>;
  writeChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

// Anzahl gerade laufender Schreibvorgaenge -> Polling so lange pausieren.
let pendingWrites = 0;

export function useAppDataQuery() {
  const { pin } = useAuth();
  return useQuery({
    queryKey: APPDATA_KEY,
    queryFn: () => backend.bootstrap(pin as string),
    enabled: !!pin,
    // Solange geschrieben wird, NICHT pollen: ein Poll koennte einen noch
    // nicht gespeicherten Zwischenstand laden und die optimistische Anzeige
    // kurz zuruecksetzen (Flackern / "Staircase").
    refetchInterval: () => (isDemo || pendingWrites > 0 ? false : 5000),
  });
}

/** Bequemer Zugriff auf die (ggf. leeren) Daten. */
export function useData(): AppData {
  const q = useQueryClient().getQueryData<AppData>(APPDATA_KEY);
  return q ?? emptyData();
}

export function useMutate() {
  const { pin } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    // POSTs laufen serialisiert (siehe serialize) -> in Reihenfolge.
    mutationFn: (op: Op) => serialize(() => backend.mutate(pin as string, op)),
    // Optimistisch sofort anwenden – die UI fuehlt sich instant an, auch bei
    // mehreren schnellen Aenderungen hintereinander. Waehrend des Schreibens
    // wird der optimistische Stand NICHT durch Server-Zwischenstaende ersetzt.
    onMutate: async (op) => {
      pendingWrites++;
      await qc.cancelQueries({ queryKey: APPDATA_KEY });
      const prev = qc.getQueryData<AppData>(APPDATA_KEY);
      if (prev) qc.setQueryData(APPDATA_KEY, applyOp(prev, op));
      return { prev };
    },
    onSettled: () => {
      pendingWrites = Math.max(0, pendingWrites - 1);
      // Erst wenn ALLE Schreibvorgaenge durch sind, EINMAL den echten Stand
      // laden. Dank Serialisierung sind dann garantiert alle Aenderungen
      // gespeichert -> kein Zurueckspringen mehr.
      if (pendingWrites === 0) {
        qc.invalidateQueries({ queryKey: APPDATA_KEY });
      }
    },
  });
}

export function useMembers(): Member[] {
  return useData().members;
}

export function useCurrentMember(): Member | null {
  const { memberId } = useAuth();
  const members = useMembers();
  return members.find((m) => m.id === memberId) ?? null;
}

export function memberName(members: Member[], id?: string | null): string {
  if (!id) return "—";
  if (id === "beide") return "Beide";
  return members.find((m) => m.id === id)?.name ?? "—";
}

export function memberColor(members: Member[], id?: string | null): string {
  if (id === "beide") return "#64748b";
  return members.find((m) => m.id === id)?.color ?? "#64748b";
}
