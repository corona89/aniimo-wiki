"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { NamePair } from "@/components/NamePair";
import { ElementBadge } from "@/components/ui";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { creatures, regions, sources } from "@/lib/research";

export function SearchClient() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");

  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) return { creatures: [], regions: [], sources: [] };
    const creatureHits = creatures.filter((creature) =>
      [creature.name_ko, creature.name_en, creature.slug, creature.aniilog_no, creature.id, creature.notes]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
    const regionHits = regions.filter((region) =>
      [region.name_ko, region.name_en, region.id, region.biome_notes, ...(region.name_ko_alt ?? []), ...(region.name_en_alt ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
    const sourceHits = sources.filter((source) =>
      [source.title, source.url, source.type, source.notes].filter(Boolean).join(" ").toLowerCase().includes(q),
    );
    return { creatures: creatureHits, regions: regionHits, sources: sourceHits };
  }, [q]);

  function onChange(value: string) {
    setQuery(value);
    const next = value.trim() ? `/search?q=${encodeURIComponent(value.trim())}` : "/search";
    router.replace(next, { scroll: false });
  }

  const total = results.creatures.length + results.regions.length + results.sources.length;

  return (
    <div>
      <input
        autoFocus
        value={query}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t.search.placeholder}
        className="w-full rounded-full border border-[var(--line)] bg-[var(--paper-2)] px-5 py-3 text-base outline-none ring-[var(--moss)] focus:ring-2"
      />

      {!q ? (
        <p className="mt-8 text-sm text-[var(--muted)]">{t.search.typePrompt}</p>
      ) : total === 0 ? (
        <p className="mt-8 text-sm text-[var(--muted)]">{t.search.noResults}</p>
      ) : (
        <div className="mt-6 space-y-10">
          <p className="text-sm text-[var(--muted)]">{t.search.resultsCount(total)}</p>

          {results.creatures.length > 0 ? (
            <section>
              <h2 className="mb-3 font-display text-xl">
                {t.search.creatures} · {results.creatures.length}
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {results.creatures.map((creature) => (
                  <li key={creature.id}>
                    <Link href={`/creatures/${creature.slug}`} className="wiki-card card-hover block p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-mono text-xs text-[var(--muted)]">
                          {creature.aniilog_no ? `NO.${creature.aniilog_no}` : creature.id}
                        </p>
                        <ConfidenceChip value={creature.confidence} compact />
                      </div>
                      <div className="mt-2">
                        <NamePair ko={creature.name_ko} en={creature.name_en} />
                      </div>
                      <div className="mt-2">
                        <ElementBadge element={creature.element} compact />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {results.regions.length > 0 ? (
            <section>
              <h2 className="mb-3 font-display text-xl">
                {t.search.regions} · {results.regions.length}
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {results.regions.map((region) => (
                  <li key={region.id}>
                    <Link href={`/world#${region.id}`} className="wiki-card card-hover block p-4">
                      <NamePair ko={region.name_ko} en={region.name_en} size="sm" />
                      <p className="mt-1 font-mono text-[11px] text-[var(--muted)]">{region.id}</p>
                      <div className="mt-2">
                        <ConfidenceChip value={region.confidence} compact />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {results.sources.length > 0 ? (
            <section>
              <h2 className="mb-3 font-display text-xl">
                {t.search.sources} · {results.sources.length}
              </h2>
              <ul className="space-y-2">
                {results.sources.map((source) => (
                  <li key={source.url} className="wiki-card p-4">
                    <a className="link-moss font-medium" href={source.url} target="_blank" rel="noopener noreferrer">
                      {source.title}
                    </a>
                    <p className="mt-1 break-all text-xs text-[var(--muted)]">{source.url}</p>
                    {source.notes ? <p className="mt-1 text-xs text-[var(--ink-soft)]">{source.notes}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
