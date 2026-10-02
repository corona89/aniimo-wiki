#!/usr/bin/env node
// Ingest the repo's verified data into a knowledge graph (nodes + edges) for the
// QnA agent, following lib/knowledge/ontology.ts. Every node/edge carries
// provenance (confidence + sources). Output: data/knowledge/graph.json
//
// The output is a Labeled Property Graph but is trivially convertible to RDF
// triples (each edge = subject-predicate-object) or EAV (each node prop = row).
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));

const creaturesPack = read("data/research/creatures.json");
const regionsPack = read("data/research/regions.json");
const meta = read("data/research/meta.json");
const sources = read("data/research/sources.json");
const sim = read("data/research/training-sim-schema.json");

const ELEMENTS = {
  Fire: "불", Water: "물", Grass: "풀", Lightning: "번개", Earth: "땅",
  Wind: "바람", Dark: "암흑", Ice: "얼음", Light: "빛",
};
const PACK_DATE = meta.accessed ?? "2026-09-16";

const nodes = [];
const edges = [];
const nodeIds = new Set();
const addNode = (n) => {
  if (nodeIds.has(n.id)) return;
  nodeIds.add(n.id);
  nodes.push({ confidence: "unknown", sources: [], lastVerified: PACK_DATE, ...n });
};
const addEdge = (from, type, to, extra = {}) => {
  if (!nodeIds.has(from) || !nodeIds.has(to)) return;
  edges.push({ from, type, to, ...extra });
};

// --- Source nodes (provenance targets) ---
const sourceIdByUrl = new Map();
sources.forEach((s, i) => {
  const id = `source:${i}`;
  sourceIdByUrl.set(s.url, id);
  addNode({ id, type: "Source", category: "meta.source", name: { ko: s.title, en: s.title }, confidence: "confirmed", props: { url: s.url, type: s.type, accessed: s.accessed, notes: s.notes ?? null } });
});
const sourcesFor = (sourceField) => {
  if (!sourceField) return [];
  const urls = String(sourceField).split(";").map((u) => u.trim());
  const ids = [];
  for (const [url, id] of sourceIdByUrl) if (urls.some((u) => u.includes(url) || url.includes(u))) ids.push(id);
  return ids;
};

// --- Game + Continent ---
// Root "game" category anchors the owner taxonomy (2026-09-30); the continent
// links to it so the game node is never dangling.
addNode({ id: "game:aniimo", type: "Game", category: "game", name: { ko: meta.official_names.ko, en: meta.official_names.en }, confidence: meta.official_names.confidence ?? "confirmed", props: { developer: meta.developer?.name ?? null, pc_console: meta.release_dates?.pc_console?.date ?? null, mobile: meta.release_dates?.mobile?.date ?? null, genres: meta.genre_tags ?? [] } });
addNode({ id: "continent:idyll", type: "Continent", category: "game.region", name: { ko: regionsPack.world.name_ko, en: regionsPack.world.name_en }, confidence: regionsPack.world.confidence ?? "confirmed", props: { notes: regionsPack.world.notes ?? null } });
addEdge("continent:idyll", "PART_OF", "game:aniimo");

// --- Element nodes ---
for (const [en, ko] of Object.entries(ELEMENTS)) {
  addNode({ id: `element:${en}`, type: "Element", category: "game.element", name: { ko, en }, confidence: "confirmed", props: {} });
}

// --- Region nodes ---
const regionNames = (r) => [r.name_ko, r.name_en, ...(r.name_ko_alt ?? []), ...(r.name_en_alt ?? [])].filter(Boolean);
for (const r of regionsPack.regions) {
  addNode({ id: `region:${r.id}`, type: "Region", category: "game.region", name: { ko: r.name_ko, en: r.name_en }, confidence: r.confidence ?? "unknown", sources: (r.source_urls ?? []).map((u) => sourceIdByUrl.get(u)).filter(Boolean), props: { biome_notes: r.biome_notes ?? null, weather_notes: r.weather_notes ?? null, level_band: r.level_band ?? null, status: r.status ?? null } });
  addEdge(`region:${r.id}`, "PART_OF", "continent:idyll");
}

// --- Creature nodes + edges ---
// Depth-3 categories are auto-generated from the element attribute.
for (const c of creaturesPack.creatures) {
  const id = `creature:${c.slug}`;
  const category = c.element && ELEMENTS[c.element] ? `game.creature.${c.element.toLowerCase()}` : "game.creature";
  addNode({ id, type: "Creature", category, name: { ko: c.name_ko, en: c.name_en }, confidence: c.confidence ?? "unknown", sources: sourcesFor(c.source), props: { aniilog_no: c.aniilog_no ?? null, element: c.element ?? null, role_ko: c.role_ko ?? null, rarity: c.rarity ?? null, forms_known: c.forms_known ?? null, stats: c.official_stats_species ?? c.stats ?? null, skills: (c.skills ?? []).map((s) => s.name), notes: c.official_desc_ko ?? c.notes ?? null } });
  if (c.element && ELEMENTS[c.element]) addEdge(id, "HAS_ELEMENT", `element:${c.element}`);
  for (const sid of sourcesFor(c.source)) addEdge(id, "CITES", sid);
  // Habitat: match creature to regions by explicit hints or name mentions.
  const text = `${(c.habitat_region_hints ?? []).join(" ")} ${c.notes ?? ""} ${c.form_notes ?? ""}`.toLowerCase();
  for (const r of regionsPack.regions) {
    if (regionNames(r).some((n) => n.length > 2 && text.includes(n.toLowerCase()))) addEdge(id, "FOUND_IN", `region:${r.id}`);
  }
}

// --- Item nodes (from official capture coeffs + growth items) ---
// Auto depth-3: eggs split into game.egg.*, capture pods into game.item.pod,
// everything else stays a material/tool under game.item.
for (const it of sim.inventory_items_affecting_growth ?? []) {
  const label = `${it.name_ko ?? ""} ${it.name_en ?? ""} ${it.id}`;
  const isEgg = /알|egg/i.test(label);
  const isPod = /애니팟|pod/i.test(label);
  if (isEgg) {
    const id = `egg:${it.id}`;
    addNode({ id, type: "EggType", category: "game.egg", name: { ko: it.name_ko ?? it.name_en, en: it.name_en }, confidence: it.confidence ?? "unknown", sources: sourcesFor(it.source), props: { effect: it.effect ?? null } });
    for (const sid of sourcesFor(it.source)) addEdge(id, "CITES", sid);
    // Items carry no per-item source URLs — link structurally to the game so
    // they never dangle (asserts membership, not any unverified value).
    addEdge("game:aniimo", "USES_ITEM", id);
  } else {
    const id = `item:${it.id}`;
    const category = isPod ? "game.item.pod" : "game.item.material";
    addNode({ id, type: "Item", category, name: { ko: it.name_ko ?? it.name_en, en: it.name_en }, confidence: it.confidence ?? "unknown", sources: sourcesFor(it.source), props: { effect: it.effect ?? null } });
    for (const sid of sourcesFor(it.source)) addEdge(id, "CITES", sid);
    addEdge("game:aniimo", "USES_ITEM", id);
  }
}

// --- Community posts (admin-injected from DC Inside / Reddit, see /admin) ---
// These are forum claims, NOT verified facts: nodes always carry confidence
// "community" and cite the original post URL as their source.
//
// Taxonomy migration (2026-09-30): stored posts carry legacy category ids from
// the old ontology. Keyword signals in the title+excerpt win; otherwise the
// legacy id maps into the new game.<x> tree. Posts then get MENTIONS edges to
// every entity they name, so no post node dangles unconnected.
const LEGACY_CATEGORY_MAP = {
  world: "game.region", "world.continent": "game.region", "world.region": "game.region",
  "world.biome": "game.region", "world.weather": "game.region", map: "game.region", "map.markerType": "game.region",
  creature: "game.creature", "creature.species": "game.creature", "creature.form": "game.creature",
  "creature.element": "game.element", "creature.role": "game.party", "creature.stage": "game.creature", "creature.stats": "game.creature",
  system: "game.story", training: "game.egg",
  item: "game.item", "item.aniipod": "game.item", "item.material": "game.item", "item.sparklingTool": "game.item",
  quest: "game.quest", "quest.main": "game.story", "quest.world": "game.quest", "quest.event": "game.event", "quest.reward": "game.item",
  community: "game.story", game: "game", meta: "meta",
};

// Korean particles make bare "알"/"팀" substring matches too greedy — require
// a delimiter or common particle around single-syllable keywords.
const CASCADE = [
  ["game.party", /파티|조합|덱|\b팀\b|party|team|comp\b|build|lineup|squad/i],
  ["game.egg", /알[이을은는][\s.,!?]|^알|\b알\b|부화|교배|egg|hatch|breed/i],
  ["game.quest", /퀘스트|quest|미션|mission/i],
  ["game.event", /이벤트|시즌|콜라보|사전예약|event|season|collab/i],
  ["game.weapon", /무기|weapon/i],
  ["game.element", /속성|상성|번개|element|lightning|fire|water|grass|earth|wind|dark|ice|holy/i],
  ["game.item", /아이템|재료|아스트라나이트|크레딧|애니팟|포획|item|material|astranite|credit|pod/i],
  ["game.story", /스토리|설정|보스|엔딩|story|lore|boss/i],
  ["game.region", /에이델|지역|바이오메|지도|idyll|region|biome|map/i],
];

function migratePostCategory(post) {
  const text = `${post.title ?? ""}\n${post.excerpt ?? ""}`;
  for (const [category, re] of CASCADE) if (re.test(text)) return category;
  return LEGACY_CATEGORY_MAP[post.category] ?? "game.story";
}

// Entity name index for MENTIONS matching (KO substring + EN word-boundary).
const mentionTargets = [];
for (const c of creaturesPack.creatures) {
  mentionTargets.push({ id: `creature:${c.slug}`, ko: c.name_ko, en: c.name_en });
}
for (const r of regionsPack.regions) {
  mentionTargets.push({ id: `region:${r.id}`, ko: r.name_ko, en: r.name_en });
}
for (const it of sim.inventory_items_affecting_growth ?? []) {
  mentionTargets.push({ id: /알|egg/i.test(`${it.name_ko ?? ""}${it.name_en ?? ""}${it.id}`) ? `egg:${it.id}` : `item:${it.id}`, ko: it.name_ko, en: it.name_en });
}
const MAX_MENTIONS_PER_POST = 8;

function mentionsIn(text) {
  const lower = text.toLowerCase();
  const hits = [];
  for (const target of mentionTargets) {
    if (target.ko && target.ko.length >= 2 && lower.includes(target.ko.toLowerCase())) hits.push(target.id);
    else if (target.en && target.en.length >= 3) {
      const re = new RegExp(`\\b${target.en.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (re.test(text)) hits.push(target.id);
    }
    if (hits.length >= MAX_MENTIONS_PER_POST) break;
  }
  return hits;
}

let communityPosts = [];
try {
  communityPosts = read("data/research/community.json");
} catch {
  communityPosts = [];
}
let mentionEdges = 0;
for (const p of communityPosts) {
  const srcId = `community-source:${p.source}:${p.nativeId}`;
  addNode({
    id: srcId,
    type: "Source",
    category: "meta.source",
    name: { ko: `${p.source} 게시물 (${p.postedAt})`, en: `${p.source} post (${p.postedAt})` },
    confidence: "confirmed", // the page exists and was fetched; the CLAIM below is "community"
    props: { url: p.url, type: "community", accessed: p.ingestedAt, notes: `origin: ${p.source}` },
  });
  const migrated = migratePostCategory(p);
  addNode({
    id: p.id,
    type: "CommunityPost",
    category: migrated,
    name: { ko: p.title, en: p.title },
    confidence: "community",
    sources: [srcId],
    props: {
      excerpt: p.excerpt ?? null,
      posted_at: p.postedAt ?? null,
      source: p.source ?? null,
      author: p.author ?? null,
      category_hint: p.category ?? null,
      jev_confidence: typeof p.jevConfidence === "number" ? p.jevConfidence : null,
    },
  });
  addEdge(p.id, "CITES", srcId);
  // Link the post to every entity it names — keeps the graph connected.
  for (const targetId of mentionsIn(`${p.title ?? ""}\n${p.excerpt ?? ""}`)) {
    addEdge(p.id, "MENTIONS", targetId);
    mentionEdges++;
  }
}

const graph = {
  meta: { generatedFrom: "data/research/*", packDate: PACK_DATE, model: "labeled-property-graph", ontology: "lib/knowledge/ontology.ts" },
  nodes,
  edges,
};
fs.mkdirSync(path.join(ROOT, "data/knowledge"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "data/knowledge/graph.json"), JSON.stringify(graph, null, 2) + "\n");

const countBy = (arr, key) => arr.reduce((m, x) => ((m[x[key]] = (m[x[key]] || 0) + 1), m), {});
console.log("nodes:", nodes.length, countBy(nodes, "type"));
console.log("edges:", edges.length, countBy(edges, "type"));
console.log("post MENTIONS edges:", mentionEdges);
// Category distribution (depth-2) + dangling-node audit.
const catDist = {};
for (const n of nodes) {
  const cat = n.category.split(".").slice(0, 2).join(".");
  catDist[cat] = (catDist[cat] || 0) + 1;
}
console.log("categories:", catDist);
const degree = new Map();
for (const e of edges) {
  degree.set(e.from, (degree.get(e.from) ?? 0) + 1);
  degree.set(e.to, (degree.get(e.to) ?? 0) + 1);
}
const dangling = nodes.filter((n) => n.type !== "Source" && !degree.has(n.id));
console.log("dangling non-source nodes:", dangling.length, dangling.slice(0, 8).map((n) => `${n.type}:${n.id}`).join(", "));
