"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";

export function NamePair({
  ko,
  en,
  size = "md",
}: {
  ko?: string | null;
  en?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const { locale } = useI18n();

  const primaryVal = locale === "en" ? (en ?? ko) : (ko ?? en);
  const secondaryVal = locale === "en" ? (en ? ko : null) : (ko ? en : null);
  const primary = primaryVal ?? (locale === "en" ? "Unknown name" : "이름 미상");

  const primaryClass =
    size === "lg"
      ? "font-display text-3xl tracking-tight"
      : size === "sm"
        ? "text-sm font-semibold"
        : "font-display text-xl";

  return (
    <span className="inline-flex flex-col leading-tight">
      <span className={primaryClass}>{primary}</span>
      {secondaryVal ? (
        <span className="mt-0.5 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
          {secondaryVal}
        </span>
      ) : null}
    </span>
  );
}
