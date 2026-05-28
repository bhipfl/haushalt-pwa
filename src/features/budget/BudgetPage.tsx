import { useMemo, useState } from "react";
import { Plus, Pencil, CalendarClock, TrendingUp, PiggyBank, ArrowDownUp } from "lucide-react";
import { useData } from "../../lib/store";
import { Segmented } from "../../components/Segmented";
import { Button, Card, EmptyState, IconButton } from "../../components/ui";
import { Avatar } from "../../components/Avatar";
import { eur, eurCompact, formatDate, relativeDay } from "../../lib/format";
import { cadenceLabels } from "../../lib/constants";
import { monthlyAmount } from "../../lib/recurrence";
import {
  fixkosten,
  ruecklagen,
  monthlyBalance,
  potBalance,
  sumMonthly,
  sumMonthlyContributions,
  upcomingDebits,
  nextDebit,
  privateBalances,
} from "../../lib/budget";
import { newId } from "../../lib/id";
import { todayISO } from "../../lib/recurrence";
import type { Contribution, FixedCost, PrivateExpense } from "../../lib/types";
import {
  ContributionSheet,
  FixedCostSheet,
  PotEntrySheet,
  PrivateExpenseSheet,
} from "./sheets";

type Tab = "overview" | "fix" | "ruecklagen" | "einzahlungen";

export function BudgetPage() {
  const [tab, setTab] = useState<Tab>("overview");
  return (
    <div>
      <h1 className="mb-3 px-1 text-2xl font-bold">Gemeinschaftskonto</h1>
      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: "overview", label: "Übersicht" },
          { value: "fix", label: "Fixkosten" },
          { value: "ruecklagen", label: "Rücklagen" },
          { value: "einzahlungen", label: "Einzahlungen" },
        ]}
      />
      <div className="mt-4">
        {tab === "overview" && <Overview onJump={setTab} />}
        {tab === "fix" && <FixedCostsTab />}
        {tab === "ruecklagen" && <ReservesTab />}
        {tab === "einzahlungen" && <ContributionsTab />}
      </div>
    </div>
  );
}

/* ---------------- Übersicht ---------------- */

function Bar({ income, fixed, reserves }: { income: number; fixed: number; reserves: number }) {
  const total = Math.max(income, fixed + reserves, 1);
  const pct = (n: number) => `${(n / total) * 100}%`;
  return (
    <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
      <div className="flex h-full">
        <div className="h-full bg-rose-400" style={{ width: pct(fixed) }} />
        <div className="h-full bg-amber-400" style={{ width: pct(reserves) }} />
      </div>
    </div>
  );
}

function Overview({ onJump }: { onJump: (t: Tab) => void }) {
  const data = useData();
  const bal = monthlyBalance(data);
  const debits = useMemo(() => upcomingDebits(data, 30), [data]);
  const privBal = privateBalances(data);
  const [editPriv, setEditPriv] = useState<{ item: PrivateExpense; isNew: boolean } | null>(null);

  const offenePriv = data.privateExpenses.filter((e) => !e.erstattet);

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Monatsbilanz</h2>
          <span
            className={
              "rounded-full px-2.5 py-1 text-sm font-bold " +
              (bal.rest >= 0
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/15 text-rose-600 dark:text-rose-400")
            }
          >
            {bal.rest >= 0 ? "+" : ""}
            {eur(bal.rest)}
          </span>
        </div>
        <Bar income={bal.income} fixed={bal.fixed} reserves={bal.reserves} />
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
          <Stat label="Einzahlung" value={eurCompact(bal.income)} tone="text-brand-600 dark:text-brand-400" />
          <Stat label="Fixkosten" value={eurCompact(bal.fixed)} tone="text-rose-500" />
          <Stat label="Rücklagen" value={eurCompact(bal.reserves)} tone="text-amber-500" />
        </div>
        <p className="mt-3 text-xs text-slate-400">
          {bal.rest >= 0
            ? "Eure Einzahlungen decken alle Fixkosten und Rücklagen."
            : "Achtung: Die Einzahlungen decken die geplanten Ausgaben nicht."}
        </p>
      </Card>

      <Card>
        <div className="mb-2 flex items-center gap-2">
          <CalendarClock size={18} className="text-slate-400" />
          <h2 className="font-semibold">Nächste Abbuchungen</h2>
          <span className="ml-auto text-xs text-slate-400">30 Tage</span>
        </div>
        {debits.length === 0 ? (
          <p className="py-3 text-center text-sm text-slate-400">Keine Abbuchungen in den nächsten 30 Tagen.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-white/5">
            {debits.slice(0, 8).map((d, i) => (
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

      <Card>
        <div className="mb-1 flex items-center gap-2">
          <ArrowDownUp size={18} className="text-slate-400" />
          <h2 className="font-semibold">Private Auslagen</h2>
          <button
            onClick={() =>
              setEditPriv({
                item: { id: newId(), datum: todayISO(), person: data.members[0]?.id ?? "", betrag: 0, erstattet: false },
                isNew: true,
              })
            }
            className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-brand-600"
          >
            <Plus size={15} /> Neu
          </button>
        </div>
        <p className="mb-2 text-xs text-slate-400">
          Wenn jemand ausnahmsweise privat etwas Gemeinsames bezahlt hat.
        </p>
        {offenePriv.length === 0 ? (
          <p className="py-2 text-center text-sm text-slate-400">Alles ausgeglichen.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-white/5">
            {offenePriv.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2">
                <button onClick={() => setEditPriv({ item: e, isNew: false })} className="text-left">
                  <p className="text-sm font-medium">{e.notiz || "Auslage"}</p>
                  <p className="text-xs text-slate-400">
                    {data.members.find((m) => m.id === e.person)?.name} · {formatDate(e.datum)}
                  </p>
                </button>
                <span className="text-sm font-semibold">{eur(e.betrag)}</span>
              </li>
            ))}
          </ul>
        )}
        {Object.keys(privBal).length > 0 && (
          <p className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800">
            Offen ausgelegt:{" "}
            {Object.entries(privBal)
              .map(([id, v]) => `${data.members.find((m) => m.id === id)?.name ?? "?"} ${eur(v)}`)
              .join(" · ")}
          </p>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onJump("fix")} className="card flex items-center gap-2 p-3 text-left">
          <TrendingUp size={18} className="text-rose-500" />
          <span className="text-sm font-medium">Fixkosten verwalten</span>
        </button>
        <button onClick={() => onJump("ruecklagen")} className="card flex items-center gap-2 p-3 text-left">
          <PiggyBank size={18} className="text-amber-500" />
          <span className="text-sm font-medium">Rücklagen-Töpfe</span>
        </button>
      </div>

      <PrivateExpenseSheet
        item={editPriv?.item ?? null}
        isNew={editPriv?.isNew ?? false}
        onClose={() => setEditPriv(null)}
      />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl bg-slate-100 py-2 dark:bg-slate-800">
      <p className={"text-base font-bold " + tone}>{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

/* ---------------- Fixkosten ---------------- */

function FixedCostsTab() {
  const data = useData();
  const items = fixkosten(data).sort((a, b) => a.name.localeCompare(b.name));
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
          <p className="text-xs text-slate-400">Summe pro Monat</p>
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

/* ---------------- Rücklagen ---------------- */

function ReservesTab() {
  const data = useData();
  const items = ruecklagen(data).sort((a, b) => a.name.localeCompare(b.name));
  const totalMonthly = sumMonthly(items);
  const totalPot = items.reduce((s, r) => s + potBalance(data.potLedger, r.id), 0);
  const [edit, setEdit] = useState<{ item: FixedCost; isNew: boolean } | null>(null);
  const [pot, setPot] = useState<FixedCost | null>(null);

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
          <p className="text-xs text-slate-400">Rücklage pro Monat</p>
          <p className="text-xl font-bold text-amber-500">{eur(totalMonthly)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">aktueller Bestand</p>
          <p className="text-lg font-semibold">{eur(totalPot)}</p>
        </div>
      </Card>

      {items.length === 0 ? (
        <EmptyState title="Noch keine Rücklagen" hint="Lebensmittel, Urlaub, Notgroschen …" />
      ) : (
        <div className="space-y-3">
          {items.map((r) => {
            const stand = potBalance(data.potLedger, r.id);
            return (
              <Card key={r.id}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{r.name}</p>
                    <p className="text-xs text-slate-400">
                      {eur(monthlyAmount(r.betrag, r.rhythmus))}/Monat zurücklegen
                    </p>
                  </div>
                  <IconButton onClick={() => setEdit({ item: r, isNew: false })} className="h-8 w-8">
                    <Pencil size={15} />
                  </IconButton>
                </div>
                <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800">
                  <div>
                    <p className="text-xs text-slate-400">Bestand</p>
                    <p className={"text-lg font-bold " + (stand < 0 ? "text-rose-500" : "")}>{eur(stand)}</p>
                  </div>
                  <Button size="sm" variant="subtle" onClick={() => setPot(r)}>
                    Buchen
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Button onClick={openNew} className="w-full">
        <Plus size={18} /> Rücklage hinzufügen
      </Button>

      <FixedCostSheet item={edit?.item ?? null} isNew={edit?.isNew ?? false} onClose={() => setEdit(null)} />
      <PotEntrySheet ruecklage={pot} onClose={() => setPot(null)} />
    </div>
  );
}

/* ---------------- Einzahlungen ---------------- */

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
        <p className="text-xs text-slate-400">Einzahlungen pro Monat</p>
        <p className="text-xl font-bold text-brand-600 dark:text-brand-400">{eur(total)}</p>
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
                <span>
                  {c.label} <span className="text-slate-400">· {cadenceLabels[c.rhythmus]}</span>
                </span>
                <span className="font-medium">{eur(c.betrag)}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => openNew(member.id)}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-600"
          >
            <Plus size={15} /> Einzahlung
          </button>
        </Card>
      ))}

      <ContributionSheet item={edit?.item ?? null} isNew={edit?.isNew ?? false} onClose={() => setEdit(null)} />
    </div>
  );
}
