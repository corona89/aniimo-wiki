import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { EditLink } from "@/components/EditLink";
import { NamePair } from "@/components/NamePair";
import { PageHeader } from "@/components/PageHeader";
import { ElementBadge, LinkButton, SectionHeading, StatBar } from "@/components/ui";
import { getT } from "@/lib/i18n";
import {
  creatures,
  displayName,
  elementImage,
  getCreature,
  regionDisplayName,
  regionsForCreature,
  relatedCreatures,
} from "@/lib/research";

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

  const { locale, t } = await getT();
  const stats = creature.official_stats_species ?? creature.stats ?? null;
  const img = elementImage(creature.element);
  const relatedRegions = regionsForCreature(creature);
  const kin = relatedCreatures(creature);

  return (
    <div>
      <PageHeader
        crumbs={[
          { label: t.nav.home, href: "/" },
          { label: t.nav.creatures, href: "/creatures" },
          { label: displayName(creature, locale) },
        ]}
        kicker={creature.aniilog_no ? `NO.${creature.aniilog_no}` : creature.id}
        title={displayName(creature, locale)}
        description={creature.notes ?? creature.form_notes ?? undefined}
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="wiki-card overflow-hidden">
          {img ? (
            <div className="relative aspect-[16/9] bg-[var(--moss-soft)]">
              <Image
                src={img}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
                priority
              />
            </div>
          ) : null}
          <div className="p-6">
            <NamePair ko={creature.name_ko} en={creature.name_en} size="lg" />
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <ConfidenceChip value={creature.confidence} />
              <ElementBadge element={creature.element} />
              {creature.role_ko ? <span className="chip chip-confirmed">{creature.role_ko}</span> : null}
            </div>
            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--muted)]">{t.detail.slug}</dt>
                <dd className="font-mono">{creature.slug}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">{t.detail.rarity}</dt>
                <dd>{creature.rarity ?? t.common.none}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[var(--muted)]">{t.detail.habitatHints}</dt>
                <dd>{creature.habitat_region_hints?.join(" · ") || t.common.notRecorded}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[var(--muted)]">{t.detail.knownForms}</dt>
                <dd>{creature.forms_known?.join(" · ") || t.common.notRecorded}</dd>
              </div>
            </dl>
            {creature.source ? (
              <p className="mt-6 text-xs">
                {t.common.source}:{" "}
                <a className="break-all link-moss" href={creature.source}>
                  {creature.source}
                </a>
              </p>
            ) : null}
          </div>
        </section>

        <section className="wiki-card p-6">
          <h2 className="font-display text-2xl">{t.detail.baseStats}</h2>
          {stats ? (
            <div className="mt-4 space-y-3">
              <StatBar label={t.detail.total} value={stats.total_attr} max={600} />
              <StatBar label={t.detail.hp} value={stats.hp} />
              <StatBar label={t.detail.break} value={stats.break} />
              <StatBar label={t.detail.attack} value={stats.attack} />
              <StatBar label={t.detail.magicDef} value={stats.magic_def} />
              <StatBar label={t.detail.physDef} value={stats.phys_def} />
              <StatBar label={t.detail.energyRegen} value={stats.energy_regen} />
              <div className="pt-1">
                <ConfidenceChip value={stats.confidence} />
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">{t.detail.nullNote}</p>
          )}
        </section>
      </div>

      {relatedRegions.length > 0 ? (
        <section className="mt-10">
          <SectionHeading title={t.detail.relatedHabitats} />
          <div className="mt-4 flex flex-wrap gap-2">
            {relatedRegions.map((region) => (
              <Link key={region.id} href={`/world#${region.id}`} className="chip chip-community">
                {regionDisplayName(region, locale)}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {kin.length > 0 ? (
        <section className="mt-10">
          <SectionHeading title={t.detail.relatedForms} />
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {kin.map((other) => (
              <li key={other.id}>
                <Link href={`/creatures/${other.slug}`} className="wiki-card card-hover flex items-center gap-3 p-3">
                  {elementImage(other.element) ? (
                    <Image
                      src={elementImage(other.element)!}
                      alt=""
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-lg object-cover"
                    />
                  ) : null}
                  <NamePair ko={other.name_ko} en={other.name_en} size="sm" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <LinkButton href="/creatures" variant="ghost">
          {t.common.backToDex}
        </LinkButton>
        <EditLink file="data/research/creatures.json" />
      </div>
    </div>
  );
}
