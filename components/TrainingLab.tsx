"use client";

import { useMemo, useState } from "react";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { displayName } from "@/lib/research";
import type { Creature } from "@/lib/types";

const POTENTIAL = ["common", "uncommon", "rare", "epic", "perfect", "unknown"] as const;
const SPARKLE = ["none", "normal", "brilliant", "shadow", "unknown"] as const;
const TABS = [
  { id: "editor", label: "개체 편집기" },
  { id: "evo", label: "진화 그래프" },
  { id: "resonance", label: "공명 플래너" },
  { id: "egg", label: "알 부화" },
  { id: "breed", label: "교배 랩" },
  { id: "nurture", label: "지맥 트래커" },
] as const;

type TabId = (typeof TABS)[number]["id"];

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
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-3 py-1.5 text-sm ${
              tab === item.id ? "bg-[var(--moss)] text-[var(--paper)]" : "bg-[var(--moss-soft)] text-[var(--ink)]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "editor" ? (
        <section className="wiki-card grid gap-5 p-6 sm:grid-cols-2">
          <label className="text-sm">
            종
            <select
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--paper-2)] px-3 py-2"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
            >
              {creatures.map((item) => (
                <option key={item.id} value={item.slug}>
                  {displayName(item)} {item.aniilog_no ? `(NO.${item.aniilog_no})` : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="text-sm">
            <p className="text-[var(--muted)]">종족치</p>
            <p className="mt-1">
              {creature?.official_stats_species
                ? `공식 합 ${creature.official_stats_species.total_attr}`
                : "null — 추정하지 않음"}
            </p>
          </div>
          <label className="text-sm">
            잠재력 등급 (밴드 수치 미공개)
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
            스파클 스타일
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
            유대 / 트와인 (bond_level)
            <input
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--paper-2)] px-3 py-2"
              placeholder="null — 임계값 미공개"
              value={bond}
              onChange={(event) => setBond(event.target.value)}
            />
          </label>
          <label className="text-sm">
            공명 레벨 (20–60, 이득량 null)
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
          <h2 className="font-serif text-2xl">문서화된 분기만</h2>
          <p className="mt-2 text-[var(--ink-soft)]">
            스키마 예시: Pebbling → Geodeback(땅) 또는 Lavazar(불). 재료 ID는 unknown.
          </p>
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
            <ConfidenceChip value="community" /> 재료·레벨 조건은 null
          </p>
        </section>
      ) : null}

      {tab === "resonance" ? (
        <section className="wiki-card p-6 text-sm">
          <h2 className="font-serif text-2xl">공명 플래너</h2>
          <p className="mt-2 text-[var(--ink-soft)]">
            아스트라나이트 Basic / Standard / Advanced를 소비한다고 알려져 있습니다. 레벨당 스탯 증가와 비용 테이블은
            가이드도 “미공개”라고 하므로 모두 null입니다.
          </p>
          <table className="mt-4 w-full">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                <th className="py-2">티어</th>
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
          <h2 className="font-serif text-2xl">알 · Hatchinator</h2>
          <ul className="mt-3 list-disc pl-5 text-[var(--ink-soft)]">
            <li>
              수줍달 신비한 알 — 사전예약 보상 <ConfidenceChip value="confirmed" compact />
            </li>
            <li>스파클 알 — 스파클 확정 (community)</li>
            <li>원더 알 — 알파 또는 스파클 이상 (community)</li>
            <li>흑요석 알 — 공식 스파클 스타일 표에 등장 (confirmed)</li>
            <li>부화 타이머 초 단위: null · Caress 사용 횟수 관찰치 ~20 (community)</li>
          </ul>
          <div className="mt-4 rounded-2xl border border-dashed border-[var(--line)] p-4 font-mono text-xs">
            timer_seconds = null
          </div>
        </section>
      ) : null}

      {tab === "breed" ? (
        <section className="wiki-card p-6 text-sm leading-7">
          <h2 className="font-serif text-2xl">교배 랩</h2>
          <p className="text-[var(--ink-soft)]">
            게임 텍스트를 인용한 커뮤니티 규칙: 지정 부모의 스파클·천휘 형태는 100% 유전. 그 외 IV/잠재력 공식은
            unknown.
          </p>
          <label className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={inheritSparkle}
              onChange={(event) => setInheritSparkle(event.target.checked)}
            />
            지정 부모 스파클 100% 유전
          </label>
          <label className="mt-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={inheritPrismana}
              onChange={(event) => setInheritPrismana(event.target.checked)}
            />
            지정 부모 천휘 형태 100% 유전
          </label>
          <p className="mt-4 font-mono text-xs">other_iv_rules = null</p>
        </section>
      ) : null}

      {tab === "nurture" ? (
        <section className="wiki-card p-6 text-sm leading-7">
          <h2 className="font-serif text-2xl">지맥 / 천휘 트래커</h2>
          <p>
            공식 육성 확률: 천휘 즉시 {nurture.prismana_instant_chance * 100}% · 에너지 +{nurture.prismana_energy_gain} ·
            소프트 피티 {nurture.prismana_energy_soft_pity}{" "}
            <ConfidenceChip value="confirmed" compact />
          </p>
          <p className="text-[var(--ink-soft)]">
            도감 약 40% 생태 육성, 70% 날씨/천휘, 80% 스파클 레이더는 언론·커뮤니티 수치입니다.
          </p>
          <label className="mt-4 block">
            지역 수집 %
            <input
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--paper-2)] px-3 py-2"
              placeholder="기록용 · 공식 해금 테이블 아님"
              value={collection}
              onChange={(event) => setCollection(event.target.value)}
            />
          </label>
        </section>
      ) : null}

      <aside className="mt-6 wiki-card p-5 text-xs leading-6 text-[var(--ink-soft)]">
        <p className="font-medium text-[var(--ink)]">공식 포획 계수 (시뮬 인벤토리)</p>
        <p className="mt-1 font-mono">
          aniipod {capture.aniipod} · super {capture.super_aniipod} · speed/tracking/ultimate{" "}
          {capture.speed_tracking_ultimate} · champion/sparkling {capture.champion_sparkling} · big white{" "}
          {capture.big_white_ball} / mass {capture.big_white_ball_mass_control}
        </p>
        <p>
          출처:{" "}
          <a className="text-[var(--moss)] underline underline-offset-4" href={capture.source}>
            {capture.source}
          </a>
        </p>
      </aside>
    </div>
  );
}
