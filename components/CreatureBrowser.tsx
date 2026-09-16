"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { NamePair } from "@/components/NamePair";
import { ElementBadge } from "@/components/ui";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { ELEMENT_KO } from "@/lib/labels";
import { elementImage } from "@/lib/research";
import type { Creature } from "@/lib/types";

const ELEMENTS = ["Fire", "Water", "Grass", "Lightning", "Earth", "Wind", "Dark", "Ice", "Light"];

export function CreatureBrowser({ creatures }: { creatures: Creature[] }) {
  const { locale, t } = useI18n();
  const [query, setQuery] = useState("");
  const [element, setElement] = useState("all");
  const [onlyOfficial, setOnlyOfficial] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return creatures.filter((creature) => {
      if (onlyOfficial && creature.confidence !== "confirmed") return false;
      if (element !== "all" && creature.element !== element) return false;
      if (!q) return true;
      const hay = [creature.name_ko, creature.name_en, creature.slug, creature.aniilog_no, creature.id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [creatures, element, onlyOfficial, query]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.creatures.searchPlaceholder}
          className="w-full rounded-full border border-[var(--line)] bg-[var(--paper-2)] px-4 py-2.5 text-sm outline-none ring-[var(--moss)] focus:ring-2 sm:max-w-sm"
        />
        <select
          value={element}
          onChange={(event) => setElement(event.target.value)}
          className="rounded-full border border-[var(--line)] bg-[var(--paper-2)] px-3 py-2.5 text-sm"
        >
          <option value="all">{t.creatures.allElements}</option>
          {ELEMENTS.map((item) => (
            <option key={item} value={item}>
              {locale === "en" ? item : `${ELEMENT_KO[item] ?? item} · ${item}`}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyOfficial}
            onChange={(event) => setOnlyOfficial(event.target.checked)}
          />
          {t.creatures.officialOnly}
        </label>
        <p className="text-sm text-[var(--muted)]">
          {filtered.length}
          {locale === "en" ? " " : ""}
          {t.creatures.countSuffix}
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((creature) => {
          const img = elementImage(creature.element);
          return (
            <li key={creature.id}>
              <Link
                href={`/creatures/${creature.slug}`}
                className="wiki-card card-hover block h-full overflow-hidden"
              >
                <div className="relative aspect-[4/3] bg-[var(--moss-soft)]">
                  {img ? (
                    <Image
                      src={img}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-[linear-gradient(135deg,var(--paper-2),var(--moss-soft))] text-3xl">
                      ✦
                    </div>
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-black/45 px-2 py-0.5 font-mono text-[10px] text-white backdrop-blur">
                    {creature.aniilog_no ? `NO.${creature.aniilog_no}` : t.creatures.noNumber}
                  </span>
                  <span className="absolute right-2 top-2">
                    <ConfidenceChip value={creature.confidence} compact />
                  </span>
                </div>
                <div className="p-4">
                  <NamePair ko={creature.name_ko} en={creature.name_en} />
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <ElementBadge element={creature.element} compact />
                    {creature.role_ko ? <span className="chip chip-confirmed">{creature.role_ko}</span> : null}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
