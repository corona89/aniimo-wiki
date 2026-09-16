import Link from "next/link";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { EditLink } from "@/components/EditLink";
import { NamePair } from "@/components/NamePair";
import { PageHeader } from "@/components/PageHeader";
import { getT } from "@/lib/i18n";
import { creaturesInRegion, displayName, regionCountNotes, regions, worldInfo } from "@/lib/research";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.world.title };
}

export default async function WorldPage() {
  const { locale, t } = await getT();

  return (
    <div>
      <PageHeader
        image="/art/world-vista.jpg"
        crumbs={[{ label: t.nav.home, href: "/" }, { label: t.world.title }]}
        kicker="World / Regions"
        title={t.world.title}
        description={t.world.desc}
      />

      <div className="mb-8 flex justify-end">
        <EditLink file="data/research/regions.json" />
      </div>

      <section className="wiki-card p-6">
        <h2 className="font-display text-2xl">{t.world.worldName}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <NamePair ko={worldInfo.name_ko} en={worldInfo.name_en} size="lg" />
            <div className="mt-2">
              <ConfidenceChip value={worldInfo.confidence} />
            </div>
            <p className="mt-3 text-sm text-[var(--ink-soft)]">{worldInfo.notes}</p>
          </div>
          <dl className="text-sm leading-7 text-[var(--ink-soft)]">
            <div>
              <dt className="text-[var(--muted)]">{t.world.fextralife}</dt>
              <dd>{regionCountNotes.fextralife_stated} · community</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">{t.world.aniimotools}</dt>
              <dd>{regionCountNotes.aniimotools_stated}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">{t.world.habitats}</dt>
              <dd>{regionCountNotes.aniimoguide_habitats}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mt-8 wiki-card p-6">
        <h2 className="font-display text-2xl">{t.world.ambiguityTitle}</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-[var(--ink-soft)]">
          {t.world.ambiguityItems.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-8 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
              <th className="border-b border-[var(--line)] px-3 py-3">{t.world.thName}</th>
              <th className="border-b border-[var(--line)] px-3 py-3">{t.world.thBiome}</th>
              <th className="border-b border-[var(--line)] px-3 py-3">{t.world.thLevel}</th>
              <th className="border-b border-[var(--line)] px-3 py-3">{t.world.thCreatures}</th>
              <th className="border-b border-[var(--line)] px-3 py-3">{t.world.thConfidence}</th>
            </tr>
          </thead>
          <tbody>
            {regions.map((region) => {
              const inhabitants = creaturesInRegion(region);
              return (
                <tr key={region.id} id={region.id} className="scroll-mt-24 align-top">
                  <td className="border-b border-[var(--line)] px-3 py-3">
                    <NamePair ko={region.name_ko} en={region.name_en} size="sm" />
                    <p className="mt-1 font-mono text-[11px] text-[var(--muted)]">{region.id}</p>
                  </td>
                  <td className="border-b border-[var(--line)] px-3 py-3 text-[var(--ink-soft)]">
                    {region.biome_notes ?? t.common.none}
                    {region.weather_notes ? (
                      <p className="mt-1 text-xs text-[var(--muted)]">{region.weather_notes}</p>
                    ) : null}
                    {region.level_band ? (
                      <p className="mt-1 font-mono text-xs text-[var(--muted)]">Lv {region.level_band}</p>
                    ) : null}
                  </td>
                  <td className="border-b border-[var(--line)] px-3 py-3 font-mono text-xs">
                    {region.status ?? t.common.none}
                  </td>
                  <td className="border-b border-[var(--line)] px-3 py-3">
                    {inhabitants.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {inhabitants.slice(0, 4).map((creature) => (
                          <Link
                            key={creature.id}
                            href={`/creatures/${creature.slug}`}
                            className="chip chip-community"
                          >
                            {displayName(creature, locale)}
                          </Link>
                        ))}
                        {inhabitants.length > 4 ? (
                          <span className="chip chip-unknown">+{inhabitants.length - 4}</span>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-[var(--muted)]">{t.common.none}</span>
                    )}
                  </td>
                  <td className="border-b border-[var(--line)] px-3 py-3">
                    <ConfidenceChip value={region.confidence} compact />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
