import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";

export function PageHeader({
  kicker,
  title,
  description,
  image,
  crumbs,
}: {
  kicker?: string;
  title: string;
  description?: string;
  image?: string;
  crumbs?: Crumb[];
}) {
  if (image) {
    return (
      <header className="hero mb-10 flex min-h-[260px] items-end sm:min-h-[300px]">
        <div className="hero-media" style={{ backgroundImage: `url(${image})` }} />
        <div className="hero-scrim" />
        <div className="relative w-full p-6 text-white sm:p-8">
          {crumbs ? (
            <div className="mb-3">
              <Breadcrumbs items={crumbs} light />
            </div>
          ) : null}
          {kicker ? (
            <p className="kicker" style={{ color: "var(--gold-soft)" }}>
              {kicker}
            </p>
          ) : null}
          <h1 className="mt-2 font-display text-4xl tracking-tight drop-shadow-sm sm:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/90">{description}</p>
          ) : null}
        </div>
      </header>
    );
  }

  return (
    <header className="mb-10 max-w-3xl">
      {crumbs ? (
        <div className="mb-3">
          <Breadcrumbs items={crumbs} />
        </div>
      ) : null}
      {kicker ? <p className="kicker">{kicker}</p> : null}
      <h1 className="mt-2 font-display text-4xl tracking-tight text-[var(--ink)] sm:text-5xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-4 text-base leading-7 text-[var(--ink-soft)]">{description}</p>
      ) : null}
    </header>
  );
}
