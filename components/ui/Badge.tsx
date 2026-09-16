import type { ReactNode } from "react";

const TONE_CLASS: Record<string, string> = {
  confirmed: "chip-confirmed",
  marketing: "chip-marketing",
  community: "chip-community",
  unknown: "chip-unknown",
};

export function Badge({
  tone = "unknown",
  dot = false,
  title,
  className = "",
  children,
}: {
  tone?: string;
  dot?: boolean;
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  const cls = TONE_CLASS[tone] ?? "chip-unknown";
  return (
    <span className={`chip ${cls} ${className}`} title={title}>
      {dot ? <span className="chip-dot" /> : null}
      {children}
    </span>
  );
}
