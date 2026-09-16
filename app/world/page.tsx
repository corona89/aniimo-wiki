import { ConfidenceChip } from "@/components/ConfidenceChip";
import { NamePair } from "@/components/NamePair";
import { PageHeader } from "@/components/PageHeader";
import { regionCountNotes, regions, worldInfo } from "@/lib/research";

export const metadata = {
  title: "월드 / 지역",
};

export default function WorldPage() {
  return (
    <div>
      <PageHeader
        image="/art/world-vista.jpg"
        crumbs={[{ label: "홈", href: "/" }, { label: "월드 / 지역" }]}
        kicker="World / Regions"
        title="에이델 대륙"
        description="영어 Idyll과 한국어 에이델은 같은 대륙입니다. 지역 개수·영한 매핑은 커뮤니티와 공식 인덱스가 어긋난 곳이 있어, 표에 상태와 신뢰도를 그대로 둡니다."
      />

      <section className="wiki-card p-6">
        <h2 className="font-display text-2xl">세계 이름</h2>
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
              <dt className="text-[var(--muted)]">Fextralife 지역 수</dt>
              <dd>{regionCountNotes.fextralife_stated} · community</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Aniimo Tools</dt>
              <dd>{regionCountNotes.aniimotools_stated}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Aniidex 서식지</dt>
              <dd>{regionCountNotes.aniimoguide_habitats}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mt-8 wiki-card p-6">
        <h2 className="font-display text-2xl">표기 모호성</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-[var(--ink-soft)]">
          <li>
            Breezy Plains는 인터랙티브 맵의 시작 지점으로 나오지만 Fextralife 15 목록에는 없습니다. 관계{" "}
            <ConfidenceChip value="unknown" compact />
          </li>
          <li>Crescent Bay는 서식지/지역 경계가 불명확합니다. 공식 EN 인덱스는 Bubbeep 서식지로 등장.</li>
          <li>
            공식 KO 서식지 <strong>고래첨벙 해안</strong>, <strong>갈매기 만</strong>의 EN 맵 이름은 모름 — 추정해
            Tideblossom/Crescent에 붙이지 않습니다.
          </li>
          <li>Island of Peace는 CBT 지역이며 런치 상시 여부 미확인.</li>
          <li>아스트라 / Astra는 하늘 도시 허브로, 야생 필드 지역과 구분합니다.</li>
        </ul>
      </section>

      <section className="mt-8 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
              <th className="border-b border-[var(--line)] px-3 py-3">이름</th>
              <th className="border-b border-[var(--line)] px-3 py-3">바이오메</th>
              <th className="border-b border-[var(--line)] px-3 py-3">레벨</th>
              <th className="border-b border-[var(--line)] px-3 py-3">상태</th>
              <th className="border-b border-[var(--line)] px-3 py-3">신뢰도</th>
            </tr>
          </thead>
          <tbody>
            {regions.map((region) => (
              <tr key={region.id} className="align-top">
                <td className="border-b border-[var(--line)] px-3 py-3">
                  <NamePair ko={region.name_ko} en={region.name_en} size="sm" />
                  <p className="mt-1 font-mono text-[11px] text-[var(--muted)]">{region.id}</p>
                </td>
                <td className="border-b border-[var(--line)] px-3 py-3 text-[var(--ink-soft)]">
                  {region.biome_notes ?? "—"}
                  {region.weather_notes ? (
                    <p className="mt-1 text-xs text-[var(--muted)]">{region.weather_notes}</p>
                  ) : null}
                </td>
                <td className="border-b border-[var(--line)] px-3 py-3 whitespace-nowrap">
                  {region.level_band ?? "—"}
                </td>
                <td className="border-b border-[var(--line)] px-3 py-3 font-mono text-xs">{region.status ?? "—"}</td>
                <td className="border-b border-[var(--line)] px-3 py-3">
                  <ConfidenceChip value={region.confidence} compact />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
