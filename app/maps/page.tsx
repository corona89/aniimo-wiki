import { ConfidenceChip } from "@/components/ConfidenceChip";
import { AdminEditLink } from "@/components/AdminEditLink";
import { MapPlanner } from "@/components/MapPlanner";
import { NamePair } from "@/components/NamePair";
import { PageHeader } from "@/components/PageHeader";
import { getT } from "@/lib/i18n";
import { regionDisplayName, regions } from "@/lib/research";

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

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.maps.title };
}

export default async function MapsPage() {
  const { t } = await getT();

  return (
    <div>
      <PageHeader
        crumbs={[{ label: t.nav.home, href: "/" }, { label: t.maps.title }]}
        kicker="Maps"
        title={t.maps.title}
        description={t.maps.desc}
      />

      <div className="mb-8 flex justify-end">
        <AdminEditLink file="data/research/maps.md" />
      </div>

      <section className="mb-6">
        <h2 className="font-display text-2xl">{t.maps.plannerTitle}</h2>
        <p className="mt-2 mb-4 max-w-3xl text-sm leading-7 text-[var(--ink-soft)]">{t.maps.plannerNote}</p>
        <MapPlanner />
      </section>

      <section className="mb-10 wiki-card p-5 text-xs leading-6 text-[var(--ink-soft)]">
        <p className="font-display text-sm text-[var(--ink)]">{t.maps.licensesTitle}</p>
        <ul className="mt-2 space-y-1">
          <li>
            지도 데이터 ·{" "}
            <a className="link-moss" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
              © OpenStreetMap contributors
            </a>{" "}
            (ODbL)
          </li>
          <li>
            지형 타일 ·{" "}
            <a className="link-moss" href="https://opentopomap.org" target="_blank" rel="noopener noreferrer">
              © OpenTopoMap
            </a>{" "}
            (CC-BY-SA)
          </li>
          <li>
            지도 엔진 ·{" "}
            <a className="link-moss" href="https://leafletjs.com" target="_blank" rel="noopener noreferrer">
              Leaflet
            </a>{" "}
            (BSD-2-Clause)
          </li>
          <li>일러스트 · 팬 제작(비공식), 분위기 표현용</li>
        </ul>
      </section>

      <section className="mt-8 wiki-card p-6">
        <h2 className="font-display text-2xl">{t.maps.externalMaps}</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {EXTERNAL_MAPS.map((item) => (
            <li key={item.name} className="flex flex-col gap-1 border-b border-[var(--line)] pb-3">
              <div className="flex flex-wrap items-center gap-2">
                {item.url ? (
                  <a className="link-moss font-medium" href={item.url}>
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
        <h2 className="font-display text-2xl">{t.maps.legend}</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">{t.maps.legendNote}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {MARKER_TYPES.map((type) => (
            <span key={type} className="chip chip-unknown font-mono">
              {type}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl">{t.maps.poiTitle}</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">{t.maps.poiNote}</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {regions.map((region) => (
            <li key={region.id} id={region.id} className="wiki-card scroll-mt-24 p-4">
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
