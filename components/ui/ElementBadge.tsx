"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
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
  const { locale, t } = useI18n();
  const color = element ? ELEMENT_COLOR[element] : undefined;

  if (!element || !color) {
    return <span className="chip chip-unknown">{compact ? t.elementUnknownCompact : t.elementUnknown}</span>;
  }

  const ko = ELEMENT_KO[element] ?? element;
  const label = compact ? (locale === "en" ? element : ko) : t.elementSuffix(ko, element);

  return (
    <span className="elem" style={{ background: color }}>
      <span className="elem-icon" />
      {label}
    </span>
  );
}
