"use client";

import { useMemo, useState } from "react";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { useI18n } from "@/components/i18n/LocaleProvider";
import { displayName } from "@/lib/research";
import type { Creature } from "@/lib/types";

const POTENTIAL = ["common", "uncommon", "rare", "epic", "perfect", "unknown"] as const;
const SPARKLE = ["none", "normal", "brilliant", "shadow", "unknown"] as const;
const TAB_IDS = ["editor", "evo", "resonance", "egg", "breed", "nurture"] as const;

type TabId = (typeof TAB_IDS)[number];

export function TrainingLab({
  creatures,
  capture,
  nurture,
}: {
  creatures: Creature[];
  capture: {
    source: string;
    confidence: string;
    aniipod: number;
    super_aniipod: number;
    speed_tracking_ultimate: number;
    champion_sparkling: string;
    big_white_ball: number;
    big_white_ball_mass_control: number;
  };
  nurture: {
    prismana_instant_chance: number;
    prismana_energy_gain: number;
    prismana_energy_soft_pity: number;
  };
}) {
  const { locale, t } = useI18n();
  const [tab, setTab] = useState<TabId>("editor");
  const [slug, setSlug] = useState(creatures.find((c) => c.slug === "susuta")?.slug ?? creatures[0]?.slug ?? "");
  const [potential, setPotential] = useState<(typeof POTENTIAL)[number]>("unknown");
  const [sparkle, setSparkle] = useState<(typeof SPARKLE)[number]>("none");
  const [bond, setBond] = useState("");
  const [resonance, setResonance] = useState("");
  const [inheritSparkle, setInheritSparkle] = useState(true);
  const [inheritPrismana, setInheritPrismana] = useState(true);
  const [collection, setCollection] = useState("");

  const creature = useMemo(() => creatures.find((item) => item.slug === slug), [creatures, slug]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {TAB_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-3 py-1.5 text-sm ${
              tab === id ? "bg-[var(--moss)] text-[var(--paper)]" : "bg-[var(--moss-soft)] text-[var(--ink)]"
            }`}
          >
            {t.training.tabs[id]}
          </button>
        ))}
      </div>

      {tab === "editor" ? (
        <section className="wiki-card grid gap-5 p-6 sm:grid-cols-2">
          <label className="text-sm">
            {t.training.species}
            <select
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--paper-2)] px-3 py-2"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
            >
              {creatures.map((item) => (
                <option key={item.id} value={item.slug}>
                  {displayName(item, locale)} {item.aniilog_no ? `(NO.${item.aniilog_no})` : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="text-sm">
            <p className="text-[var(--muted)]">{t.training.baseStat}</p>
            <p className="mt-1">
              {creature?.official_stats_species
                ? t.training.baseStatOfficial(creature.official_stats_species.total_attr ?? 0)
                : t.training.baseStatNull}
            </p>
          </div>
          <label className="text-sm">
            {t.training.potential}
            <select
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--paper-2)] px-3 py-2"
              value={potential}
              onChange={(event) => setPotential(event.target.value as (typeof POTENTIAL)[number])}
            >
              {POTENTIAL.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            {t.training.sparkle}
            <select
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--paper-2)] px-3 py-2"
              value={sparkle}
              onChange={(event) => setSparkle(event.target.value as (typeof SPARKLE)[number])}
            >
              {SPARKLE.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            {t.training.bond}
            <input
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--paper-2)] px-3 py-2"
              placeholder={t.training.bondPlaceholder}
              value={bond}
              onChange={(event) => setBond(event.target.value)}
            />
          </label>
          <label className="text-sm">
            {t.training.resonanceLevel}
            <input
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--paper-2)] px-3 py-2"
              placeholder="null"
              value={resonance}
              onChange={(event) => setResonance(event.target.value)}
            />
          </label>
        </section>
      ) : null}

      {tab === "evo" ? (
        <section className="wiki-card p-6 text-sm leading-7">
          <h2 className="font-display text-2xl">{t.training.evoDocOnly}</h2>
          <p className="mt-2 text-[var(--ink-soft)]">{t.training.evoDocBody}</p>
          <svg viewBox="0 0 420 160" className="mt-6 w-full max-w-lg text-[var(--ink)]">
            <rect x="20" y="60" width="110" height="40" rx="10" fill="#fff8eb" stroke="#2f5d45" />
            <text x="75" y="85" textAnchor="middle" fontSize="12">
              Pebbling
            </text>
            <rect x="280" y="20" width="120" height="40" rx="10" fill="#e4f3e8" stroke="#2f5d45" />
            <text x="340" y="45" textAnchor="middle" fontSize="12">
              Geodeback
            </text>
            <rect x="280" y="100" width="120" height="40" rx="10" fill="#f8edd6" stroke="#b07a2a" />
            <text x="340" y="125" textAnchor="middle" fontSize="12">
              Lavazar
            </text>
            <path d="M130 80 L280 40" fill="none" stroke="#2f5d45" />
            <path d="M130 80 L280 120" fill="none" stroke="#b07a2a" />
          </svg>
          <p className="mt-2">
            <ConfidenceChip value="community" /> {t.training.evoMatTail}
          </p>
        </section>
      ) : null}

      {tab === "resonance" ? (
        <section className="wiki-card p-6 text-sm">
          <h2 className="font-display text-2xl">{t.training.resonanceTitle}</h2>
          <p className="mt-2 text-[var(--ink-soft)]">{t.training.resonanceBody}</p>
          <table className="mt-4 w-full">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                <th className="py-2">{t.training.thTier}</th>
                <th>numeric_effect</th>
              </tr>
            </thead>
            <tbody>
              {["Basic Astranite", "Standard Astranite", "Advanced Astranite"].map((name) => (
                <tr key={name} className="border-t border-[var(--line)]">
                  <td className="py-2">{name}</td>
                  <td className="font-mono">null</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {tab === "egg" ? (
        <section className="wiki-card p-6 text-sm leading-7">
          <h2 className="font-display text-2xl">{t.training.eggTitle}</h2>
          <ul className="mt-3 list-disc pl-5 text-[var(--ink-soft)]">
            {t.training.eggItems.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          <div className="mt-4 rounded-2xl border border-dashed border-[var(--line)] p-4 font-mono text-xs">
            timer_seconds = null
          </div>
        </section>
      ) : null}

      {tab === "breed" ? (
        <section className="wiki-card p-6 text-sm leading-7">
          <h2 className="font-display text-2xl">{t.training.breedTitle}</h2>
          <p className="text-[var(--ink-soft)]">{t.training.breedBody}</p>
          <label className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={inheritSparkle}
              onChange={(event) => setInheritSparkle(event.target.checked)}
            />
            {t.training.breedInheritSparkle}
          </label>
          <label className="mt-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={inheritPrismana}
              onChange={(event) => setInheritPrismana(event.target.checked)}
            />
            {t.training.breedInheritPrismana}
          </label>
          <p className="mt-4 font-mono text-xs">other_iv_rules = null</p>
        </section>
      ) : null}

      {tab === "nurture" ? (
        <section className="wiki-card p-6 text-sm leading-7">
          <h2 className="font-display text-2xl">{t.training.nurtureTitle}</h2>
          <p>
            {t.training.nurtureBody(
              nurture.prismana_instant_chance * 100,
              nurture.prismana_energy_gain,
              nurture.prismana_energy_soft_pity,
            )}{" "}
            <ConfidenceChip value="confirmed" compact />
          </p>
          <p className="text-[var(--ink-soft)]">{t.training.nurtureCommunity}</p>
          <label className="mt-4 block">
            {t.training.regionCollection}
            <input
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--paper-2)] px-3 py-2"
              placeholder={t.training.regionCollectionPlaceholder}
              value={collection}
              onChange={(event) => setCollection(event.target.value)}
            />
          </label>
        </section>
      ) : null}

      <aside className="mt-6 wiki-card p-5 text-xs leading-6 text-[var(--ink-soft)]">
        <p className="font-medium text-[var(--ink)]">{t.training.inventoryTitle}</p>
        <p className="mt-1 font-mono">
          aniipod {capture.aniipod} · super {capture.super_aniipod} · speed/tracking/ultimate{" "}
          {capture.speed_tracking_ultimate} · champion/sparkling {capture.champion_sparkling} · big white{" "}
          {capture.big_white_ball} / mass {capture.big_white_ball_mass_control}
        </p>
        <p>
          {t.common.source}:{" "}
          <a className="link-moss" href={capture.source}>
            {capture.source}
          </a>
        </p>
      </aside>
    </div>
  );
}
