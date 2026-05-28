import { NavLink } from "react-router-dom";
import { Home, ShoppingCart, Wallet, ListChecks } from "lucide-react";
import clsx from "clsx";

const items = [
  { to: "/", label: "Start", icon: Home, end: true },
  { to: "/einkauf", label: "Einkauf", icon: ShoppingCart, end: false },
  { to: "/konto", label: "Konto", icon: Wallet, end: false },
  { to: "/aufgaben", label: "Aufgaben", icon: ListChecks, end: false },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 pb-safe backdrop-blur-lg dark:border-white/10 dark:bg-slate-900/90">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                isActive
                  ? "text-brand-600 dark:text-brand-400"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.4 : 1.9} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
