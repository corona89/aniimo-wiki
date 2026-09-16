"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
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
  const { t } = useI18n();
  const key = (value ?? "unknown") as Confidence;
  const label = t.confidence[key] ?? t.confidence.unknown;
  const hint = CONFIDENCE_LABEL[key]?.hint ?? CONFIDENCE_LABEL.unknown.hint;

  return (
    <Badge tone={key} dot title={hint}>
      {compact ? key : `${label} · ${key}`}
    </Badge>
  );
}
