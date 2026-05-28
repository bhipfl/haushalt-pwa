import { useState } from "react";
import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import { useData, useMutate, memberName, memberColor } from "../../lib/store";
import { useAuth } from "../../lib/auth";
import { Button, Card, EmptyState, Badge } from "../../components/ui";
import { Dot } from "../../components/Avatar";
import { Sheet } from "../../components/Sheet";
import { Field, SelectInput, TextInput, DateInput } from "../../components/form";
import { cadenceLabels, taskCadences } from "../../lib/constants";
import { daysUntil, todayISO } from "../../lib/recurrence";
import { formatDate, relativeDay } from "../../lib/format";
import { newId } from "../../lib/id";
import type { Task } from "../../lib/types";

export function TasksPage() {
  const data = useData();
  const mutate = useMutate();
  const { memberId } = useAuth();
  const [edit, setEdit] = useState<{ item: Task; isNew: boolean } | null>(null);

  const tasks = data.tasks
    .filter((t) => t.aktiv)
    .sort((a, b) => a.naechsteFaelligkeit.localeCompare(b.naechsteFaelligkeit));

  const openNew = () =>
    setEdit({
      item: {
        id: newId(),
        titel: "",
        rhythmus: "woechentlich",
        zustaendig: memberId ?? data.members[0]?.id ?? "beide",
        naechsteFaelligkeit: todayISO(),
        aktiv: true,
      },
      isNew: true,
    });

  const complete = (t: Task) =>
    mutate.mutate({
      action: "tasks.complete",
      payload: { id: t.id, doneBy: memberId ?? "", when: todayISO() },
    });

  return (
    <div>
      <div className="mb-3 flex items-end justify-between px-1">
        <h1 className="text-2xl font-bold">Aufgaben</h1>
        <span className="pb-1 text-sm text-slate-400">{tasks.length} aktiv</span>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 size={32} />}
          title="Keine Aufgaben"
          hint="Lege Putz- und Routineaufgaben an."
        />
      ) : (
        <div className="space-y-2.5">
          {tasks.map((t) => {
            const d = daysUntil(t.naechsteFaelligkeit);
            const overdue = d < 0;
            const today = d === 0;
            return (
              <Card key={t.id} className="flex items-center gap-3">
                <button onClick={() => complete(t)} className="shrink-0 text-brand-600" aria-label="Erledigt">
                  <Circle size={26} className="text-slate-300 dark:text-slate-600" />
                </button>
                <button onClick={() => setEdit({ item: t, isNew: false })} className="min-w-0 flex-1 text-left">
                  <p className="truncate font-medium">{t.titel}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge color={memberColor(data.members, t.zustaendig)}>
                      <Dot color={memberColor(data.members, t.zustaendig)} /> {memberName(data.members, t.zustaendig)}
                    </Badge>
                    <span className="text-xs text-slate-400">{cadenceLabels[t.rhythmus]}</span>
                  </div>
                </button>
                <div className="shrink-0 text-right">
                  <p
                    className={clsx(
                      "text-sm font-semibold",
                      overdue ? "text-rose-500" : today ? "text-amber-500" : "text-slate-500"
                    )}
                  >
                    {relativeDay(t.naechsteFaelligkeit)}
                  </p>
                  <p className="text-[11px] text-slate-400">{formatDate(t.naechsteFaelligkeit)}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Button onClick={openNew} className="mt-4 w-full">
        <Plus size={18} /> Aufgabe hinzufügen
      </Button>

      <TaskSheet item={edit?.item ?? null} isNew={edit?.isNew ?? false} onClose={() => setEdit(null)} />
    </div>
  );
}

function TaskSheet({ item, isNew, onClose }: { item: Task | null; isNew: boolean; onClose: () => void }) {
  if (!item) return null;
  return <TaskForm key={item.id} item={item} isNew={isNew} onClose={onClose} />;
}

function TaskForm({ item, isNew, onClose }: { item: Task; isNew: boolean; onClose: () => void }) {
  const mutate = useMutate();
  const { members } = useData();
  const [titel, setTitel] = useState(item.titel);
  const [rhythmus, setRhythmus] = useState(item.rhythmus);
  const [zustaendig, setZustaendig] = useState(item.zustaendig);
  const [datum, setDatum] = useState(item.naechsteFaelligkeit);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titel.trim()) return;
    mutate.mutate({
      action: isNew ? "tasks.add" : "tasks.update",
      payload: { ...item, titel: titel.trim(), rhythmus, zustaendig, naechsteFaelligkeit: datum, aktiv: true },
    });
    onClose();
  };
  const remove = () => {
    mutate.mutate({ action: "tasks.remove", payload: { id: item.id } });
    onClose();
  };

  return (
    <Sheet open onClose={onClose} title={`Aufgabe ${isNew ? "hinzufügen" : "bearbeiten"}`}>
      <form onSubmit={save} className="space-y-3">
        <Field label="Aufgabe">
          <TextInput value={titel} onChange={(e) => setTitel(e.target.value)} autoFocus placeholder="z. B. Bad putzen" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Rhythmus">
            <SelectInput value={rhythmus} onChange={(e) => setRhythmus(e.target.value as Task["rhythmus"])}>
              {taskCadences.map((c) => (
                <option key={c} value={c}>
                  {cadenceLabels[c]}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Zuständig">
            <SelectInput value={zustaendig} onChange={(e) => setZustaendig(e.target.value)}>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
              <option value="beide">Beide</option>
            </SelectInput>
          </Field>
        </div>
        <Field label="Nächste Fälligkeit">
          <DateInput value={datum} onChange={(e) => setDatum(e.target.value)} />
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
