import { Badge } from "@/components/ui/Badge";
import { CONFIDENCE_LABEL } from "@/lib/labels";
import type { Confidence } from "@/lib/types";

export function ConfidenceChip({
  value,
  compact = false,
}: {
  value?: Confidence | string | null;
  compact?: boolean;
}) {
  const key = (value ?? "unknown") as Confidence;
  const label = CONFIDENCE_LABEL[key] ?? CONFIDENCE_LABEL.unknown;

  return (
    <Badge tone={key} dot title={label.hint}>
      {compact ? key : `${label.ko} · ${key}`}
    </Badge>
  );
}
