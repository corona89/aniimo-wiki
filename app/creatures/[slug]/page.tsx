import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { NamePair } from "@/components/NamePair";
import { PageHeader } from "@/components/PageHeader";
import { elementLabel } from "@/lib/labels";
import { creatures, getCreature } from "@/lib/research";

export function generateStaticParams() {
  return creatures.map((creature) => ({ slug: creature.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const creature = getCreature(slug);
  return {
    title: creature ? (creature.name_ko ?? creature.name_en ?? slug) : slug,
  };
}

export default async function CreatureDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const creature = getCreature(slug);
  if (!creature) notFound();

  const stats = creature.official_stats_species ?? creature.stats ?? null;

  return (
    <div>
      <p className="mb-4 text-sm">
        <Link href="/creatures" className="text-[var(--moss)] underline underline-offset-4">
          ← 도감
        </Link>
      </p>
      <PageHeader
        kicker={creature.aniilog_no ? `NO.${creature.aniilog_no}` : creature.id}
        title={creature.name_ko ?? creature.name_en ?? creature.slug}
        description={creature.notes ?? creature.form_notes ?? undefined}
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="wiki-card p-6">
          <NamePair ko={creature.name_ko} en={creature.name_en} size="lg" />
          <div className="mt-4 flex flex-wrap gap-2">
            <ConfidenceChip value={creature.confidence} />
            <span className="chip chip-community">{elementLabel(creature.element)}</span>
            {creature.role_ko ? <span className="chip chip-confirmed">{creature.role_ko}</span> : null}
          </div>
          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[var(--muted)]">슬러그</dt>
              <dd className="font-mono">{creature.slug}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">희귀/입수</dt>
              <dd>{creature.rarity ?? "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[var(--muted)]">서식지 힌트</dt>
              <dd>{creature.habitat_region_hints?.join(" · ") || "미수록"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[var(--muted)]">확인된 형태</dt>
              <dd>{creature.forms_known?.join(" · ") || "미수록"}</dd>
            </div>
          </dl>
          {creature.source ? (
            <p className="mt-6 text-xs">
              출처:{" "}
              <a className="break-all text-[var(--moss)] underline underline-offset-4" href={creature.source}>
                {creature.source}
              </a>
            </p>
          ) : null}
        </section>

        <section className="wiki-card p-6">
          <h2 className="font-serif text-2xl">종족치</h2>
          {stats ? (
            <ul className="mt-4 space-y-2 text-sm">
              {[
                ["합", stats.total_attr],
                ["HP", stats.hp],
                ["무력화", stats.break],
                ["공격", stats.attack],
                ["마법 방어", stats.magic_def],
                ["물리 방어", stats.phys_def],
                ["에너지 회복", stats.energy_regen],
              ].map(([label, value]) => (
                <li key={String(label)} className="flex justify-between border-b border-[var(--line)] py-1.5">
                  <span>{label}</span>
                  <span className="font-mono">{value ?? "null"}</span>
                </li>
              ))}
              <li className="pt-2">
                <ConfidenceChip value={stats.confidence} />
              </li>
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
              이 행의 종족치는 <span className="font-mono">null</span>입니다. 공식 인덱스에서 확인되기 전에는 전투
              숫자를 채우지 않습니다.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
