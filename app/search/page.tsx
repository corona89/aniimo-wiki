import { Suspense } from "react";
import { PageHeader } from "@/components/PageHeader";
import { SearchClient } from "@/components/SearchClient";
import { getT } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.search.title };
}

export default async function SearchPage() {
  const { t } = await getT();
  return (
    <div>
      <PageHeader
        crumbs={[{ label: t.nav.home, href: "/" }, { label: t.search.title }]}
        kicker="Search"
        title={t.search.title}
        description={t.search.desc}
      />
      <Suspense fallback={<p className="text-sm text-[var(--muted)]">…</p>}>
        <SearchClient />
      </Suspense>
    </div>
  );
}
