import Link from "next/link";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items, light = false }: { items: Crumb[]; light?: boolean }) {
  return (
    <nav
      aria-label="breadcrumb"
      className={`flex flex-wrap items-center gap-1.5 text-xs ${
        light ? "text-white/85" : "text-[var(--muted)]"
      }`}
    >
      {items.map((crumb, index) => (
        <span key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
          {crumb.href ? (
            <Link href={crumb.href} className="transition hover:underline">
              {crumb.label}
            </Link>
          ) : (
            <span className="font-medium">{crumb.label}</span>
          )}
          {index < items.length - 1 ? (
            <span aria-hidden className="opacity-60">
              ›
            </span>
          ) : null}
        </span>
      ))}
    </nav>
  );
}
