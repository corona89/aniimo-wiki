export function StatBar({
  label,
  value,
  max = 120,
}: {
  label: string;
  value?: number | null;
  max?: number;
}) {
  const hasValue = typeof value === "number";
  const pct = hasValue ? Math.min(100, Math.max(2, Math.round((value! / max) * 100))) : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--ink-soft)]">{label}</span>
        <span className="font-mono text-xs text-[var(--muted)]">{hasValue ? value : "null"}</span>
      </div>
      <div className="statbar-track mt-1.5" role="meter" aria-valuenow={hasValue ? value! : undefined}>
        {hasValue ? <div className="statbar-fill" style={{ width: `${pct}%` }} /> : null}
      </div>
    </div>
  );
}
