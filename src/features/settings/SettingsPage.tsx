import { useState } from "react";
import {
  Moon,
  Sun,
  LogOut,
  Users,
  Plus,
  Pencil,
  Trash2,
  Database,
  RefreshCw,
  Info,
} from "lucide-react";
import { useData, useMutate, useCurrentMember } from "../../lib/store";
import { useAuth } from "../../lib/auth";
import { useTheme } from "../../lib/theme";
import { isDemo } from "../../lib/backend";
import { Button, Card, SectionTitle } from "../../components/ui";
import { Avatar } from "../../components/Avatar";
import { Sheet } from "../../components/Sheet";
import { Field, TextInput } from "../../components/form";
import { memberColors } from "../../lib/constants";
import { newId } from "../../lib/id";
import { emptyData, type Member } from "../../lib/types";
import { demoData } from "../../lib/seed";

export function SettingsPage() {
  const data = useData();
  const mutate = useMutate();
  const me = useCurrentMember();
  const { setMemberId, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [edit, setEdit] = useState<{ item: Member; isNew: boolean } | null>(null);

  const loadDemo = () => {
    if (!confirm("Beispieldaten laden? Vorhandene Demo-Daten werden ersetzt.")) return;
    mutate.mutate({ action: "data.replace", payload: demoData() });
    setMemberId(null);
  };
  const reset = () => {
    if (!confirm("Wirklich ALLE Daten löschen?")) return;
    mutate.mutate({ action: "data.replace", payload: emptyData() });
    setMemberId(null);
  };

  return (
    <div className="pb-4">
      <h1 className="mb-3 px-1 text-2xl font-bold">Einstellungen</h1>

      <Card className="flex items-center gap-3">
        <Avatar name={me?.name ?? "?"} color={me?.color} size={44} />
        <div className="flex-1">
          <p className="font-semibold">{me?.name}</p>
          <p className="text-xs text-slate-400">angemeldet</p>
        </div>
        <Button variant="subtle" size="sm" onClick={() => setMemberId(null)}>
          Wechseln
        </Button>
      </Card>

      <SectionTitle
        action={
          <button
            onClick={() =>
              setEdit({
                item: { id: newId(), name: "", color: memberColors[data.members.length % memberColors.length] },
                isNew: true,
              })
            }
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-600"
          >
            <Plus size={15} /> Person
          </button>
        }
      >
        <span className="inline-flex items-center gap-1">
          <Users size={14} /> Haushalt
        </span>
      </SectionTitle>
      <div className="card divide-y divide-slate-100 p-0 dark:divide-white/5">
        {data.members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 px-4 py-3">
            <Avatar name={m.name} color={m.color} size={32} />
            <span className="flex-1 font-medium">{m.name}</span>
            <button onClick={() => setEdit({ item: m, isNew: false })} className="text-slate-400">
              <Pencil size={16} />
            </button>
          </div>
        ))}
      </div>

      <SectionTitle>Darstellung</SectionTitle>
      <Card className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-medium">
          {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />} Dunkles Design
        </span>
        <button
          onClick={toggle}
          className={
            "relative h-7 w-12 rounded-full transition-colors " +
            (theme === "dark" ? "bg-brand-600" : "bg-slate-300")
          }
        >
          <span
            className={
              "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform " +
              (theme === "dark" ? "translate-x-5" : "translate-x-0.5")
            }
          />
        </button>
      </Card>

      <SectionTitle>
        <span className="inline-flex items-center gap-1">
          <Database size={14} /> Daten
        </span>
      </SectionTitle>
      <Card className="space-y-2">
        <div className="flex items-start gap-2 text-sm text-slate-500">
          <Info size={16} className="mt-0.5 shrink-0" />
          {isDemo ? (
            <p>
              <b>Demo-Modus:</b> Daten liegen nur in diesem Browser. Für die gemeinsame Nutzung verbindet ihr ein
              Google Sheet (siehe README) und hinterlegt die Web-App-URL als <code>VITE_API_URL</code>.
            </p>
          ) : (
            <p>
              <b>Verbunden:</b> Daten werden mit eurem Google Sheet synchronisiert.
            </p>
          )}
        </div>
        {isDemo && (
          <div className="flex gap-2">
            <Button variant="subtle" className="flex-1" onClick={loadDemo}>
              <RefreshCw size={16} /> Beispieldaten
            </Button>
            <Button variant="subtle" className="flex-1" onClick={reset}>
              <Trash2 size={16} /> Zurücksetzen
            </Button>
          </div>
        )}
      </Card>

      <div className="mt-6">
        <Button variant="ghost" className="w-full text-rose-500" onClick={logout}>
          <LogOut size={18} /> Abmelden
        </Button>
      </div>

      <MemberSheet item={edit?.item ?? null} isNew={edit?.isNew ?? false} onClose={() => setEdit(null)} />
    </div>
  );
}

function MemberSheet({ item, isNew, onClose }: { item: Member | null; isNew: boolean; onClose: () => void }) {
  if (!item) return null;
  return <MemberForm key={item.id} item={item} isNew={isNew} onClose={onClose} />;
}

function MemberForm({ item, isNew, onClose }: { item: Member; isNew: boolean; onClose: () => void }) {
  const mutate = useMutate();
  const { members } = useData();
  const { memberId, setMemberId } = useAuth();
  const [name, setName] = useState(item.name);
  const [color, setColor] = useState(item.color);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    mutate.mutate({
      action: isNew ? "members.add" : "members.update",
      payload: { ...item, name: name.trim(), color },
    });
    onClose();
  };
  const remove = () => {
    if (members.length <= 1) {
      alert("Mindestens eine Person muss bestehen bleiben.");
      return;
    }
    if (!confirm(`${item.name} entfernen?`)) return;
    mutate.mutate({ action: "members.remove", payload: { id: item.id } });
    if (memberId === item.id) setMemberId(null);
    onClose();
  };

  return (
    <Sheet open onClose={onClose} title={isNew ? "Person hinzufügen" : "Person bearbeiten"}>
      <form onSubmit={save} className="space-y-3">
        <Field label="Name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        <div>
          <span className="label">Farbe</span>
          <div className="flex flex-wrap gap-2">
            {memberColors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={"h-9 w-9 rounded-full ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 " + (color === c ? "ring-slate-900 dark:ring-white" : "ring-transparent")}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          {!isNew && (
            <Button type="button" variant="subtle" onClick={remove} className="flex-1">
              <Trash2 size={16} /> Entfernen
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
