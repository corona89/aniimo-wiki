// Knowledge-graph ontology for the Aniimo QnA agent ("llm_wiki").
//
// The graph is built by ingesting the repo's structured data (data/research/*)
// into typed nodes + edges. Every node/edge carries provenance (confidence +
// sources) so the QnA agent can ground answers, cite them, and honestly say
// "unknown" instead of inventing — matching this wiki's no-invent policy.

export type Locale = "ko" | "en";

/** Cross-cutting trust tag carried by every node and edge. */
export type Confidence = "confirmed" | "marketing" | "community" | "unknown";

export type LocalizedText = { ko: string; en: string };

/** A branch of the category taxonomy the graph is organized under. */
export type Category = {
  id: string;
  label: LocalizedText;
  description: LocalizedText;
  /** Repo data files that feed this category during ingestion. */
  sources: string[];
  /** Node types that live under this category. */
  nodeTypes: NodeType[];
  children?: Category[];
};

/** Entity (node) kinds in the graph. */
export type NodeType =
  | "Game"
  | "Continent"
  | "Region"
  | "Biome"
  | "Weather"
  | "Creature"
  | "Form"
  | "Element"
  | "Role"
  | "Stage"
  | "StatBlock"
  | "System"
  | "Mechanic"
  | "Item"
  | "TrainingAction"
  | "EggType"
  | "MarkerType"
  | "Quest"
  | "Event"
  | "Reward"
  | "NamingPair"
  | "VersionNote"
  | "Source";

/** Relationship (edge) kinds, with the node types they connect. */
export type EdgeType = {
  type: string;
  from: NodeType;
  to: NodeType;
  label: LocalizedText;
};

// ---------------------------------------------------------------------------
// 1. Category taxonomy (the structure the graph is organized under)
// ---------------------------------------------------------------------------

export const CATEGORY_TAXONOMY: Category[] = [
  {
    id: "game",
    label: { ko: "게임 개요", en: "Game" },
    description: { ko: "게임 정체성·플랫폼·출시·등급·공식 링크", en: "Identity, platforms, release, ratings, official links" },
    sources: ["data/research/meta.json"],
    nodeTypes: ["Game"],
    children: [
      { id: "game.identity", label: { ko: "정체성", en: "Identity" }, description: { ko: "이름/개발/퍼블리셔/장르", en: "Name / developer / publisher / genre" }, sources: ["data/research/meta.json"], nodeTypes: ["Game"] },
      { id: "game.platforms", label: { ko: "플랫폼", en: "Platforms" }, description: { ko: "PC·콘솔·모바일", en: "PC, console, mobile" }, sources: ["data/research/meta.json"], nodeTypes: ["Game"] },
      { id: "game.release", label: { ko: "출시", en: "Release" }, description: { ko: "출시일/서버 시간대", en: "Release dates / server windows" }, sources: ["data/research/meta.json"], nodeTypes: ["Game", "VersionNote"] },
      { id: "game.ratings", label: { ko: "심의 등급", en: "Ratings" }, description: { ko: "ESRB/GRAC 등", en: "ESRB / GRAC, etc." }, sources: ["data/research/meta.json"], nodeTypes: ["Game"] },
    ],
  },
  {
    id: "world",
    label: { ko: "월드 · 지역", en: "World & Regions" },
    description: { ko: "에이델(Idyll) 대륙, 지역/서식지, 바이오메, 날씨", en: "Idyll continent, regions/habitats, biomes, weather" },
    sources: ["data/research/regions.json", "data/research/world.md"],
    nodeTypes: ["Continent", "Region", "Biome", "Weather"],
    children: [
      { id: "world.continent", label: { ko: "대륙", en: "Continent" }, description: { ko: "에이델 = Idyll", en: "Idyll = 에이델" }, sources: ["data/research/regions.json"], nodeTypes: ["Continent"] },
      { id: "world.region", label: { ko: "지역/서식지", en: "Region / habitat" }, description: { ko: "지역 목록·레벨밴드·상태", en: "Regions, level bands, status" }, sources: ["data/research/regions.json"], nodeTypes: ["Region"] },
      { id: "world.biome", label: { ko: "바이오메", en: "Biome" }, description: { ko: "지형/식생 유형", en: "Terrain / vegetation types" }, sources: ["data/research/regions.json", "data/research/world.md"], nodeTypes: ["Biome"] },
      { id: "world.weather", label: { ko: "날씨 · 천휘", en: "Weather · Prismana" }, description: { ko: "비/천둥/눈/천휘 흐름", en: "Rain / thunder / snow / Prismana Flow" }, sources: ["data/research/systems.md"], nodeTypes: ["Weather"] },
    ],
  },
  {
    id: "creature",
    label: { ko: "애니모 (도감)", en: "Aniimo (Dex)" },
    description: { ko: "종·형태·속성·역할·단계·종족치·진화", en: "Species, forms, element, role, stage, stats, evolution" },
    sources: ["data/research/creatures.json"],
    nodeTypes: ["Creature", "Form", "Element", "Role", "Stage", "StatBlock"],
    children: [
      { id: "creature.species", label: { ko: "종", en: "Species" }, description: { ko: "도감 번호·이름(KO/EN)", en: "Dex number, KO/EN names" }, sources: ["data/research/creatures.json"], nodeTypes: ["Creature"] },
      { id: "creature.form", label: { ko: "형태", en: "Form" }, description: { ko: "지역/날씨/천휘/스파클/알파 형태", en: "Regional/weather/Prismana/Sparkling/Alpha forms" }, sources: ["data/research/creatures.json"], nodeTypes: ["Form"] },
      { id: "creature.element", label: { ko: "속성", en: "Element" }, description: { ko: "9속성 + 상성(미확인)", en: "9 elements + effectiveness (unknown)" }, sources: ["data/research/creatures.json", "lib/labels.ts"], nodeTypes: ["Element"] },
      { id: "creature.role", label: { ko: "역할", en: "Role" }, description: { ko: "격파/딜/서포트/힐/재생", en: "Break/DPS/Support/Heal/Regen" }, sources: ["data/research/creatures.json"], nodeTypes: ["Role"] },
      { id: "creature.stage", label: { ko: "진화 단계", en: "Stage" }, description: { ko: "Lumin/Gamma/Nova (커뮤니티)", en: "Lumin/Gamma/Nova (community)" }, sources: ["data/research/creatures.json"], nodeTypes: ["Stage"] },
      { id: "creature.stats", label: { ko: "종족치", en: "Base stats" }, description: { ko: "공식 인덱스 확인 종만", en: "Only species confirmed on the official index" }, sources: ["data/research/creatures.json"], nodeTypes: ["StatBlock"] },
    ],
  },
  {
    id: "system",
    label: { ko: "시스템", en: "Systems" },
    description: { ko: "트와인·포획·전투·진화·홈랜드·멀티", en: "Twine, capture, combat, evolution, Homeland, multiplayer" },
    sources: ["data/research/systems.md"],
    nodeTypes: ["System", "Mechanic"],
    children: [
      { id: "system.twine", label: { ko: "트와인", en: "Twine" }, description: { ko: "합체/변신 메커닉", en: "Twining / become-the-creature mechanic" }, sources: ["data/research/systems.md"], nodeTypes: ["Mechanic"] },
      { id: "system.capture", label: { ko: "포획", en: "Capture" }, description: { ko: "애니팟·공식 계수", en: "Aniipods, official coefficients" }, sources: ["data/research/systems.md", "data/research/training-sim-schema.json"], nodeTypes: ["Mechanic", "Item"] },
      { id: "system.combat", label: { ko: "전투", en: "Combat" }, description: { ko: "역할·속성 상성(미확인 수치)", en: "Roles, element matchups (values unknown)" }, sources: ["data/research/systems.md"], nodeTypes: ["Mechanic"] },
      { id: "system.evolution", label: { ko: "진화", en: "Evolution" }, description: { ko: "단계·분기·지역/날씨 진화", en: "Stages, branches, regional/weather evolution" }, sources: ["data/research/systems.md"], nodeTypes: ["Mechanic"] },
      { id: "system.homeland", label: { ko: "홈랜드/캠핑카", en: "Homeland/RV" }, description: { ko: "하우징·부화기", en: "Housing, Hatchinator" }, sources: ["data/research/systems.md"], nodeTypes: ["Mechanic"] },
      { id: "system.multiplayer", label: { ko: "멀티플레이", en: "Multiplayer" }, description: { ko: "협동/PvP/Egg Heist/크로스플레이", en: "Co-op / PvP / Egg Heist / cross-play" }, sources: ["data/research/systems.md"], nodeTypes: ["Mechanic"] },
    ],
  },
  {
    id: "training",
    label: { ko: "육성 · 시뮬레이션", en: "Training & Simulation" },
    description: { ko: "잠재력·스파클·공명·교배·알·지맥", en: "Potential, sparkling, resonance, breeding, eggs, leyline" },
    sources: ["data/research/training-sim.md", "data/research/training-sim-schema.json"],
    nodeTypes: ["TrainingAction", "EggType", "Item"],
    children: [
      { id: "training.potential", label: { ko: "잠재력", en: "Potential" }, description: { ko: "등급(밴드 수치 미공개)", en: "Grades (band values unpublished)" }, sources: ["data/research/training-sim-schema.json"], nodeTypes: ["TrainingAction"] },
      { id: "training.sparkling", label: { ko: "스파클", en: "Sparkling" }, description: { ko: "스타일·공식 확률", en: "Styles, official odds" }, sources: ["data/research/training-sim-schema.json"], nodeTypes: ["TrainingAction", "Item"] },
      { id: "training.resonance", label: { ko: "공명", en: "Resonance" }, description: { ko: "아스트라나이트(비용 미공개)", en: "Astranite (costs unpublished)" }, sources: ["data/research/training-sim-schema.json"], nodeTypes: ["TrainingAction", "Item"] },
      { id: "training.breeding", label: { ko: "교배", en: "Breeding" }, description: { ko: "100% 유전 규칙", en: "100% inheritance rules" }, sources: ["data/research/training-sim-schema.json"], nodeTypes: ["TrainingAction"] },
      { id: "training.egg", label: { ko: "알 · 부화", en: "Eggs · Hatching" }, description: { ko: "알 종류·Hatchinator", en: "Egg types, Hatchinator" }, sources: ["data/research/training-sim-schema.json"], nodeTypes: ["EggType", "TrainingAction"] },
      { id: "training.nurture", label: { ko: "지맥 · 천휘 육성", en: "Leyline · Prismana" }, description: { ko: "공식 육성 확률", en: "Official nurture odds" }, sources: ["data/research/training-sim-schema.json"], nodeTypes: ["TrainingAction"] },
    ],
  },
  {
    id: "item",
    label: { ko: "아이템", en: "Items" },
    description: { ko: "포획구·재료·도구·알", en: "Capture pods, materials, tools, eggs" },
    sources: ["data/research/training-sim-schema.json"],
    nodeTypes: ["Item", "EggType"],
    children: [
      { id: "item.aniipod", label: { ko: "애니팟(포획구)", en: "Aniipods" }, description: { ko: "등급별 포획 계수", en: "Capture coefficients by tier" }, sources: ["data/research/training-sim-schema.json"], nodeTypes: ["Item"] },
      { id: "item.material", label: { ko: "재료", en: "Materials" }, description: { ko: "아스트라나이트·지맥 정수·진화 재료", en: "Astranite, leyline essence, evolution materials" }, sources: ["data/research/training-sim-schema.json"], nodeTypes: ["Item"] },
      { id: "item.sparklingTool", label: { ko: "스파클 도구", en: "Sparkling tools" }, description: { ko: "인장·광채·큐브", en: "Sigil, radiance, cube" }, sources: ["data/research/training-sim-schema.json"], nodeTypes: ["Item"] },
    ],
  },
  {
    id: "quest",
    label: { ko: "퀘스트 · 이벤트", en: "Quests & Events" },
    description: { ko: "메인/월드 퀘스트, 한정 이벤트, 보상", en: "Main/world quests, limited-time events, rewards" },
    sources: ["data/research/wiki-outline.md", "data/research/meta.json", "data/research/systems.md"],
    nodeTypes: ["Quest", "Event", "Reward"],
    children: [
      { id: "quest.main", label: { ko: "메인 스토리", en: "Main story" }, description: { ko: "메인 스토리 퀘스트 라인(스포일러)", en: "Main story quest line (spoilers)" }, sources: ["data/research/wiki-outline.md"], nodeTypes: ["Quest"] },
      { id: "quest.world", label: { ko: "월드 · 돌발 퀘스트", en: "World / side quests" }, description: { ko: "월드 활동·돌발 이벤트", en: "World activities, dynamic events" }, sources: ["data/research/wiki-outline.md"], nodeTypes: ["Quest"] },
      { id: "quest.event", label: { ko: "한정 이벤트", en: "Limited-time events" }, description: { ko: "기간제 이벤트·시즌·콜라보(시작/종료일), 사전예약 등", en: "Time-limited events, seasons, collabs (start/end), pre-registration" }, sources: ["data/research/meta.json", "data/research/systems.md"], nodeTypes: ["Event"] },
      { id: "quest.reward", label: { ko: "보상", en: "Rewards" }, description: { ko: "퀘스트·이벤트 보상(아이템/애니모/알)", en: "Quest/event rewards (items/Aniimo/eggs)" }, sources: ["data/research/meta.json"], nodeTypes: ["Reward"] },
    ],
  },
  {
    id: "map",
    label: { ko: "지도", en: "Maps" },
    description: { ko: "마커 유형·지역 참조(개인 좌표는 그래프에 넣지 않음)", en: "Marker types, region refs (personal coords stay out of the graph)" },
    sources: ["data/research/map-schema.json", "data/maps/empty-collection.json"],
    nodeTypes: ["MarkerType", "Region"],
    children: [
      { id: "map.markerType", label: { ko: "마커 유형", en: "Marker types" }, description: { ko: "스폰/상자/보스/이동 등 enum", en: "Spawn/chest/boss/travel enum" }, sources: ["data/research/map-schema.json"], nodeTypes: ["MarkerType"] },
    ],
  },
  {
    id: "meta",
    label: { ko: "메타 · 운영", en: "Meta & Provenance" },
    description: { ko: "표기(로컬라이제이션)·출처·신뢰도·버전", en: "Naming/localization, sources, confidence, versions" },
    sources: ["data/research/meta.json", "data/research/sources.json", "data/research/creatures.json"],
    nodeTypes: ["NamingPair", "Source", "VersionNote"],
    children: [
      { id: "meta.naming", label: { ko: "표기 · 로컬라이제이션", en: "Naming · localization" }, description: { ko: "KO/EN 쌍·모호성(에이델=Idyll 등)", en: "KO/EN pairs, ambiguities (Idyll = 에이델, etc.)" }, sources: ["data/research/meta.json", "data/research/creatures.json"], nodeTypes: ["NamingPair"] },
      { id: "meta.source", label: { ko: "출처", en: "Sources" }, description: { ko: "인용 URL·접속일·유형", en: "Citation URLs, accessed date, type" }, sources: ["data/research/sources.json"], nodeTypes: ["Source"] },
      { id: "meta.version", label: { ko: "버전 기록", en: "Version notes" }, description: { ko: "패치·데이터 리비전", en: "Patches, data revisions" }, sources: ["data/research/meta.json"], nodeTypes: ["VersionNote"] },
    ],
  },
];

// ---------------------------------------------------------------------------
// 2. Relationships (edges)
// ---------------------------------------------------------------------------

export const EDGE_TYPES: EdgeType[] = [
  { type: "HAS_ELEMENT", from: "Creature", to: "Element", label: { ko: "속성", en: "has element" } },
  { type: "HAS_ROLE", from: "Creature", to: "Role", label: { ko: "역할", en: "has role" } },
  { type: "AT_STAGE", from: "Creature", to: "Stage", label: { ko: "진화 단계", en: "at stage" } },
  { type: "HAS_STATS", from: "Creature", to: "StatBlock", label: { ko: "종족치", en: "has stats" } },
  { type: "HAS_FORM", from: "Creature", to: "Form", label: { ko: "형태", en: "has form" } },
  { type: "EVOLVES_TO", from: "Creature", to: "Creature", label: { ko: "진화", en: "evolves to" } },
  { type: "FOUND_IN", from: "Creature", to: "Region", label: { ko: "서식지", en: "found in" } },
  { type: "PART_OF", from: "Region", to: "Continent", label: { ko: "소속 대륙", en: "part of" } },
  { type: "HAS_BIOME", from: "Region", to: "Biome", label: { ko: "바이오메", en: "has biome" } },
  { type: "HAS_WEATHER", from: "Region", to: "Weather", label: { ko: "날씨", en: "has weather" } },
  { type: "USES_ITEM", from: "System", to: "Item", label: { ko: "사용 아이템", en: "uses item" } },
  { type: "AFFECTS", from: "System", to: "Creature", label: { ko: "영향", en: "affects" } },
  { type: "CONSUMES", from: "TrainingAction", to: "Item", label: { ko: "소비", en: "consumes" } },
  { type: "STRONG_AGAINST", from: "Element", to: "Element", label: { ko: "상성 우위(미확인)", en: "strong against (unknown)" } },
  { type: "REWARDS", from: "Quest", to: "Reward", label: { ko: "보상", en: "rewards" } },
  { type: "EVENT_REWARDS", from: "Event", to: "Reward", label: { ko: "이벤트 보상", en: "event rewards" } },
  { type: "TAKES_PLACE_IN", from: "Quest", to: "Region", label: { ko: "진행 지역", en: "takes place in" } },
  { type: "FEATURES", from: "Event", to: "Creature", label: { ko: "등장 애니모", en: "features" } },
  { type: "GRANTS_ITEM", from: "Reward", to: "Item", label: { ko: "지급 아이템", en: "grants item" } },
  { type: "GRANTS_CREATURE", from: "Reward", to: "Creature", label: { ko: "지급 애니모", en: "grants creature" } },
  // Provenance edges — attachable from ANY node.
  { type: "CITES", from: "Creature", to: "Source", label: { ko: "출처", en: "cites" } },
  { type: "HAS_NAMING", from: "Creature", to: "NamingPair", label: { ko: "표기", en: "has naming" } },
];

// ---------------------------------------------------------------------------
// 3. Cross-cutting properties present on EVERY node and edge
// ---------------------------------------------------------------------------

export const CROSS_CUTTING_PROPERTIES = {
  /** confirmed | marketing | community | unknown — drives honest answers. */
  confidence: "Confidence",
  /** Source node ids backing the fact (for citations). */
  sources: "Source[]",
  /** Bilingual display names. */
  names: "{ ko?: string; en?: string }",
  /** Data-pack date / last verification. */
  lastVerified: "ISO date string",
} as const;

/**
 * Answering policy for the QnA agent:
 * - Only answer from graph facts; never invent coordinates, stats, or names.
 * - Always surface the fact's `confidence` and cite `sources`.
 * - If confidence is "unknown" or no node/edge matches, answer "미확인 / unknown"
 *   and point to the official source link instead of guessing.
 */
export const ANSWER_POLICY = {
  groundedOnly: true,
  requireCitations: true,
  unknownFallback: true,
} as const;
