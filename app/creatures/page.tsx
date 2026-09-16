import { CreatureBrowser } from "@/components/CreatureBrowser";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { PageHeader } from "@/components/PageHeader";
import { creatureNamingFlags, creatureRosterNotes, creatures } from "@/lib/research";

export const metadata = {
  title: "애니모 도감",
};

export default function CreaturesPage() {
  return (
    <div>
      <PageHeader
        image="/art/creatures-party.jpg"
        crumbs={[{ label: "홈", href: "/" }, { label: "애니모 도감" }]}
        kicker="Aniilog / Creatures"
        title="애니모 도감"
        description="한글 이름은 공식 인덱스·스토어에서 확인된 종만 넣었습니다. 종족치는 공식 페이지가 있는 행만 표시하며, 그 외 stats는 null입니다."
      />

      <section className="mb-8 grid gap-4 sm:grid-cols-2">
        <article className="wiki-card p-5 text-sm leading-7 text-[var(--ink-soft)]">
          <h2 className="font-display text-xl text-[var(--ink)]">로스터 규모</h2>
          <p className="mt-2">마케팅(PS): {creatureRosterNotes.marketing_ps_store}</p>
          <p>CB2 블러브: {creatureRosterNotes.cb2_paws_up}</p>
          <p>Aniidex: {creatureRosterNotes.aniimoguide_aniidex_2026_09_16}</p>
          <p className="mt-2 text-xs text-[var(--muted)]">{creatureRosterNotes.policy}</p>
        </article>
        <article className="wiki-card p-5 text-sm leading-7 text-[var(--ink-soft)]">
          <h2 className="font-display text-xl text-[var(--ink)]">이름 대기열</h2>
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
      </section>

      <CreatureBrowser creatures={creatures} />
    </div>
  );
}
