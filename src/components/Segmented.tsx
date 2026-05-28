import clsx from "clsx";

interface Option<T extends string> {
  value: T;
  label: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800",
        className
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={clsx(
            "flex-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
            value === o.value
              ? "bg-white text-brand-700 shadow-sm dark:bg-slate-700 dark:text-white"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
