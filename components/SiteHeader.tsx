import Link from "next/link";
import { NAV } from "@/lib/labels";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--paper)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-serif text-xl tracking-tight text-[var(--ink)]">애니모 위키</span>
          <span className="hidden text-[11px] uppercase tracking-[0.22em] text-[var(--muted)] sm:inline">
            Aniimo · fan
          </span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-1 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 text-[var(--ink-soft)] transition hover:bg-[var(--moss-soft)] hover:text-[var(--ink)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
