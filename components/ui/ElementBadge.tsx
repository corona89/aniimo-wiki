import { ELEMENT_KO } from "@/lib/labels";

const ELEMENT_COLOR: Record<string, string> = {
  Fire: "var(--fire)",
  Water: "var(--water)",
  Grass: "var(--grass)",
  Lightning: "var(--lightning)",
  Earth: "var(--earth)",
  Wind: "var(--wind)",
  Dark: "var(--dark)",
  Ice: "var(--ice)",
  Light: "var(--light)",
};

export function ElementBadge({
  element,
  compact = false,
}: {
  element?: string | null;
  compact?: boolean;
}) {
  const color = element ? ELEMENT_COLOR[element] : undefined;

  if (!element || !color) {
    return <span className="chip chip-unknown">{compact ? "속성?" : "속성 미상"}</span>;
  }

  const ko = ELEMENT_KO[element] ?? element;
  return (
    <span className="elem" style={{ background: color }}>
      <span className="elem-icon" />
      {compact ? ko : `${ko} · ${element}`}
    </span>
  );
}
