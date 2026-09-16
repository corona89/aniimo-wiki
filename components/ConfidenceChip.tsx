import { CONFIDENCE_LABEL } from "@/lib/labels";
import type { Confidence } from "@/lib/types";

const TONE: Record<Confidence, string> = {
  confirmed: "chip-confirmed",
  marketing: "chip-marketing",
  community: "chip-community",
  unknown: "chip-unknown",
};

export function ConfidenceChip({
  value,
  compact = false,
}: {
  value?: Confidence | string | null;
  compact?: boolean;
}) {
  const key = (value ?? "unknown") as Confidence;
  const label = CONFIDENCE_LABEL[key] ?? CONFIDENCE_LABEL.unknown;
  const tone = TONE[key] ?? TONE.unknown;

  return (
    <span className={`chip ${tone}`} title={label.hint}>
      {compact ? key : `${label.ko} · ${key}`}
    </span>
  );
}
