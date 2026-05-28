import { useMemo, useState } from "react";
import { Plus, Pencil, CalendarClock, TrendingUp, PiggyBank, ArrowDownUp } from "lucide-react";
import { useData } from "../../lib/store";
import { Segmented } from "../../components/Segmented";
import { Button, Card, EmptyState } from "../../components/ui";
import { Avatar } from "../../components/Avatar";
import { eur, eurCompact, formatDate, formatDateShort, relativeDay } from "../../lib/format";
import { cadenceLabels } from "../../lib/constants";
import { monthlyAmount } from "../../lib/recurrence";
import {
  fixkosten,
  konsum,
  monthlyBalance,
  sumMonthly,
  sumMonthlyContributions,
  upcomingFlows,
  nextDebit,
} from "../../lib/budget";
import { newId } from "../../lib/id";
import { todayISO } from "../../lib/recurrence";
import type { Contribution, FixedCost } from "../../lib/types";
import { ContributionSheet, FixedCostSheet } from "./sheets";

type Tab = "overview" | "einnahmen" | "fix" | "konsum";

export function BudgetPage() {
  const [tab, setTab] = useState<Tab>("overview");
  return (
    <div>
      <h1 className="mb-1 px-1 text-2xl font-bold">Ein &amp; Aus</h1>
      <p className="mb-3 px-1 text-sm text-slate-400">Was kommt rein, was geht raus.</p>
      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: "overview", label: "Übersicht" },
          { value: "einnahmen", label: "Einnahmen" },
          { value: "fix", label: "Fixkosten" },
          { value: "konsum", label: "Konsum" },
        ]}
      />
      <div className="mt-4">
        {tab === "overview" && <Overview onJump={setTab} />}
        {tab === "einnahmen" && <ContributionsTab />}
        {tab === "fix" && <FixedCostsTab />}
        {tab === "konsum" && <KonsumTab />}
      </div>
    </div>
  );
}

/* ---------------- Übersicht ---------------- */

function CompareBars({ income, fixed, k }: { income: number; fixed: number; k: number }) {
  const out = fixed + k;
  const max = Math.max(income, out, 1);
  const w = (n: number) => `${Math.min(100, (n / max) * 100)}%`;
  return (
    <div className="mt-3 space-y-3">
      <div>
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="font-medium text-emerald-600 dark:text-emerald-400">Rein</span>
          <span className="font-semibold">{eur(income)}</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: w(income) }} />
        </div>
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="font-medium text-rose-500">Raus</span>
          <span className="font-semibold">{eur(out)}</span>
        </div>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div className="h-full bg-rose-400" style={{ width: w(fixed) }} />
          <div className="h-full bg-amber-400" style={{ width: w(k) }} />
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={"h-2.5 w-2.5 rounded-full " + color} />
      <span className="text-slate-400">{label}</span>
      <span className="ml-auto font-medium">{value}</span>
    </div>
  );
}

function Overview({ onJump }: { onJump: (t: Tab) => void }) {
  const data = useData();
  const bal = monthlyBalance(data);
  const flows = useMemo(() => upcomingFlows(data, 30), [data]);
  const konsumItems = konsum(data).sort((a, b) => monthlyAmount(b.betrag, b.rhythmus) - monthlyAmount(a.betrag, a.rhythmus));
  const konsumTotal = sumMonthly(konsumItems);
  const hatEinnahmen = data.contributions.length > 0;
  const hatTermine = flows.length > 0;

  return (
    <div className="space-y-4">
      {/* Gegenüberstellung */}
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Diesen Monat</h2>
          <span
            className={
              "rounded-full px-2.5 py-1 text-sm font-bold " +
              (bal.rest >= 0
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/15 text-rose-600 dark:text-rose-400")
            }
          >
            {bal.rest >= 0 ? "bleibt " : "fehlt "}
            {bal.rest >= 0 ? "+" : ""}
            {eur(bal.rest)}
          </span>
        </div>
        <CompareBars income={bal.income} fixed={bal.fixed} k={bal.konsum} />
        <div className="mt-3 space-y-1.5 text-sm">
          <Legend color="bg-rose-400" label="Fixkosten" value={eur(bal.fixed)} />
          <Legend color="bg-amber-400" label="Konsum (Lebensmittel, Freizeit, Puffer …)" value={eur(bal.konsum)} />
        </div>
        <p className="mt-3 text-xs text-slate-400">
          {bal.rest >= 0
            ? "Was reinkommt deckt Fixkosten und den eingeplanten Konsum."
            : "Achtung: Es kommt weniger rein als ihr fest verplant habt."}
        </p>
      </Card>

      {/* Geldfluss-Timeline */}
      <Card>
        <div className="mb-2 flex items-center gap-2">
          <CalendarClock size={18} className="text-slate-400" />
          <h2 className="font-semibold">Geldfluss</h2>
          <span className="ml-auto text-xs text-slate-400">30 Tage</span>
        </div>
        {hatTermine ? (
          <ul className="divide-y divide-slate-100 dark:divide-white/5">
            {flows.slice(0, 10).map((f, i) => {
              const rein = f.kind === "in";
              return (
                <li key={i} className="flex items-center gap-3 py-2">
                  <span
                    className={
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold " +
                      (rein
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/15 text-rose-500")
                    }
                  >
                    {rein ? "+" : "−"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {f.label}
                      {f.sub && <span className="text-slate-400"> · {f.sub}</span>}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDateShort(f.datum)} · {relativeDay(f.datum)}
                    </p>
                  </div>
                  <span
                    className={
                      "shrink-0 text-sm font-semibold " +
                      (rein ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500")
                    }
                  >
                    {rein ? "+" : "−"}
                    {eur(Math.abs(f.betrag))}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="py-3 text-center text-sm text-slate-400">
            {hatEinnahmen
              ? "Keine Termine in den nächsten 30 Tagen."
              : "Noch nichts geplant."}
            <p className="mt-1 text-xs">
              Tipp: Gib bei Einnahmen &amp; Fixkosten ein Datum an, dann siehst du hier, wann was
              rein- und rausgeht.
            </p>
          </div>
        )}
      </Card>

      {/* Konsum eingeplant */}
      <Card>
        <div className="mb-2 flex items-center gap-2">
          <PiggyBank size={18} className="text-amber-500" />
          <h2 className="font-semibold">Eingeplant für Konsum</h2>
          <span className="ml-auto text-sm font-bold text-amber-500">{eur(konsumTotal)}/Mon</span>
        </div>
        {konsumItems.length === 0 ? (
          <p className="py-2 text-center text-sm text-slate-400">
            Noch kein Konsum-Budget. Plane z. B. Lebensmittel, Freizeit oder einen Puffer ein.
          </p>
        ) : (
          <ul className="space-y-2">
            {konsumItems.map((r) => {
              const m = monthlyAmount(r.betrag, r.rhythmus);
              const pct = konsumTotal > 0 ? (m / konsumTotal) * 100 : 0;
              return (
                <li key={r.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="truncate font-medium">{r.name}</span>
                    <span className="text-slate-500">{eur(m)}/Mon</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onJump("fix")} className="card flex items-center gap-2 p-3 text-left">
          <TrendingUp size={18} className="text-rose-500" />
          <span className="text-sm font-medium">Fixkosten</span>
        </button>
        <button onClick={() => onJump("einnahmen")} className="card flex items-center gap-2 p-3 text-left">
          <ArrowDownUp size={18} className="text-emerald-500" />
          <span className="text-sm font-medium">Einnahmen</span>
        </button>
      </div>
    </div>
  );
}

/* ---------------- Einnahmen ---------------- */

function ContributionsTab() {
  const data = useData();
  const total = sumMonthlyContributions(data.contributions);
  const [edit, setEdit] = useState<{ item: Contribution; isNew: boolean } | null>(null);

  const perMember = data.members.map((m) => ({
    member: m,
    items: data.contributions.filter((c) => c.person === m.id),
    sum: data.contributions
      .filter((c) => c.person === m.id)
      .reduce((s, c) => s + monthlyAmount(c.betrag, c.rhythmus), 0),
  }));

  const openNew = (person: string) =>
    setEdit({
      item: { id: newId(), person, label: "Beitrag", betrag: 0, rhythmus: "monatlich" },
      isNew: true,
    });

  return (
    <div className="space-y-3">
      <Card className="flex items-center justify-between">
        <p className="text-xs text-slate-400">Kommt rein pro Monat</p>
        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{eur(total)}</p>
      </Card>

      {data.members.length === 0 && <EmptyState title="Keine Mitglieder" />}

      {perMember.map(({ member, items, sum }) => (
        <Card key={member.id}>
          <div className="mb-2 flex items-center gap-2">
            <Avatar name={member.name} color={member.color} size={28} />
            <span className="font-semibold">{member.name}</span>
            <span className="ml-auto text-sm font-bold">{eur(sum)}/Mon</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {items.map((c) => (
              <button
                key={c.id}
                onClick={() => setEdit({ item: c, isNew: false })}
                className="flex w-full items-center justify-between py-2 text-left text-sm"
              >
                <span className="min-w-0">
                  {c.label}{" "}
                  <span className="text-slate-400">
                    · {cadenceLabels[c.rhythmus]}
                    {c.ersteFaelligkeit && ` · ab ${formatDate(c.ersteFaelligkeit)}`}
                  </span>
                </span>
                <span className="ml-3 shrink-0 font-medium">{eur(c.betrag)}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => openNew(member.id)}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-600"
          >
            <Plus size={15} /> Einnahme
          </button>
        </Card>
      ))}

      <ContributionSheet item={edit?.item ?? null} isNew={edit?.isNew ?? false} onClose={() => setEdit(null)} />
    </div>
  );
}

/* ---------------- Fixkosten ---------------- */

function FixedCostsTab() {
  const data = useData();
  const items = fixkosten(data).sort((a, b) => nextDebit(a).localeCompare(nextDebit(b)));
  const total = sumMonthly(items);
  const [edit, setEdit] = useState<{ item: FixedCost; isNew: boolean } | null>(null);

  const openNew = () =>
    setEdit({
      item: {
        id: newId(),
        name: "",
        typ: "fixkosten",
        betrag: 0,
        rhythmus: "monatlich",
        ersteFaelligkeit: todayISO(),
        aktiv: true,
      },
      isNew: true,
    });

  return (
    <div className="space-y-3">
      <Card className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">Geht raus pro Monat</p>
          <p className="text-xl font-bold text-rose-500">{eur(total)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">pro Jahr</p>
          <p className="text-lg font-semibold">{eurCompact(total * 12)}</p>
        </div>
      </Card>

      {items.length === 0 ? (
        <EmptyState title="Noch keine Fixkosten" hint="Miete, Strom, Versicherungen …" />
      ) : (
        <div className="card divide-y divide-slate-100 p-0 dark:divide-white/5">
          {items.map((fc) => (
            <button
              key={fc.id}
              onClick={() => setEdit({ item: fc, isNew: false })}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{fc.name}</p>
                <p className="text-xs text-slate-400">
                  {cadenceLabels[fc.rhythmus]} · nächste {formatDate(nextDebit(fc))}
                </p>
              </div>
              <div className="ml-3 text-right">
                <p className="font-semibold">{eur(fc.betrag)}</p>
                {fc.rhythmus !== "monatlich" && fc.rhythmus !== "einmalig" && (
                  <p className="text-xs text-slate-400">≈ {eur(monthlyAmount(fc.betrag, fc.rhythmus))}/Mon</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <Button onClick={openNew} className="w-full">
        <Plus size={18} /> Fixkosten hinzufügen
      </Button>

      <FixedCostSheet item={edit?.item ?? null} isNew={edit?.isNew ?? false} onClose={() => setEdit(null)} />
    </div>
  );
}

/* ---------------- Konsum ---------------- */

function KonsumTab() {
  const data = useData();
  const items = konsum(data).sort((a, b) => a.name.localeCompare(b.name));
  const totalMonthly = sumMonthly(items);
  const [edit, setEdit] = useState<{ item: FixedCost; isNew: boolean } | null>(null);

  const openNew = () =>
    setEdit({
      item: {
        id: newId(),
        name: "",
        typ: "ruecklage",
        betrag: 0,
        rhythmus: "monatlich",
        ersteFaelligkeit: todayISO(),
        aktiv: true,
      },
      isNew: true,
    });

  return (
    <div className="space-y-3">
      <Card className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">Eingeplant pro Monat</p>
          <p className="text-xl font-bold text-amber-500">{eur(totalMonthly)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">pro Jahr</p>
          <p className="text-lg font-semibold">{eurCompact(totalMonthly * 12)}</p>
        </div>
      </Card>

      {items.length === 0 ? (
        <EmptyState title="Noch kein Konsum-Budget" hint="Lebensmittel, Freizeit, Puffer, Urlaub …" />
      ) : (
        <div className="card divide-y divide-slate-100 p-0 dark:divide-white/5">
          {items.map((r) => (
            <button
              key={r.id}
              onClick={() => setEdit({ item: r, isNew: false })}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{r.name}</p>
                {r.rhythmus !== "monatlich" && (
                  <p className="text-xs text-slate-400">{cadenceLabels[r.rhythmus]}</p>
                )}
              </div>
              <div className="ml-3 flex items-center gap-2 text-right">
                <div>
                  <p className="font-semibold">{eur(monthlyAmount(r.betrag, r.rhythmus))}</p>
                  <p className="text-xs text-slate-400">pro Monat</p>
                </div>
                <Pencil size={15} className="text-slate-300" />
              </div>
            </button>
          ))}
        </div>
      )}

      <Button onClick={openNew} className="w-full">
        <Plus size={18} /> Konsum-Budget hinzufügen
      </Button>

      <p className="px-1 text-center text-xs text-slate-400">
        Konsum ist nur die Planung „so viel ist dafür vorgesehen" – keine Buchführung.
      </p>

      <FixedCostSheet item={edit?.item ?? null} isNew={edit?.isNew ?? false} onClose={() => setEdit(null)} />
    </div>
  );
}
