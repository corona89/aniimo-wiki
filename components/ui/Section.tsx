import type { ReactNode } from "react";

export function SectionHeading({
  kicker,
  title,
  description,
  action,
  className = "",
}: {
  kicker?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-4 ${className}`}>
      <div className="max-w-3xl">
        {kicker ? <p className="kicker">{kicker}</p> : null}
        <h2 className="mt-1 font-display text-2xl sm:text-3xl">{title}</h2>
        {description ? (
          <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
