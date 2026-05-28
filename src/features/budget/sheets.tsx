import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Sheet } from "../../components/Sheet";
import { Button } from "../../components/ui";
import { Field, NumberInput, SelectInput, TextInput, DateInput, TextArea } from "../../components/form";
import { useData, useMutate } from "../../lib/store";
import { cadenceLabels, moneyCadences } from "../../lib/constants";
import { parseAmount } from "../../lib/num";
import { newId } from "../../lib/id";
import type { Contribution, FixedCost, PotEntry, PrivateExpense } from "../../lib/types";

export function FixedCostSheet({
  item,
  isNew,
  onClose,
}: {
  item: FixedCost | null;
  isNew: boolean;
  onClose: () => void;
}) {
  if (!item) return null;
  return <FixedCostForm key={item.id} item={item} isNew={isNew} onClose={onClose} />;
}

function FixedCostForm({ item, isNew, onClose }: { item: FixedCost; isNew: boolean; onClose: () => void }) {
  const mutate = useMutate();
  const [name, setName] = useState(item.name);
  const [betrag, setBetrag] = useState(item.betrag ? String(item.betrag) : "");
  const [rhythmus, setRhythmus] = useState(item.rhythmus);
  const [datum, setDatum] = useState(item.ersteFaelligkeit);
  const [kategorie, setKategorie] = useState(item.kategorie ?? "");
  const [notiz, setNotiz] = useState(item.notiz ?? "");

  const istRuecklage = item.typ === "ruecklage";

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: FixedCost = {
      ...item,
      name: name.trim() || item.name,
      betrag: parseAmount(betrag),
      rhythmus,
      ersteFaelligkeit: datum,
      kategorie: kategorie.trim() || undefined,
      notiz: notiz.trim() || undefined,
    };
    mutate.mutate({ action: isNew ? "fixedcosts.add" : "fixedcosts.update", payload });
    onClose();
  };

  const remove = () => {
    mutate.mutate({ action: "fixedcosts.remove", payload: { id: item.id } });
    onClose();
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={`${istRuecklage ? "Rücklage" : "Fixkosten"} ${isNew ? "hinzufügen" : "bearbeiten"}`}
    >
      <form onSubmit={save} className="space-y-3">
        <Field label="Name">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder={istRuecklage ? "z. B. Lebensmittel" : "z. B. Miete"}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Betrag (€)">
            <NumberInput value={betrag} onChange={(e) => setBetrag(e.target.value)} placeholder="0,00" />
          </Field>
          <Field label="Rhythmus">
            <SelectInput value={rhythmus} onChange={(e) => setRhythmus(e.target.value as FixedCost["rhythmus"])}>
              {moneyCadences.map((c) => (
                <option key={c} value={c}>
                  {cadenceLabels[c]}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <Field label={istRuecklage ? "Start ab" : "Nächste / erste Fälligkeit"}>
          <DateInput value={datum} onChange={(e) => setDatum(e.target.value)} />
        </Field>
        <Field label="Kategorie (optional)">
          <TextInput value={kategorie} onChange={(e) => setKategorie(e.target.value)} placeholder="z. B. Wohnen" />
        </Field>
        <Field label="Notiz (optional)">
          <TextArea value={notiz} onChange={(e) => setNotiz(e.target.value)} />
        </Field>
        <div className="flex gap-2 pt-1">
          {!isNew && (
            <Button type="button" variant="subtle" onClick={remove} className="flex-1">
              <Trash2 size={16} /> Löschen
            </Button>
          )}
          <Button type="submit" className="flex-1">
            Speichern
          </Button>
        </div>
      </form>
    </Sheet>
  );
}

export function ContributionSheet({
  item,
  isNew,
  onClose,
}: {
  item: Contribution | null;
  isNew: boolean;
  onClose: () => void;
}) {
  if (!item) return null;
  return <ContributionForm key={item.id} item={item} isNew={isNew} onClose={onClose} />;
}

function ContributionForm({ item, isNew, onClose }: { item: Contribution; isNew: boolean; onClose: () => void }) {
  const mutate = useMutate();
  const { members } = useData();
  const [person, setPerson] = useState(item.person || members[0]?.id || "");
  const [label, setLabel] = useState(item.label);
  const [betrag, setBetrag] = useState(item.betrag ? String(item.betrag) : "");
  const [rhythmus, setRhythmus] = useState(item.rhythmus);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    mutate.mutate({
      action: isNew ? "contributions.add" : "contributions.update",
      payload: { ...item, person, label: label.trim() || "Beitrag", betrag: parseAmount(betrag), rhythmus },
    });
    onClose();
  };
  const remove = () => {
    mutate.mutate({ action: "contributions.remove", payload: { id: item.id } });
    onClose();
  };

  return (
    <Sheet open onClose={onClose} title={`Einzahlung ${isNew ? "hinzufügen" : "bearbeiten"}`}>
      <form onSubmit={save} className="space-y-3">
        <Field label="Person">
          <SelectInput value={person} onChange={(e) => setPerson(e.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Bezeichnung">
          <TextInput value={label} onChange={(e) => setLabel(e.target.value)} placeholder="z. B. Fixbeitrag" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Betrag (€)">
            <NumberInput value={betrag} onChange={(e) => setBetrag(e.target.value)} placeholder="0,00" autoFocus />
          </Field>
          <Field label="Rhythmus">
            <SelectInput value={rhythmus} onChange={(e) => setRhythmus(e.target.value as Contribution["rhythmus"])}>
              {moneyCadences.map((c) => (
                <option key={c} value={c}>
                  {cadenceLabels[c]}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <div className="flex gap-2 pt-1">
          {!isNew && (
            <Button type="button" variant="subtle" onClick={remove} className="flex-1">
              <Trash2 size={16} /> Löschen
            </Button>
          )}
          <Button type="submit" className="flex-1">
            Speichern
          </Button>
        </div>
      </form>
    </Sheet>
  );
}

export function PotEntrySheet({
  ruecklage,
  onClose,
}: {
  ruecklage: FixedCost | null;
  onClose: () => void;
}) {
  if (!ruecklage) return null;
  return <PotEntryForm key={ruecklage.id} ruecklage={ruecklage} onClose={onClose} />;
}

function PotEntryForm({ ruecklage, onClose }: { ruecklage: FixedCost; onClose: () => void }) {
  const mutate = useMutate();
  const [richtung, setRichtung] = useState<"ein" | "aus">("aus");
  const [betrag, setBetrag] = useState("");
  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10));
  const [notiz, setNotiz] = useState("");

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseAmount(betrag);
    if (value <= 0) return;
    const entry: PotEntry = {
      id: newId(),
      ruecklageId: ruecklage.id,
      datum,
      betrag: richtung === "aus" ? -value : value,
      notiz: notiz.trim() || undefined,
    };
    mutate.mutate({ action: "pots.entry", payload: entry });
    onClose();
  };

  return (
    <Sheet open onClose={onClose} title={`Topf: ${ruecklage.name}`}>
      <form onSubmit={save} className="space-y-3">
        <div className="flex gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {(["aus", "ein"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRichtung(r)}
              className={
                "flex-1 rounded-lg py-2 text-sm font-medium " +
                (richtung === r
                  ? r === "aus"
                    ? "bg-rose-500 text-white"
                    : "bg-emerald-500 text-white"
                  : "text-slate-500")
              }
            >
              {r === "aus" ? "Entnahme" : "Einlage"}
            </button>
          ))}
        </div>
        <Field label="Betrag (€)">
          <NumberInput value={betrag} onChange={(e) => setBetrag(e.target.value)} placeholder="0,00" autoFocus />
        </Field>
        <Field label="Datum">
          <DateInput value={datum} onChange={(e) => setDatum(e.target.value)} />
        </Field>
        <Field label="Notiz (optional)">
          <TextInput value={notiz} onChange={(e) => setNotiz(e.target.value)} placeholder="z. B. Wocheneinkauf" />
        </Field>
        <Button type="submit" className="w-full" disabled={parseAmount(betrag) <= 0}>
          Buchen
        </Button>
      </form>
    </Sheet>
  );
}

export function PrivateExpenseSheet({
  item,
  isNew,
  onClose,
}: {
  item: PrivateExpense | null;
  isNew: boolean;
  onClose: () => void;
}) {
  if (!item) return null;
  return <PrivateExpenseForm key={item.id} item={item} isNew={isNew} onClose={onClose} />;
}

function PrivateExpenseForm({ item, isNew, onClose }: { item: PrivateExpense; isNew: boolean; onClose: () => void }) {
  const mutate = useMutate();
  const { members } = useData();
  const [person, setPerson] = useState(item.person || members[0]?.id || "");
  const [betrag, setBetrag] = useState(item.betrag ? String(item.betrag) : "");
  const [datum, setDatum] = useState(item.datum);
  const [notiz, setNotiz] = useState(item.notiz ?? "");

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    mutate.mutate({
      action: isNew ? "private.add" : "private.update",
      payload: { ...item, person, betrag: parseAmount(betrag), datum, notiz: notiz.trim() || undefined },
    });
    onClose();
  };
  const remove = () => {
    mutate.mutate({ action: "private.remove", payload: { id: item.id } });
    onClose();
  };

  return (
    <Sheet open onClose={onClose} title={`Private Auslage ${isNew ? "hinzufügen" : "bearbeiten"}`}>
      <form onSubmit={save} className="space-y-3">
        <Field label="Wer hat bezahlt?">
          <SelectInput value={person} onChange={(e) => setPerson(e.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Betrag (€)">
            <NumberInput value={betrag} onChange={(e) => setBetrag(e.target.value)} placeholder="0,00" autoFocus />
          </Field>
          <Field label="Datum">
            <DateInput value={datum} onChange={(e) => setDatum(e.target.value)} />
          </Field>
        </div>
        <Field label="Wofür?">
          <TextInput value={notiz} onChange={(e) => setNotiz(e.target.value)} placeholder="z. B. Geschenk" />
        </Field>
        {!isNew && (
          <label className="flex items-center gap-3 rounded-xl bg-slate-100 px-3 py-3 dark:bg-slate-800">
            <input
              type="checkbox"
              checked={item.erstattet}
              onChange={(e) =>
                mutate.mutate({ action: "private.update", payload: { ...item, erstattet: e.target.checked } })
              }
              className="h-5 w-5 accent-brand-600"
            />
            <span className="text-sm">Bereits ausgeglichen</span>
          </label>
        )}
        <div className="flex gap-2 pt-1">
          {!isNew && (
            <Button type="button" variant="subtle" onClick={remove} className="flex-1">
              <Trash2 size={16} /> Löschen
            </Button>
          )}
          <Button type="submit" className="flex-1">
            Speichern
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
