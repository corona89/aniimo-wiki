import Image from "next/image";
import Link from "next/link";
import { getT } from "@/lib/i18n";

export async function SiteFooter() {
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
    <footer className="mt-16 border-t border-[var(--line)] bg-[var(--moss-deep)] text-[var(--paper)]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-[1.4fr_1fr] sm:px-6">
        <div>
          <div className="flex items-center gap-2.5">
            <Image
              src="/art/crest.jpg"
              alt={t.common.brand}
              width={36}
              height={36}
              className="h-9 w-9 rounded-xl object-cover"
            />
            <p className="font-display text-xl">{t.common.fanWiki}</p>
          </div>
          <p className="mt-3 max-w-xl text-[13px] leading-6 text-[color-mix(in_oklab,var(--paper)_78%,transparent)]">
            {t.common.unofficial}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[13px] sm:justify-items-end">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-white/75 underline decoration-white/25 underline-offset-4 transition hover:text-white hover:decoration-white"
            >
              {item.label}
            </Link>
          ))}
          <p className="col-span-2 mt-3 text-white/50 sm:text-right">{t.common.dataPack}</p>
        </div>
      </div>
    </footer>
  );
}
