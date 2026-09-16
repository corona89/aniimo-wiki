"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { NamePair } from "@/components/NamePair";
import { elementLabel } from "@/lib/labels";
import type { Creature } from "@/lib/types";

const ELEMENTS = ["Fire", "Water", "Grass", "Lightning", "Earth", "Wind", "Dark", "Ice", "Light"];

export function CreatureBrowser({ creatures }: { creatures: Creature[] }) {
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
          placeholder="이름, 번호, 슬러그 검색"
          className="w-full rounded-full border border-[var(--line)] bg-[var(--paper-2)] px-4 py-2.5 text-sm outline-none ring-[var(--moss)] focus:ring-2 sm:max-w-sm"
        />
        <select
          value={element}
          onChange={(event) => setElement(event.target.value)}
          className="rounded-full border border-[var(--line)] bg-[var(--paper-2)] px-3 py-2.5 text-sm"
        >
          <option value="all">모든 속성</option>
          {ELEMENTS.map((item) => (
            <option key={item} value={item}>
              {elementLabel(item)}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyOfficial}
            onChange={(event) => setOnlyOfficial(event.target.checked)}
          />
          공식 KO 확인만
        </label>
        <p className="text-sm text-[var(--muted)]">{filtered.length}종</p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((creature) => (
          <li key={creature.id}>
            <Link href={`/creatures/${creature.slug}`} className="wiki-card block h-full p-4 hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-mono text-xs text-[var(--muted)]">
                  {creature.aniilog_no ? `NO.${creature.aniilog_no}` : "번호 없음"}
                </p>
                <ConfidenceChip value={creature.confidence} compact />
              </div>
              <div className="mt-2">
                <NamePair ko={creature.name_ko} en={creature.name_en} />
              </div>
              <p className="mt-3 text-xs text-[var(--muted)]">
                {elementLabel(creature.element)}
                {creature.role_ko ? ` · ${creature.role_ko}` : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
