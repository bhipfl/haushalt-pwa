import { Loader2 } from "lucide-react";

export function FullLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-slate-400">
      <Loader2 className="animate-spin" size={28} />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}
