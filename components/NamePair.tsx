export function NamePair({
  ko,
  en,
  size = "md",
}: {
  ko?: string | null;
  en?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const primary = ko ?? en ?? "이름 미상";
  const secondary = ko && en ? en : ko ? en : en ? ko : null;
  const primaryClass =
    size === "lg" ? "font-serif text-3xl tracking-tight" : size === "sm" ? "text-sm font-semibold" : "font-serif text-xl";

  return (
    <span className="inline-flex flex-col leading-tight">
      <span className={primaryClass}>{primary}</span>
      {secondary ? (
        <span className="mt-0.5 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
          {secondary}
        </span>
      ) : null}
    </span>
  );
}
