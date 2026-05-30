import { useMemo } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { ShoppingCart, Wallet, ListChecks, ChevronRight, Circle } from "lucide-react";
import { useData, useMutate, useCurrentMember, memberName, memberColor } from "../../lib/store";
import { useAuth } from "../../lib/auth";
import { Badge } from "../../components/ui";
import { Dot } from "../../components/Avatar";
import { eur, relativeDay } from "../../lib/format";
import { monthlyBalance } from "../../lib/budget";
import { shopLocations } from "../../lib/constants";
import { daysUntil, todayISO } from "../../lib/recurrence";

const PREVIEW = 5;

export function DashboardPage() {
  const data = useData();
  const me = useCurrentMember();
  const mutate = useMutate();
  const { memberId } = useAuth();

  const bal = monthlyBalance(data);

  const openShopping = useMemo(
    () =>
      data.shopping
        .filter((s) => !s.erledigt)
        .sort((a, b) => shopLocations[a.ort].order - shopLocations[b.ort].order),
    [data.shopping]
  );

  const tasks = useMemo(
    () =>
      data.tasks
        .filter((t) => t.aktiv)
        .sort((a, b) => a.naechsteFaelligkeit.localeCompare(b.naechsteFaelligkeit)),
    [data.tasks]
  );
  const faelligCount = tasks.filter((t) => daysUntil(t.naechsteFaelligkeit) <= 0).length;

  const heute = format(new Date(), "EEEE, d. MMMM", { locale: de });

  return (
    <div className="space-y-4">
      <div className="px-1 pt-1">
        <p className="text-sm text-slate-400">{heute}</p>
        <h1 className="text-2xl font-bold">Hallo {me?.name ?? ""} 👋</h1>
      </div>

      {/* Einkauf – Hauptkachel mit Vorschau */}
      <section className="card p-4">
        <Link to="/einkauf" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600/10 text-brand-600">
            <ShoppingCart size={18} />
          </span>
          <div className="flex-1">
            <h2 className="font-semibold leading-tight">Einkauf</h2>
            <p className="text-xs text-slate-400">
              {openShopping.length === 0 ? "nichts offen" : `${openShopping.length} zu kaufen`}
            </p>
          </div>
          <ChevronRight className="text-slate-300" />
        </Link>

        {openShopping.length === 0 ? (
          <p className="py-3 text-center text-sm text-slate-400">Alles besorgt 🎉</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-100 dark:divide-white/5">
            {openShopping.slice(0, PREVIEW).map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-2">
                <button
                  onClick={() => mutate.mutate({ action: "shopping.toggle", payload: { id: item.id } })}
                  className="shrink-0 text-brand-600"
                  aria-label="Abhaken"
                >
                  <Circle size={20} className="text-slate-300 dark:text-slate-600" />
                </button>
                <span className="text-base leading-none">{shopLocations[item.ort].emoji}</span>
                <span className="flex-1 truncate text-sm font-medium">{item.name}</span>
                {item.menge && <span className="shrink-0 text-xs text-slate-400">{item.menge}</span>}
              </li>
            ))}
          </ul>
        )}
        {openShopping.length > PREVIEW && (
          <Link
            to="/einkauf"
            className="mt-1 block py-1 text-center text-xs font-medium text-brand-600"
          >
            +{openShopping.length - PREVIEW} weitere
          </Link>
        )}
      </section>

      {/* Aufgaben – Hauptkachel mit Vorschau */}
      <section className="card p-4">
        <Link to="/aufgaben" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600/10 text-brand-600">
            <ListChecks size={18} />
          </span>
          <div className="flex-1">
            <h2 className="font-semibold leading-tight">Aufgaben</h2>
            <p className={"text-xs " + (faelligCount ? "text-amber-500" : "text-slate-400")}>
              {faelligCount ? `${faelligCount} fällig` : "nichts fällig"}
            </p>
          </div>
          <ChevronRight className="text-slate-300" />
        </Link>

        {tasks.length === 0 ? (
          <p className="py-3 text-center text-sm text-slate-400">Keine Aufgaben angelegt</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-100 dark:divide-white/5">
            {tasks.slice(0, PREVIEW).map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2">
                <button
                  onClick={() =>
                    mutate.mutate({
                      action: "tasks.complete",
                      payload: { id: t.id, doneBy: memberId ?? "", when: todayISO() },
                    })
                  }
                  className="shrink-0 text-brand-600"
                  aria-label="Erledigt"
                >
                  <Circle size={20} className="text-slate-300 dark:text-slate-600" />
                </button>
                <Link to="/aufgaben" className="flex flex-1 items-center gap-2 truncate">
                  <span className="flex-1 truncate text-sm font-medium">{t.titel}</span>
                  <span className={"shrink-0 text-xs " + dueColor(t.naechsteFaelligkeit)}>
                    {relativeDay(t.naechsteFaelligkeit)}
                  </span>
                </Link>
                <Badge color={memberColor(data.members, t.zustaendig)}>
                  <Dot color={memberColor(data.members, t.zustaendig)} />
                  {memberName(data.members, t.zustaendig)}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        {tasks.length > PREVIEW && (
          <Link
            to="/aufgaben"
            className="mt-1 block py-1 text-center text-xs font-medium text-brand-600"
          >
            +{tasks.length - PREVIEW} weitere
          </Link>
        )}
      </section>

      {/* Finanzen – sekundär, kompakt */}
      <Link to="/konto" className="block">
        <div className="card flex items-center gap-3 p-3">
          <Wallet size={16} className="text-slate-400" />
          <span className="text-sm text-slate-500 dark:text-slate-400">Ein &amp; Aus · diesen Monat</span>
          <span
            className={
              "ml-auto text-sm font-semibold " +
              (bal.rest >= 0 ? "text-emerald-500" : "text-rose-500")
            }
          >
            {bal.rest >= 0 ? "+" : ""}
            {eur(bal.rest)}
          </span>
          <ChevronRight size={18} className="text-slate-300" />
        </div>
      </Link>
    </div>
  );
}

function dueColor(iso: string): string {
  const d = daysUntil(iso);
  if (d < 0) return "text-rose-500 font-medium";
  if (d === 0) return "text-amber-500 font-medium";
  return "text-slate-400";
}
