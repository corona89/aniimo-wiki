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
addNode({ id: "game:aniimo", type: "Game", category: "game.identity", name: { ko: meta.official_names.ko, en: meta.official_names.en }, confidence: meta.official_names.confidence ?? "confirmed", props: { developer: meta.developer?.name ?? null, pc_console: meta.release_dates?.pc_console?.date ?? null, mobile: meta.release_dates?.mobile?.date ?? null, genres: meta.genre_tags ?? [] } });
addNode({ id: "continent:idyll", type: "Continent", category: "world.continent", name: { ko: regionsPack.world.name_ko, en: regionsPack.world.name_en }, confidence: regionsPack.world.confidence ?? "confirmed", props: { notes: regionsPack.world.notes ?? null } });

// --- Element nodes ---
for (const [en, ko] of Object.entries(ELEMENTS)) {
  addNode({ id: `element:${en}`, type: "Element", category: "creature.element", name: { ko, en }, confidence: "confirmed", props: {} });
}

// --- Region nodes ---
const regionNames = (r) => [r.name_ko, r.name_en, ...(r.name_ko_alt ?? []), ...(r.name_en_alt ?? [])].filter(Boolean);
for (const r of regionsPack.regions) {
  addNode({ id: `region:${r.id}`, type: "Region", category: "world.region", name: { ko: r.name_ko, en: r.name_en }, confidence: r.confidence ?? "unknown", sources: (r.source_urls ?? []).map((u) => sourceIdByUrl.get(u)).filter(Boolean), props: { biome_notes: r.biome_notes ?? null, weather_notes: r.weather_notes ?? null, level_band: r.level_band ?? null, status: r.status ?? null } });
  addEdge(`region:${r.id}`, "PART_OF", "continent:idyll");
}

// --- Creature nodes + edges ---
for (const c of creaturesPack.creatures) {
  const id = `creature:${c.slug}`;
  addNode({ id, type: "Creature", category: "creature.species", name: { ko: c.name_ko, en: c.name_en }, confidence: c.confidence ?? "unknown", sources: sourcesFor(c.source), props: { aniilog_no: c.aniilog_no ?? null, element: c.element ?? null, role_ko: c.role_ko ?? null, rarity: c.rarity ?? null, forms_known: c.forms_known ?? null, stats: c.official_stats_species ?? c.stats ?? null, notes: c.notes ?? null } });
  if (c.element && ELEMENTS[c.element]) addEdge(id, "HAS_ELEMENT", `element:${c.element}`);
  for (const sid of sourcesFor(c.source)) addEdge(id, "CITES", sid);
  // Habitat: match creature to regions by explicit hints or name mentions.
  const text = `${(c.habitat_region_hints ?? []).join(" ")} ${c.notes ?? ""} ${c.form_notes ?? ""}`.toLowerCase();
  for (const r of regionsPack.regions) {
    if (regionNames(r).some((n) => n.length > 2 && text.includes(n.toLowerCase()))) addEdge(id, "FOUND_IN", `region:${r.id}`);
  }
}

// --- Item nodes (from official capture coeffs + growth items) ---
for (const it of sim.inventory_items_affecting_growth ?? []) {
  addNode({ id: `item:${it.id}`, type: "Item", category: "item.material", name: { ko: it.name_ko ?? it.name_en, en: it.name_en }, confidence: it.confidence ?? "unknown", sources: sourcesFor(it.source), props: { effect: it.effect ?? null } });
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
