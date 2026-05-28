import { useState, type ReactNode } from "react";
import { Home, Loader2, UserPlus } from "lucide-react";
import { Button } from "../../components/ui";
import { Avatar } from "../../components/Avatar";
import { Field, TextInput } from "../../components/form";
import { isDemo } from "../../lib/backend";
import { useMutate } from "../../lib/store";
import { useAuth } from "../../lib/auth";
import { newId } from "../../lib/id";
import { memberColors } from "../../lib/constants";
import type { Member } from "../../lib/types";

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 pb-safe pt-safe">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-900/30">
            <Home size={32} />
          </span>
          <h1 className="text-2xl font-bold">Haushalt</h1>
          <p className="mt-1 text-sm text-slate-500">Gemeinsam organisieren</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PinScreen({
  onSubmit,
  error,
  loading,
}: {
  onSubmit: (pin: string) => void;
  error?: string;
  loading?: boolean;
}) {
  const [pin, setPin] = useState("");
  return (
    <Shell>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (pin.trim()) onSubmit(pin.trim());
        }}
        className="card space-y-4 p-5"
      >
        <Field label="Haushalts-PIN">
          <TextInput
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            type="password"
            inputMode="numeric"
            autoFocus
            placeholder="••••••"
            autoComplete="off"
          />
        </Field>
        {error && <p className="text-sm font-medium text-rose-500">{error}</p>}
        {isDemo && (
          <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
            Demo-Modus: gib eine beliebige PIN ein. Daten bleiben nur in diesem Browser.
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={loading || !pin.trim()}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : "Weiter"}
        </Button>
      </form>
    </Shell>
  );
}

export function SetupScreen() {
  const mutate = useMutate();
  const { setMemberId } = useAuth();
  const [me, setMe] = useState("");
  const [partner, setPartner] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me.trim()) return;
    setBusy(true);
    try {
      const myMember: Member = { id: newId(), name: me.trim(), color: memberColors[0] };
      await mutate.mutateAsync({ action: "members.add", payload: myMember });
      if (partner.trim()) {
        await mutate.mutateAsync({
          action: "members.add",
          payload: { id: newId(), name: partner.trim(), color: memberColors[1] },
        });
      }
      setMemberId(myMember.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell>
      <form onSubmit={submit} className="card space-y-4 p-5">
        <p className="text-sm text-slate-500">
          Richte euren Haushalt ein. Du kannst Namen später anpassen.
        </p>
        <Field label="Dein Name">
          <TextInput value={me} onChange={(e) => setMe(e.target.value)} autoFocus placeholder="z. B. Ben" />
        </Field>
        <Field label="Name Partner:in (optional)">
          <TextInput
            value={partner}
            onChange={(e) => setPartner(e.target.value)}
            placeholder="z. B. Anna"
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={busy || !me.trim()}>
          {busy ? <Loader2 className="animate-spin" size={18} /> : "Haushalt erstellen"}
        </Button>
      </form>
    </Shell>
  );
}

export function ChooseMemberScreen({ members }: { members: Member[] }) {
  const { setMemberId, logout } = useAuth();
  const mutate = useMutate();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const addNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const m: Member = {
      id: newId(),
      name: name.trim(),
      color: memberColors[members.length % memberColors.length],
    };
    await mutate.mutateAsync({ action: "members.add", payload: m });
    setMemberId(m.id);
  };

  return (
    <Shell>
      <div className="card space-y-3 p-5">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Wer bist du?</p>
        <div className="space-y-2">
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => setMemberId(m.id)}
              className="flex w-full items-center gap-3 rounded-xl bg-slate-100 px-3 py-3 text-left transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              <Avatar name={m.name} color={m.color} size={36} />
              <span className="font-semibold">{m.name}</span>
            </button>
          ))}
        </div>

        {adding ? (
          <form onSubmit={addNew} className="space-y-2 pt-1">
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              placeholder="Dein Name"
            />
            <Button type="submit" className="w-full" disabled={!name.trim()}>
              Hinzufügen & loslegen
            </Button>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-3 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <UserPlus size={18} /> Ich bin neu hier
          </button>
        )}

        <button onClick={logout} className="w-full pt-1 text-center text-xs text-slate-400">
          Falsche PIN? Abmelden
        </button>
      </div>
    </Shell>
  );
}
