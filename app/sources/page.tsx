import { EditLink } from "@/components/EditLink";
import { PageHeader } from "@/components/PageHeader";
import { SectionHeading } from "@/components/ui";
import { getT } from "@/lib/i18n";
import { sources } from "@/lib/research";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.search.sources };
}

export default async function SourcesPage() {
  const { t } = await getT();

  const byType = sources.reduce<Record<string, typeof sources>>((acc, source) => {
    (acc[source.type] ??= []).push(source);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        crumbs={[{ label: t.nav.home, href: "/" }, { label: t.search.sources }]}
        kicker="Sources"
        title={t.search.sources}
        description={t.common.unofficial}
      />

      <div className="mb-8">
        <EditLink file="data/research/sources.json" />
      </div>

      <div className="space-y-10">
        {Object.entries(byType).map(([type, list]) => (
          <section key={type}>
            <SectionHeading title={type} />
            <ul className="mt-4 space-y-2">
              {list.map((source) => (
                <li key={source.url} className="wiki-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <a className="link-moss font-medium" href={source.url} target="_blank" rel="noopener noreferrer">
                      {source.title}
                    </a>
                    <span className="font-mono text-[11px] text-[var(--muted)]">{source.accessed}</span>
                  </div>
                  <p className="mt-1 break-all text-xs text-[var(--muted)]">{source.url}</p>
                  {source.notes ? <p className="mt-1 text-xs text-[var(--ink-soft)]">{source.notes}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
