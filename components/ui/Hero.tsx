import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";

export function Hero({
  image,
  kicker,
  title,
  subtitle,
  crumbs,
  align = "bottom",
  minHeight = "min-h-[440px]",
  children,
}: {
  image: string;
  kicker?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  crumbs?: Crumb[];
  align?: "bottom" | "center";
  minHeight?: string;
  children?: ReactNode;
}) {
  return (
    <section className={`hero flex ${align === "center" ? "items-center" : "items-end"} ${minHeight}`}>
      <div className="hero-media" style={{ backgroundImage: `url(${image})` }} />
      <div className="hero-scrim" />
      <div className="relative w-full p-6 text-white sm:p-10">
        {crumbs ? (
          <div className="mb-4">
            <Breadcrumbs items={crumbs} light />
          </div>
        ) : null}
        {kicker ? (
          <p className="kicker" style={{ color: "var(--gold-soft)" }}>
            {kicker}
          </p>
        ) : null}
        <h1 className="mt-2 font-display text-4xl leading-[1.05] drop-shadow-sm sm:text-6xl">{title}</h1>
        {subtitle ? (
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/90 sm:text-base">{subtitle}</p>
        ) : null}
        {children ? <div className="mt-6 flex flex-wrap items-center gap-3">{children}</div> : null}
      </div>
    </section>
  );
}
