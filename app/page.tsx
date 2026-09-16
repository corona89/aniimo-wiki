import Image from "next/image";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { Hero, LinkButton, LinkCard, SectionHeading, Stat } from "@/components/ui";
import { CONFIDENCE_LABEL } from "@/lib/labels";
import { creatures, meta, regions } from "@/lib/research";
import type { Confidence } from "@/lib/types";

const shortcuts = [
  { href: "/world", title: "월드 / 지역", body: "에이델 = Idyll. 지역 표는 출처·신뢰도와 함께.", emoji: "🗺️" },
  { href: "/creatures", title: "애니모 도감", body: "커뮤니티 격자 + 공식 KO명이 확인된 종만 한글 표기.", emoji: "📖" },
  { href: "/training", title: "육성 시뮬", body: "스키마 UI 셸. 미공개 종족치·성장량은 비워 둡니다.", emoji: "🧪" },
  { href: "/maps", title: "지도", body: "좌표를 만들지 않습니다. 커뮤니티 맵 링크와 빈 레이어만.", emoji: "📍" },
];

export default function HomePage() {
  const officialKo = creatures.filter((creature) => creature.confidence === "confirmed").length;

  return (
    <div>
      <Hero
        image="/art/hero-idyll.jpg"
        kicker="Korean-first fan wiki"
        title={
          <>
            애니모
            <span className="mt-2 block font-sans text-lg font-medium text-white/85 sm:text-2xl">
              Aniimo · 에이델 / Idyll
            </span>
          </>
        }
        subtitle={meta.summary_ko}
      >
        <LinkButton href="/creatures" variant="primary">
          도감 둘러보기
        </LinkButton>
        <LinkButton href="/world" variant="ghost">
          월드 / 지역
        </LinkButton>
      </Hero>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="wiki-card p-5">
          <p className="text-sm text-[var(--muted)]">개발</p>
          <p className="mt-1 font-medium">
            {meta.developer.name} <ConfidenceChip value="confirmed" compact />
          </p>
        </div>
        <div className="wiki-card p-5">
          <p className="text-sm text-[var(--muted)]">PC·콘솔</p>
          <p className="mt-1 font-medium">
            {meta.release_dates.pc_console.date} <ConfidenceChip value="confirmed" compact />
          </p>
        </div>
        <div className="wiki-card p-5">
          <p className="text-sm text-[var(--muted)]">모바일</p>
          <p className="mt-1 font-medium">
            {meta.release_dates.mobile.date} <ConfidenceChip value="confirmed" compact />
          </p>
        </div>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        {shortcuts.map((item) => (
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
          <Stat
            label="도감 행"
            value={creatures.length}
            hint={`공식 KO 확인 ${officialKo}종 · 나머지는 커뮤니티 격자`}
          />
          <Stat
            label="지역/서식지 행"
            value={regions.length}
            hint="15+α는 커뮤니티 집계 · 공식 완전체 목록 없음"
          />
          <Stat label="지도 좌표" value={0} accent="var(--sky)" hint="검증된 좌표가 없어 FeatureCollection을 비워 둠" />
        </div>
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] shadow-[var(--shadow-card)]">
          <Image
            src="/art/creatures-party.jpg"
            alt="여러 속성의 애니모 일러스트 (팬 제작)"
            width={1152}
            height={864}
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      <section className="mt-12">
        <SectionHeading kicker="Confidence" title="신뢰도 배지" />
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
        <SectionHeading kicker="Naming" title="표기 안내" />
        <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
          영어 마케팅의 <strong>Idyll</strong>과 한국어의 <strong>에이델 대륙</strong>은 같은 장소입니다. 포획 도구는{" "}
          <strong>애니팟 / Aniipod</strong>, 합체는 <strong>트와인 / Twine</strong>, 도감은{" "}
          <strong>연구 수첩 / Aniilog</strong>입니다. Kakao Games 퍼블리싱은 이 팩에서 확인되지 않았습니다.
        </p>
        <p className="mt-4 text-sm">
          공식 홈:{" "}
          <a className="link-moss" href={meta.official_urls.homepage_ko}>
            aniimo.com/ko
          </a>
          {" · "}
          공식 인덱스:{" "}
          <a className="link-moss" href={meta.official_urls.official_index_wiki}>
            wiki.aniimo.com
          </a>
        </p>
      </section>
    </div>
  );
}
