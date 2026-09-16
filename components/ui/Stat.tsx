import type { ReactNode } from "react";

export function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="wiki-card p-5">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-1 font-display text-3xl" style={accent ? { color: accent } : undefined}>
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}
