export function PageHeader({
  kicker,
  title,
  description,
}: {
  kicker?: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-10 max-w-3xl">
      {kicker ? (
        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-[var(--gold)]">{kicker}</p>
      ) : null}
      <h1 className="font-serif text-4xl tracking-tight text-[var(--ink)] sm:text-5xl">{title}</h1>
      {description ? (
        <p className="mt-4 text-base leading-7 text-[var(--ink-soft)]">{description}</p>
      ) : null}
    </header>
  );
}
