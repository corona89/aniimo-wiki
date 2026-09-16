import { ConfidenceChip } from "@/components/ConfidenceChip";
import { NamePair } from "@/components/NamePair";
import { PageHeader } from "@/components/PageHeader";
import { mapCollection, regionDisplayName, regions } from "@/lib/research";

export const metadata = {
  title: "지도",
};

const MARKER_TYPES = [
  "spawn_aniimo",
  "spawn_weather",
  "spawn_time",
  "chest",
  "gathering",
  "boss",
  "egg",
  "teleporter",
  "sanctum",
  "puzzle",
  "rv_park",
  "landmark",
  "ecological_observation",
  "branch",
];

const EXTERNAL_MAPS = [
  {
    name: "Aniimo Tools Interactive Map",
    url: "https://aniimotools.dev/map/",
    status: "커뮤니티, 업데이트 중. 인게임 좌표 핀을 주장.",
    confidence: "community" as const,
  },
  {
    name: "Fextralife Interactive Map",
    url: "https://aniimo.wiki.fextralife.com/Interactive_Map",
    status: "계획 페이지만. 액세스 당시 마커 없음 / 500.",
    confidence: "community" as const,
  },
  {
    name: "Game8",
    url: null,
    status: "2026-09-16 검색에서 맵을 찾지 못함.",
    confidence: "unknown" as const,
  },
];

export default function MapsPage() {
  return (
    <div>
      <PageHeader
        kicker="Maps"
        title="지도"
        description="이 위키는 좌표를 만들지 않습니다. 아래 캔버스는 빈 GeoJSON이며, POI는 지역 단위 이름만 나열합니다."
      />

      <section className="wiki-card relative min-h-[280px] overflow-hidden p-6">
        <div className="absolute inset-0 opacity-40">
          <div className="h-full w-full bg-[radial-gradient(circle_at_30%_40%,#9cc3a8_0%,transparent_42%),radial-gradient(circle_at_70%_60%,#8eb6c4_0%,transparent_45%)]" />
        </div>
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold)]">FeatureCollection</p>
          <h2 className="mt-2 font-serif text-3xl">레이어 비어 있음</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--ink-soft)]">
            features: {mapCollection.features.length} · coordinate_system.kind:{" "}
            {mapCollection.meta.coordinate_system.kind} · {mapCollection.meta.policy}
          </p>
          <p className="mt-4 font-mono text-xs text-[var(--muted)]">geometry = null until verified</p>
        </div>
      </section>

      <section className="mt-8 wiki-card p-6">
        <h2 className="font-serif text-2xl">외부 맵</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {EXTERNAL_MAPS.map((item) => (
            <li key={item.name} className="flex flex-col gap-1 border-b border-[var(--line)] pb-3">
              <div className="flex flex-wrap items-center gap-2">
                {item.url ? (
                  <a className="font-medium text-[var(--moss)] underline underline-offset-4" href={item.url}>
                    {item.name}
                  </a>
                ) : (
                  <span className="font-medium">{item.name}</span>
                )}
                <ConfidenceChip value={item.confidence} compact />
              </div>
              <p className="text-[var(--ink-soft)]">{item.status}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 wiki-card p-6">
        <h2 className="font-serif text-2xl">마커 범례 (후보 enum)</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          커뮤니티 맵에서 관찰된 유형입니다. 이 저장소에는 해당 유형의 핀이 없습니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {MARKER_TYPES.map((type) => (
            <span key={type} className="chip chip-unknown font-mono">
              {type}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-2xl">좌표 없는 POI (지역 단위)</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          region_id만 있고 lat/lng/x/y는 없습니다. 고래첨벙 해안과 갈매기 만은 EN 맵 이름을 붙이지 않습니다.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {regions.map((region) => (
            <li key={region.id} className="wiki-card p-4">
              <NamePair ko={regionDisplayName(region, "ko")} en={region.name_en} size="sm" />
              <p className="mt-2 font-mono text-[11px] text-[var(--muted)]">
                region_id={region.id} · geometry=null
              </p>
              <div className="mt-2">
                <ConfidenceChip value={region.confidence} compact />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
