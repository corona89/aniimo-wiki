import Image from "next/image";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { EditLink } from "@/components/EditLink";
import { Hero, LinkButton, LinkCard, SectionHeading, Stat } from "@/components/ui";
import { CONFIDENCE_LABEL } from "@/lib/labels";
import { getT } from "@/lib/i18n";
import { creatures, meta, regions } from "@/lib/research";
import type { Confidence } from "@/lib/types";

export default async function HomePage() {
  const { locale, t } = await getT();
  const officialKo = creatures.filter((creature) => creature.confidence === "confirmed").length;
  const summary = locale === "en" ? meta.summary_en : meta.summary_ko;

  return (
    <div>
      <Hero
        image="/art/hero-idyll.jpg"
        kicker={t.home.kicker}
        title={
          <>
            {locale === "en" ? "Aniimo" : "애니모"}
            <span className="mt-2 block font-sans text-lg font-medium text-white/85 sm:text-2xl">
              Aniimo · 에이델 / Idyll
            </span>
          </>
        }
        subtitle={summary}
      >
        <LinkButton href="/creatures" variant="primary">
          {t.home.ctaDex}
        </LinkButton>
        <LinkButton href="/world" variant="ghost">
          {t.home.ctaWorld}
        </LinkButton>
      </Hero>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="wiki-card p-5">
          <p className="text-sm text-[var(--muted)]">{t.home.dev}</p>
          <p className="mt-1 font-medium">
            {meta.developer.name} <ConfidenceChip value="confirmed" compact />
          </p>
        </div>
        <div className="wiki-card p-5">
          <p className="text-sm text-[var(--muted)]">{t.home.pcConsole}</p>
          <p className="mt-1 font-medium">
            {meta.release_dates.pc_console.date} <ConfidenceChip value="confirmed" compact />
          </p>
        </div>
        <div className="wiki-card p-5">
          <p className="text-sm text-[var(--muted)]">{t.home.mobile}</p>
          <p className="mt-1 font-medium">
            {meta.release_dates.mobile.date} <ConfidenceChip value="confirmed" compact />
          </p>
        </div>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        {t.home.shortcuts.map((item) => (
          <LinkCard key={item.href} href={item.href} className="p-6">
            <div className="flex items-start gap-4">
              <span
                aria-hidden
                className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--moss-soft)] text-2xl"
              >
                {item.emoji}
              </span>
              <div>
                <h2 className="font-display text-2xl">{item.title}</h2>
                <p className="mt-1.5 text-sm leading-6 text-[var(--ink-soft)]">{item.body}</p>
              </div>
            </div>
          </LinkCard>
        ))}
      </section>

      <section className="mt-12 grid items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label={t.home.statDex} value={creatures.length} hint={t.home.statDexHint(officialKo)} />
          <Stat label={t.home.statRegions} value={regions.length} hint={t.home.statRegionsHint} />
          <Stat label={t.home.statCoords} value={0} accent="var(--sky)" hint={t.home.statCoordsHint} />
        </div>
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] shadow-[var(--shadow-card)]">
          <Image
            src="/art/creatures-party.jpg"
            alt={t.home.creatureAlt}
            width={1152}
            height={864}
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      <section className="mt-12">
        <SectionHeading kicker="Confidence" title={t.home.confidenceTitle} />
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {(Object.keys(CONFIDENCE_LABEL) as Confidence[]).map((key) => (
            <li key={key} className="wiki-card flex items-start gap-3 p-4">
              <ConfidenceChip value={key} />
              <p className="text-sm leading-6 text-[var(--ink-soft)]">{CONFIDENCE_LABEL[key].hint}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 wiki-card p-6">
        <SectionHeading kicker="Naming" title={t.home.namingTitle} />
        <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
          영어 마케팅의 <strong>Idyll</strong>과 한국어의 <strong>에이델 대륙</strong>은 같은 장소입니다. 포획 도구는{" "}
          <strong>애니팟 / Aniipod</strong>, 합체는 <strong>트와인 / Twine</strong>, 도감은{" "}
          <strong>연구 수첩 / Aniilog</strong>입니다.
        </p>
        <p className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <a className="link-moss" href={meta.official_urls.homepage_ko}>
            {t.common.officialHome}: aniimo.com/ko
          </a>
          <a className="link-moss" href={meta.official_urls.official_index_wiki}>
            {t.common.officialIndex}: wiki.aniimo.com
          </a>
          <EditLink file="data/research/meta.json" />
        </p>
      </section>
    </div>
  );
}
