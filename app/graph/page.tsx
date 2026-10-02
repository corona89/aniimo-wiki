import { GraphViewer } from "@/components/GraphViewer";
import { PageHeader } from "@/components/PageHeader";
import { getT } from "@/lib/i18n";
import { graphSnapshot } from "@/lib/knowledge/retrieve";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.graph.title };
}

export default async function GraphPage() {
  const { t } = await getT();
  const graph = graphSnapshot();

  return (
    <div>
      <PageHeader
        crumbs={[{ label: t.nav.home, href: "/" }, { label: t.graph.title }]}
        kicker="Knowledge Graph"
        title={t.graph.title}
        description={t.graph.subtitle}
      />
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <GraphViewer graph={graph} />
      </section>
    </div>
  );
}
