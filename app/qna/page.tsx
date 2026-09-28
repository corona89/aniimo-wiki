import { PageHeader } from "@/components/PageHeader";
import { QnaClient } from "@/components/QnaClient";
import { getT } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.qna.title };
}

export default async function QnaPage() {
  const { t } = await getT();
  return (
    <div>
      <PageHeader
        crumbs={[{ label: t.nav.home, href: "/" }, { label: t.qna.title }]}
        kicker="QnA"
        title={t.qna.title}
        description={t.qna.desc}
      />
      <QnaClient />
    </div>
  );
}
