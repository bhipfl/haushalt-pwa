import clsx from "clsx";

export function Avatar({
  name,
  color,
  size = 28,
}: {
  name: string;
  color?: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        backgroundColor: color || "#64748b",
        fontSize: size * 0.4,
      }}
      title={name}
    >
      {initials || "?"}
    </span>
  );
}

export function Dot({ color, className }: { color?: string; className?: string }) {
  return (
    <span
      className={clsx("inline-block h-2.5 w-2.5 rounded-full", className)}
      style={{ backgroundColor: color || "#64748b" }}
    />
  );
}
