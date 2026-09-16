import { ConfidenceChip } from "@/components/ConfidenceChip";
import { CreatureBrowser } from "@/components/CreatureBrowser";
import { EditLink } from "@/components/EditLink";
import { PageHeader } from "@/components/PageHeader";
import { getT } from "@/lib/i18n";
import { creatureNamingFlags, creatureRosterNotes, creatures } from "@/lib/research";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.creatures.title };
}

export default async function CreaturesPage() {
  const { t } = await getT();

  return (
    <div>
      <PageHeader
        image="/art/creatures-party.jpg"
        crumbs={[{ label: t.nav.home, href: "/" }, { label: t.creatures.title }]}
        kicker="Aniilog / Creatures"
        title={t.creatures.title}
        description={t.creatures.desc}
      />

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="grid flex-1 gap-4 sm:grid-cols-2">
          <article className="wiki-card p-5 text-sm leading-7 text-[var(--ink-soft)]">
            <h2 className="font-display text-xl text-[var(--ink)]">{t.creatures.rosterTitle}</h2>
            <p className="mt-2">
              {t.creatures.marketingPs}: {creatureRosterNotes.marketing_ps_store}
            </p>
            <p>
              {t.creatures.cb2}: {creatureRosterNotes.cb2_paws_up}
            </p>
            <p>
              {t.creatures.aniidex}: {creatureRosterNotes.aniimoguide_aniidex_2026_09_16}
            </p>
            <p className="mt-2 text-xs text-[var(--muted)]">{creatureRosterNotes.policy}</p>
          </article>
          <article className="wiki-card p-5 text-sm leading-7 text-[var(--ink-soft)]">
            <h2 className="font-display text-xl text-[var(--ink)]">{t.creatures.namingQueueTitle}</h2>
            <p>
              수줍달 = Susuta (NO.050) <ConfidenceChip value="confirmed" compact />
            </p>
            <p>
              싹크랩 = Budclaw (NO.024) <ConfidenceChip value="confirmed" compact />
            </p>
            <p>
              수수타나: {creatureNamingFlags.수수타나} <ConfidenceChip value="unknown" compact />
            </p>
          </article>
        </div>
        <EditLink file="data/research/creatures.json" />
      </div>

      <p className="mb-4 text-xs text-[var(--muted)]">{t.detail.fanArtNote}</p>

      <CreatureBrowser creatures={creatures} />
    </div>
  );
}
