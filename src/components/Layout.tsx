import { Outlet, useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { Avatar } from "./Avatar";
import { useCurrentMember } from "../lib/store";
import { isDemo } from "../lib/backend";

export function Layout() {
  const me = useCurrentMember();
  const navigate = useNavigate();

  return (
    <div className="mx-auto min-h-screen max-w-md">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/70 bg-slate-100/80 px-4 py-3 pt-safe backdrop-blur-lg dark:border-white/10 dark:bg-slate-950/80">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Home size={18} />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold">Haushalt</p>
            {isDemo && <p className="text-[10px] font-medium text-amber-500">Demo-Modus</p>}
          </div>
        </div>
        <button onClick={() => navigate("/einstellungen")} aria-label="Einstellungen">
          <Avatar name={me?.name ?? "?"} color={me?.color} size={34} />
        </button>
      </header>

      <main className="px-4 pb-28 pt-2">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
