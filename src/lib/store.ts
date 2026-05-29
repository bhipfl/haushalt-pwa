import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { backend, isDemo } from "./backend";
import { applyOp } from "./reducer";
import { APPDATA_KEY } from "./query";
import { useAuth } from "./auth";
import { emptyData, type AppData, type Member, type Op } from "./types";

export function useAppDataQuery() {
  const { pin } = useAuth();
  return useQuery({
    queryKey: APPDATA_KEY,
    queryFn: () => backend.bootstrap(pin as string),
    enabled: !!pin,
    refetchInterval: isDemo ? false : 5000,
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
    mutationFn: (op: Op) => backend.mutate(pin as string, op),
    // Optimistisch sofort anwenden – die UI fuehlt sich instant an, auch bei
    // mehreren schnellen Aenderungen hintereinander.
    onMutate: async (op) => {
      await qc.cancelQueries({ queryKey: APPDATA_KEY });
      const prev = qc.getQueryData<AppData>(APPDATA_KEY);
      if (prev) qc.setQueryData(APPDATA_KEY, applyOp(prev, op));
      return { prev };
    },
    onError: (_e, _op, ctx) => {
      if (ctx?.prev) qc.setQueryData(APPDATA_KEY, ctx.prev);
    },
    // WICHTIG: Die Server-Antwort einer einzelnen Mutation ist nur eine
    // Momentaufnahme und enthaelt parallele Aenderungen evtl. noch nicht.
    // Wuerde man sie direkt in den Cache schreiben, koennte eine aeltere
    // Antwort eine neuere (optimistische) Aenderung ueberschreiben -> nur die
    // erste Aenderung "haelt". Daher NICHT die Antwort uebernehmen, sondern
    // erst wenn die letzte laufende Mutation fertig ist EINMAL frisch laden.
    onSettled: () => {
      if (qc.isMutating() === 1) {
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
