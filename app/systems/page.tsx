import { ConfidenceChip } from "@/components/ConfidenceChip";
import { AdminEditLink } from "@/components/AdminEditLink";
import { PageHeader } from "@/components/PageHeader";
import { getT } from "@/lib/i18n";
import { trainingSchema } from "@/lib/research";

const PODS = [
  { name: "애니팟", coeff: "×1" },
  { name: "슈퍼 애니팟", coeff: "×1.5" },
  { name: "스피드 / 트래킹 / 얼티밋", coeff: "×2" },
  { name: "챔피언 / 스파클", coeff: "= 100%" },
  { name: "빅화이트볼", coeff: "×2 / ×6" },
];

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.systems.title };
}

export default async function SystemsPage() {
  const { t } = await getT();
  const coeffs = trainingSchema.capture_coeffs_official;

  return (
    <div>
      <PageHeader
        crumbs={[{ label: t.nav.home, href: "/" }, { label: t.systems.title }]}
        kicker="Systems"
        title={t.systems.title}
        description={t.systems.desc}
      />

      <div className="mb-8 flex justify-end">
        <AdminEditLink file="data/research/systems.md" />
      </div>

      <div className="grid gap-6">
        <section className="wiki-card p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl">{t.systems.twineTitle}</h2>
            <ConfidenceChip value="confirmed" />
          </div>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
            {t.systems.twineBody} <ConfidenceChip value="unknown" compact />
            {t.systems.twineBodyTail}
          </p>
        </section>

        <section className="wiki-card p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl">{t.systems.captureTitle}</h2>
            <ConfidenceChip value={coeffs.confidence} />
          </div>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{t.systems.captureBody}</p>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                <th className="py-2">{t.systems.thPod}</th>
                <th>{t.systems.thCoeff}</th>
              </tr>
            </thead>
            <tbody>
              {PODS.map((pod) => (
                <tr key={pod.name} className="border-t border-[var(--line)]">
                  <td className="py-2">{pod.name}</td>
                  <td className="font-mono">{pod.coeff}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs">
            {t.common.source}:{" "}
            <a className="link-moss" href={coeffs.source}>
              {coeffs.source}
            </a>
          </p>
        </section>

        <section className="wiki-card p-6">
          <h2 className="font-display text-2xl">{t.systems.combatTitle}</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
            {t.systems.combatBody} <strong>{t.systems.combatBoldTail}</strong>
          </p>
        </section>

        <section className="wiki-card p-6">
          <h2 className="font-display text-2xl">{t.systems.evoTitle}</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{t.systems.evoBody}</p>
        </section>

        <section className="wiki-card p-6">
          <h2 className="font-display text-2xl">{t.systems.homeTitle}</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{t.systems.homeBody}</p>
        </section>

        <section className="wiki-card p-6">
          <h2 className="font-display text-2xl">{t.systems.multiTitle}</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-[var(--ink-soft)]">
            <li>
              {t.systems.multiItem1} <ConfidenceChip value="confirmed" compact />
            </li>
            <li>
              {t.systems.multiItem2} <ConfidenceChip value="unknown" compact />
            </li>
            <li>{t.systems.multiItem3}</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
