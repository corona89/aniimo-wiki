import { notFound } from "next/navigation";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { NamePair } from "@/components/NamePair";
import { PageHeader } from "@/components/PageHeader";
import { ElementBadge, LinkButton, StatBar } from "@/components/ui";
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
      <PageHeader
        crumbs={[
          { label: "홈", href: "/" },
          { label: "도감", href: "/creatures" },
          { label: creature.name_ko ?? creature.name_en ?? creature.slug },
        ]}
        kicker={creature.aniilog_no ? `NO.${creature.aniilog_no}` : creature.id}
        title={creature.name_ko ?? creature.name_en ?? creature.slug}
        description={creature.notes ?? creature.form_notes ?? undefined}
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="wiki-card p-6">
          <NamePair ko={creature.name_ko} en={creature.name_en} size="lg" />
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <ConfidenceChip value={creature.confidence} />
            <ElementBadge element={creature.element} />
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
          <h2 className="font-display text-2xl">종족치</h2>
          {stats ? (
            <div className="mt-4 space-y-3">
              <StatBar label="합 (총합)" value={stats.total_attr} max={600} />
              <StatBar label="HP" value={stats.hp} />
              <StatBar label="무력화" value={stats.break} />
              <StatBar label="공격" value={stats.attack} />
              <StatBar label="마법 방어" value={stats.magic_def} />
              <StatBar label="물리 방어" value={stats.phys_def} />
              <StatBar label="에너지 회복" value={stats.energy_regen} />
              <div className="pt-1">
                <ConfidenceChip value={stats.confidence} />
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
              이 행의 종족치는 <span className="font-mono">null</span>입니다. 공식 인덱스에서 확인되기 전에는 전투
              숫자를 채우지 않습니다.
            </p>
          )}
        </section>
      </div>

      <div className="mt-8">
        <LinkButton href="/creatures" variant="ghost">
          ← 도감으로 돌아가기
        </LinkButton>
      </div>
    </div>
  );
}
