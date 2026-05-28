import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { ShoppingCart, Wallet, ListChecks, ChevronRight, CalendarClock, Circle } from "lucide-react";
import { useData, useMutate, useCurrentMember, memberName, memberColor } from "../../lib/store";
import { useAuth } from "../../lib/auth";
import { Card } from "../../components/ui";
import { Badge } from "../../components/ui";
import { Dot } from "../../components/Avatar";
import { eur, eurCompact, formatDate, relativeDay } from "../../lib/format";
import { monthlyBalance, upcomingDebits } from "../../lib/budget";
import { daysUntil, todayISO } from "../../lib/recurrence";

export function DashboardPage() {
  const data = useData();
  const me = useCurrentMember();
  const mutate = useMutate();
  const { memberId } = useAuth();
  const navigate = useNavigate();

  const bal = monthlyBalance(data);
  const offen = data.shopping.filter((s) => !s.erledigt).length;
  const debits = useMemo(() => upcomingDebits(data, 7), [data]);

  const faellig = data.tasks
    .filter((t) => t.aktiv && daysUntil(t.naechsteFaelligkeit) <= 0)
    .sort((a, b) => a.naechsteFaelligkeit.localeCompare(b.naechsteFaelligkeit));

  const heute = format(new Date(), "EEEE, d. MMMM", { locale: de });

  return (
    <div className="space-y-4">
      <div className="px-1 pt-1">
        <p className="text-sm text-slate-400">{heute}</p>
        <h1 className="text-2xl font-bold">Hallo {me?.name ?? ""} 👋</h1>
      </div>

      {/* Monatsbilanz */}
      <Link to="/konto">
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Monatsbilanz Gemeinschaftskonto</p>
            <p
              className={
                "text-2xl font-bold " +
                (bal.rest >= 0 ? "text-emerald-500" : "text-rose-500")
              }
            >
              {bal.rest >= 0 ? "+" : ""}
              {eur(bal.rest)}
            </p>
            <p className="text-xs text-slate-400">
              {eurCompact(bal.income)} ein · {eurCompact(bal.fixed + bal.reserves)} verplant
            </p>
          </div>
          <ChevronRight className="text-slate-300" />
        </Card>
      </Link>

      {/* Schnellkacheln */}
      <div className="grid grid-cols-2 gap-3">
        <Tile to="/einkauf" icon={<ShoppingCart size={20} />} label="Einkauf" value={`${offen} offen`} color="text-brand-600" />
        <Tile to="/aufgaben" icon={<ListChecks size={20} />} label="Aufgaben" value={`${faellig.length} fällig`} color={faellig.length ? "text-amber-500" : "text-slate-400"} />
      </div>

      {/* Fällige Aufgaben */}
      {faellig.length > 0 && (
        <Card>
          <div className="mb-2 flex items-center gap-2">
            <ListChecks size={18} className="text-slate-400" />
            <h2 className="font-semibold">Jetzt fällig</h2>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-white/5">
            {faellig.slice(0, 5).map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2">
                <button
                  onClick={() =>
                    mutate.mutate({
                      action: "tasks.complete",
                      payload: { id: t.id, doneBy: memberId ?? "", when: todayISO() },
                    })
                  }
                  className="text-brand-600"
                  aria-label="Erledigt"
                >
                  <Circle size={22} className="text-slate-300 dark:text-slate-600" />
                </button>
                <button onClick={() => navigate("/aufgaben")} className="flex-1 text-left">
                  <p className="text-sm font-medium">{t.titel}</p>
                </button>
                <Badge color={memberColor(data.members, t.zustaendig)}>
                  <Dot color={memberColor(data.members, t.zustaendig)} /> {memberName(data.members, t.zustaendig)}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Abbuchungen */}
      <Card>
        <div className="mb-2 flex items-center gap-2">
          <CalendarClock size={18} className="text-slate-400" />
          <h2 className="font-semibold">Abbuchungen diese Woche</h2>
        </div>
        {debits.length === 0 ? (
          <p className="py-2 text-center text-sm text-slate-400">Nichts in den nächsten 7 Tagen.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-white/5">
            {debits.slice(0, 5).map((d, i) => (
              <li key={i} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">{d.fc.name}</p>
                  <p className="text-xs text-slate-400">
                    {formatDate(d.datum)} · {relativeDay(d.datum)}
                  </p>
                </div>
                <span className="text-sm font-semibold">{eur(d.fc.betrag)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Link to="/konto" className="block">
        <Card className="flex items-center gap-3">
          <Wallet size={18} className="text-slate-400" />
          <span className="text-sm font-medium">Gemeinschaftskonto & Budget öffnen</span>
          <ChevronRight className="ml-auto text-slate-300" />
        </Card>
      </Link>
    </div>
  );
}

function Tile({
  to,
  icon,
  label,
  value,
  color,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Link to={to} className="card flex flex-col gap-1 p-4">
      <span className={color}>{icon}</span>
      <span className="mt-1 text-lg font-bold">{value}</span>
      <span className="text-xs text-slate-400">{label}</span>
    </Link>
  );
}
