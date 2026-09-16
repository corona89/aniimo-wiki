import Image from "next/image";
import Link from "next/link";
import { AuthControls } from "@/components/AuthControls";
import { LocaleToggle } from "@/components/LocaleToggle";
import { getT } from "@/lib/i18n";

export async function SiteHeader() {
  const { t } = await getT();
  const nav = [
    { href: "/", label: t.nav.home },
    { href: "/world", label: t.nav.world },
    { href: "/creatures", label: t.nav.creatures },
    { href: "/systems", label: t.nav.systems },
    { href: "/training", label: t.nav.training },
    { href: "/maps", label: t.nav.maps },
    { href: "/search", label: t.nav.search },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] glass">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <Image
            src="/art/crest.jpg"
            alt={t.common.brand}
            width={40}
            height={40}
            className="h-9 w-9 rounded-xl border border-[var(--line)] object-cover shadow-sm transition group-hover:scale-105"
            priority
          />
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg tracking-tight text-[var(--ink)]">{t.common.brand}</span>
            <span className="text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
              {t.common.brandSub}
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <nav className="flex flex-wrap items-center justify-end gap-0.5 text-sm">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-1.5 font-medium text-[var(--ink-soft)] transition hover:bg-[var(--moss-soft)] hover:text-[var(--moss-deep)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <LocaleToggle />
          <AuthControls />
        </div>
      </div>
    </header>
  );
}
