import { useMemo, useState } from "react";
import { CheckCircle2, Circle, Plus, RotateCw, Trash2, Pencil } from "lucide-react";
import { useData, useMutate } from "../../lib/store";
import { useAuth } from "../../lib/auth";
import { newId } from "../../lib/id";
import { todayISO } from "../../lib/recurrence";
import { shopLocationOrder, shopLocations } from "../../lib/constants";
import { guessLocation } from "../../lib/categorize";
import type { ShoppingItem, ShopLocation } from "../../lib/types";
import { Button, EmptyState, IconButton } from "../../components/ui";
import { Dot } from "../../components/Avatar";
import { Sheet } from "../../components/Sheet";
import { Field, SelectInput, TextInput } from "../../components/form";

const LAST_ORT = "haushalt:lastOrt";

export function ShoppingPage() {
  const data = useData();
  const mutate = useMutate();
  const { memberId } = useAuth();

  const [name, setName] = useState("");
  const [ortChoice, setOrtChoice] = useState<ShopLocation | "auto">(
    (localStorage.getItem(LAST_ORT) as ShopLocation | "auto") || "auto"
  );
  const [editing, setEditing] = useState<ShoppingItem | null>(null);
  const [showDone, setShowDone] = useState(false);

  const detected = guessLocation(name);
  const effectiveOrt: ShopLocation = ortChoice === "auto" ? detected ?? "sonstiges" : ortChoice;

  const open = data.shopping.filter((s) => !s.erledigt);
  const done = data.shopping.filter((s) => s.erledigt);

  const grouped = useMemo(() => {
    return shopLocationOrder
      .map((loc) => ({ loc, items: open.filter((s) => s.ort === loc) }))
      .filter((g) => g.items.length > 0);
  }, [open]);

  const suggestions = useMemo(
    () => Array.from(new Set(data.shopping.map((s) => s.name))).sort(),
    [data.shopping]
  );

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    localStorage.setItem(LAST_ORT, ortChoice);
    mutate.mutate({
      action: "shopping.add",
      payload: {
        id: newId(),
        name: n,
        ort: effectiveOrt,
        erledigt: false,
        addedBy: memberId ?? undefined,
        createdAt: todayISO(),
      },
    });
    setName("");
  };

  return (
    <div>
      <div className="mb-3 flex items-end justify-between px-1">
        <h1 className="text-2xl font-bold">Einkaufszettel</h1>
        <span className="pb-1 text-sm text-slate-400">{open.length} offen</span>
      </div>

      <form onSubmit={add} className="card mb-4 space-y-2 p-3">
        <div className="flex gap-2">
          <TextInput
            list="shop-suggestions"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Was fehlt?"
            className="field flex-1"
          />
          <Button type="submit" aria-label="Hinzufügen" disabled={!name.trim()} className="px-4">
            <Plus size={20} />
          </Button>
        </div>
        <datalist id="shop-suggestions">
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <SelectInput
          value={ortChoice}
          onChange={(e) => setOrtChoice(e.target.value as ShopLocation | "auto")}
        >
          <option value="auto">✨ Automatisch einsortieren</option>
          {shopLocationOrder.map((loc) => (
            <option key={loc} value={loc}>
              {shopLocations[loc].emoji} {shopLocations[loc].label}
            </option>
          ))}
        </SelectInput>
        {ortChoice === "auto" && name.trim() && (
          <p className="px-1 text-xs text-slate-400">
            {detected ? "Kommt in" : "Nicht erkannt →"} {shopLocations[effectiveOrt].emoji}{" "}
            <span className="font-medium text-slate-500 dark:text-slate-300">
              {shopLocations[effectiveOrt].label}
            </span>
            {!detected && " (kannst du oben wählen)"}
          </p>
        )}
      </form>

      {open.length === 0 && (
        <EmptyState
          icon={<CheckCircle2 size={32} />}
          title="Alles erledigt!"
          hint="Füge oben hinzu, was ihr braucht."
        />
      )}

      <div className="space-y-4">
        {grouped.map(({ loc, items }) => (
          <section key={loc}>
            <h2 className="mb-1.5 px-1 text-sm font-semibold text-slate-500">
              {shopLocations[loc].emoji} {shopLocations[loc].label}
            </h2>
            <div className="card divide-y divide-slate-100 p-0 dark:divide-white/5">
              {items.map((item) => (
                <Row
                  key={item.id}
                  item={item}
                  color={data.members.find((m) => m.id === item.addedBy)?.color}
                  onToggle={() => mutate.mutate({ action: "shopping.toggle", payload: { id: item.id } })}
                  onEdit={() => setEditing(item)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {done.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between px-1">
            <button
              onClick={() => setShowDone((v) => !v)}
              className="text-sm font-semibold text-slate-500"
            >
              Erledigt ({done.length}) {showDone ? "▾" : "▸"}
            </button>
            <button
              onClick={() => mutate.mutate({ action: "shopping.clearChecked", payload: {} })}
              className="inline-flex items-center gap-1 text-sm font-medium text-rose-500"
            >
              <Trash2 size={15} /> Aufräumen
            </button>
          </div>
          {showDone && (
            <div className="card mt-2 divide-y divide-slate-100 p-0 dark:divide-white/5">
              {done.map((item) => (
                <Row
                  key={item.id}
                  item={item}
                  color={data.members.find((m) => m.id === item.addedBy)?.color}
                  onToggle={() => mutate.mutate({ action: "shopping.toggle", payload: { id: item.id } })}
                  onEdit={() => setEditing(item)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <EditSheet item={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function Row({
  item,
  color,
  onToggle,
  onEdit,
}: {
  item: ShoppingItem;
  color?: string;
  onToggle: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <button onClick={onToggle} className="shrink-0 text-brand-600">
        {item.erledigt ? (
          <CheckCircle2 size={24} />
        ) : (
          <Circle size={24} className="text-slate-300 dark:text-slate-600" />
        )}
      </button>
      <button onClick={onEdit} className="flex flex-1 items-center gap-2 text-left">
        <span className={item.erledigt ? "text-slate-400 line-through" : "font-medium"}>
          {item.name}
        </span>
        {item.menge && <span className="text-sm text-slate-400">· {item.menge}</span>}
        {item.recurring && <RotateCw size={13} className="text-slate-400" />}
      </button>
      {color && <Dot color={color} />}
      <IconButton onClick={onEdit} className="h-8 w-8">
        <Pencil size={15} />
      </IconButton>
    </div>
  );
}

function EditSheet({ item, onClose }: { item: ShoppingItem | null; onClose: () => void }) {
  const mutate = useMutate();
  if (!item) return null;
  return <EditSheetInner key={item.id} item={item} onClose={onClose} mutate={mutate} />;
}

function EditSheetInner({
  item,
  onClose,
  mutate,
}: {
  item: ShoppingItem;
  onClose: () => void;
  mutate: ReturnType<typeof useMutate>;
}) {
  const [name, setName] = useState(item.name);
  const [menge, setMenge] = useState(item.menge ?? "");
  const [ort, setOrt] = useState<ShopLocation>(item.ort);
  const [recurring, setRecurring] = useState(!!item.recurring);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    mutate.mutate({
      action: "shopping.update",
      payload: { ...item, name: name.trim() || item.name, menge: menge.trim() || undefined, ort, recurring },
    });
    onClose();
  };

  const remove = () => {
    mutate.mutate({ action: "shopping.remove", payload: { id: item.id } });
    onClose();
  };

  return (
    <Sheet open onClose={onClose} title="Artikel bearbeiten">
      <form onSubmit={save} className="space-y-3">
        <Field label="Name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        <Field label="Menge (optional)">
          <TextInput value={menge} onChange={(e) => setMenge(e.target.value)} placeholder="z. B. 2 L" />
        </Field>
        <Field label="Bereich im Laden">
          <SelectInput value={ort} onChange={(e) => setOrt(e.target.value as ShopLocation)}>
            {shopLocationOrder.map((loc) => (
              <option key={loc} value={loc}>
                {shopLocations[loc].emoji} {shopLocations[loc].label}
              </option>
            ))}
          </SelectInput>
        </Field>
        <label className="flex items-center gap-3 rounded-xl bg-slate-100 px-3 py-3 dark:bg-slate-800">
          <input
            type="checkbox"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
            className="h-5 w-5 accent-brand-600"
          />
          <span className="text-sm">Wiederkehrender Artikel (Vorschlag)</span>
        </label>
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="subtle" onClick={remove} className="flex-1">
            <Trash2 size={16} /> Löschen
          </Button>
          <Button type="submit" className="flex-1">
            Speichern
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
