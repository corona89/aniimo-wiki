import type { ReactNode } from "react";

const TONE_COLOR: Record<string, string> = {
  moss: "var(--moss)",
  gold: "var(--gold)",
  sky: "var(--sky)",
  berry: "var(--berry)",
};

export function Callout({
  title,
  tone = "moss",
  icon,
  children,
}: {
  title?: string;
  tone?: keyof typeof TONE_COLOR;
  icon?: ReactNode;
  children: ReactNode;
}) {
  const color = TONE_COLOR[tone] ?? TONE_COLOR.moss;
  return (
    <div
      className="wiki-card p-5"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      {title ? (
        <p className="flex items-center gap-2 font-display text-lg" style={{ color }}>
          {icon}
          {title}
        </p>
      ) : null}
      <div className="mt-1 text-sm leading-7 text-[var(--ink-soft)]">{children}</div>
    </div>
  );
}
