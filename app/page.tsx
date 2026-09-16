import Link from "next/link";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { CONFIDENCE_LABEL } from "@/lib/labels";
import { creatures, meta, regions } from "@/lib/research";
import type { Confidence } from "@/lib/types";

const shortcuts = [
  { href: "/world", title: "월드 / 지역", body: "에이델 = Idyll. 지역 표는 출처·신뢰도와 함께." },
  { href: "/creatures", title: "애니모 도감", body: "커뮤니티 격자 + 공식 KO명이 확인된 종만 한글 표기." },
  { href: "/training", title: "육성 시뮬", body: "스키마 UI 셸. 미공개 종족치·성장량은 비워 둡니다." },
  { href: "/maps", title: "지도", body: "좌표를 만들지 않습니다. 커뮤니티 맵 링크와 빈 레이어만." },
];

export default function HomePage() {
  const officialKo = creatures.filter((creature) => creature.confidence === "confirmed").length;

  return (
    <div>
      <section className="wiki-card overflow-hidden p-8 sm:p-12">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--gold)]">Korean-first fan wiki</p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-6xl">
          애니모
          <span className="mt-2 block text-xl text-[var(--muted)] sm:text-2xl">Aniimo · 에이델 / Idyll</span>
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--ink-soft)]">{meta.summary_ko}</p>
        <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-[var(--muted)]">개발</dt>
            <dd className="mt-1 font-medium">
              {meta.developer.name} <ConfidenceChip value="confirmed" compact />
            </dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">PC·콘솔</dt>
            <dd className="mt-1 font-medium">
              {meta.release_dates.pc_console.date} <ConfidenceChip value="confirmed" compact />
            </dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">모바일</dt>
            <dd className="mt-1 font-medium">
              {meta.release_dates.mobile.date} <ConfidenceChip value="confirmed" compact />
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        {shortcuts.map((item) => (
          <Link key={item.href} href={item.href} className="wiki-card p-6 transition hover:-translate-y-0.5">
            <h2 className="font-serif text-2xl">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{item.body}</p>
          </Link>
        ))}
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="wiki-card p-5">
          <p className="text-sm text-[var(--muted)]">도감 행</p>
          <p className="mt-1 font-serif text-3xl">{creatures.length}</p>
          <p className="mt-2 text-xs text-[var(--muted)]">공식 KO 확인 {officialKo}종 · 나머지는 커뮤니티 격자</p>
        </div>
        <div className="wiki-card p-5">
          <p className="text-sm text-[var(--muted)]">지역/서식지 행</p>
          <p className="mt-1 font-serif text-3xl">{regions.length}</p>
          <p className="mt-2 text-xs text-[var(--muted)]">15+α는 커뮤니티 집계 · 공식 완전체 목록 없음</p>
        </div>
        <div className="wiki-card p-5">
          <p className="text-sm text-[var(--muted)]">지도 좌표</p>
          <p className="mt-1 font-serif text-3xl">0</p>
          <p className="mt-2 text-xs text-[var(--muted)]">검증된 좌표가 없어 FeatureCollection을 비워 둠</p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl">신뢰도 배지</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {(Object.keys(CONFIDENCE_LABEL) as Confidence[]).map((key) => (
            <li key={key} className="wiki-card flex items-start gap-3 p-4">
              <ConfidenceChip value={key} />
              <p className="text-sm leading-6 text-[var(--ink-soft)]">{CONFIDENCE_LABEL[key].hint}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 wiki-card p-6">
        <h2 className="font-serif text-2xl">표기 안내</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
          영어 마케팅의 <strong>Idyll</strong>과 한국어의 <strong>에이델 대륙</strong>은 같은 장소입니다. 포획 도구는{" "}
          <strong>애니팟 / Aniipod</strong>, 합체는 <strong>트와인 / Twine</strong>, 도감은{" "}
          <strong>연구 수첩 / Aniilog</strong>입니다. Kakao Games 퍼블리싱은 이 팩에서 확인되지 않았습니다.
        </p>
        <p className="mt-4 text-sm">
          공식 홈:{" "}
          <a className="text-[var(--moss)] underline underline-offset-4" href={meta.official_urls.homepage_ko}>
            aniimo.com/ko
          </a>
          {" · "}
          공식 인덱스:{" "}
          <a className="text-[var(--moss)] underline underline-offset-4" href={meta.official_urls.official_index_wiki}>
            wiki.aniimo.com
          </a>
        </p>
      </section>
    </div>
  );
}
