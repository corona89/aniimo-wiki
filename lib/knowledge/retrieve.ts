// Graph retrieval for the QnA agent.
//
// data/knowledge/graph.json is GENERATED (scripts/build-graph.mjs) and can be
// refreshed at runtime by the admin community ingest, so it is read from disk
// with an mtime cache instead of a static import that would freeze the graph
// at build time. If the file is missing/unreadable we degrade to an empty graph
// (answers honestly report "미확인") rather than crashing the route.

import fs from "node:fs";
import path from "node:path";
import { classifyCategory } from "@/lib/knowledge/classify";
import type { Locale } from "@/lib/i18n-dict";

type GraphNode = {
  id: string;
  type: string;
  category: string;
  name: { ko?: string | null; en?: string | null };
  confidence: string;
  sources: string[];
  lastVerified?: string;
  props: Record<string, unknown>;
};
type GraphEdge = { from: string; type: string; to: string };
type Graph = { nodes: GraphNode[]; edges: GraphEdge[] };

const GRAPH_PATH = path.join(process.cwd(), "data", "knowledge", "graph.json");

/** Serializable graph shape for the /graph viewer page. */
export type GraphSnapshotNode = GraphNode;
export type GraphSnapshotEdge = GraphEdge;
export type GraphSnapshot = { nodes: GraphSnapshotNode[]; edges: GraphSnapshotEdge[] };

/** Current graph (mtime-cached, same freshness rules as /api/qna retrieval). */
export function graphSnapshot(): GraphSnapshot {
  const { graph } = currentGraph();
  return { nodes: graph.nodes, edges: graph.edges };
}

let graphCache: { mtimeMs: number; graph: Graph; byId: Map<string, GraphNode> } | null = null;

function currentGraph(): { graph: Graph; byId: Map<string, GraphNode> } {
  try {
    const { mtimeMs } = fs.statSync(GRAPH_PATH);
    if (!graphCache || graphCache.mtimeMs !== mtimeMs) {
      const graph = JSON.parse(fs.readFileSync(GRAPH_PATH, "utf8")) as Graph;
      graphCache = { mtimeMs, graph, byId: new Map(graph.nodes.map((n) => [n.id, n])) };
    }
  } catch {
    if (!graphCache) {
      graphCache = { mtimeMs: 0, graph: { nodes: [], edges: [] }, byId: new Map() };
    }
  }
  return graphCache;
}

export type RetrievedSource = { title: string; url: string; type: string; accessed: string };
export type Retrieval = {
  category: string;
  categoryVia: "jev" | "fallback";
  nodes: GraphNode[];
  sources: RetrievedSource[];
};

function nodeName(n: GraphNode, locale: Locale): string {
  return (locale === "en" ? n.name.en : n.name.ko) ?? n.name.en ?? n.name.ko ?? n.id;
}

// --- Korean-aware question tokenizer ---------------------------------------
// Single-syllable Hangul words are meaningful (빛, 불, 물, 알, 풀 …) so the
// old `length > 1` filter silently dropped them. Trailing question particles
// (애니모는? → 애니모) are stripped so inflected questions still match.
const HANGUL = /[가-힣]/;
const SINGLE_CHAR_PARTICLES = new Set(["는", "은", "이", "가", "을", "를", "의", "에", "도", "로", "와", "과", "만", "요", "랑", "께", "처럼", "부터", "까지"]);
const MULTI_CHAR_PARTICLES = ["에서", "에게", "한테", "부터", "까지", "처럼", "마다", "보다"];

function tokenize(question: string): string[] {
  const out = new Set<string>();
  for (let tok of question.split(/[\s,.!?;:·…]+/)) {
    if (!tok) continue;
    for (const particle of MULTI_CHAR_PARTICLES) {
      if (tok.length > particle.length + 1 && tok.endsWith(particle)) {
        tok = tok.slice(0, -particle.length);
        break;
      }
    }
    const last = tok.slice(-1);
    if (tok.length > 2 && SINGLE_CHAR_PARTICLES.has(last)) tok = tok.slice(0, -1);
    if (!tok) continue;
    // Keep 1-char Hangul tokens; Latin/digits still need length > 1.
    if (HANGUL.test(tok) ? tok.length >= 1 : tok.length > 1) out.add(tok.toLowerCase());
  }
  return [...out];
}

// Structural hub nodes whose one-hop neighbors should ride along in retrieval:
// asking about an element/region/item really asks about its inhabitants.
const EXPANDING_TYPES = new Set(["Element", "Region", "Item", "EggType", "Continent"]);
const MAX_NEIGHBORS_PER_HUB = 8;

export async function retrieve(question: string, limit = 8): Promise<Retrieval> {
  const { category, via } = await classifyCategory(question);
  const { graph, byId } = currentGraph();
  // Taxonomy is 2-level (game.<x> + meta) — boost on the first two segments so
  // "game.party" does not boost every game node.
  const topCat = category.split(".").slice(0, 2).join(".");
  const terms = tokenize(question);

  const scored = graph.nodes
    .filter((n) => n.type !== "Source")
    .map((n) => {
      const hay = `${n.name.ko ?? ""} ${n.name.en ?? ""} ${JSON.stringify(n.props)}`.toLowerCase();
      let score = 0;
      for (const term of terms) if (hay.includes(term)) score += 2;
      // Boost only on a 2-segment category (game.party) — a bare top-level
      // "game"/"meta" would +1 every node and drown the real matches.
      if (topCat.includes(".") && n.category.startsWith(topCat)) score += 1;
      return { n, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  // One-hop expansion: a matched Element/Region/Item hub pulls in the nodes it
  // actually connects to (e.g. element:Light → its Light creatures), so the
  // generator can answer "빛 속성 애니모는?" with the real species list.
  // Neighbors already in the base scoring are UPGRADED, not skipped.
  const neighborsOf = new Map<string, GraphNode[]>();
  for (const e of graph.edges) {
    const from = byId.get(e.from);
    const to = byId.get(e.to);
    if (!from || !to) continue;
    if (!neighborsOf.has(e.from)) neighborsOf.set(e.from, []);
    if (!neighborsOf.has(e.to)) neighborsOf.set(e.to, []);
    neighborsOf.get(e.from)!.push(to);
    neighborsOf.get(e.to)!.push(from);
  }
  const best = new Map(scored.map((x) => [x.n.id, { n: x.n, score: x.score }]));
  for (const { n, score } of scored) {
    if (!EXPANDING_TYPES.has(n.type)) continue;
    for (const neighbor of (neighborsOf.get(n.id) ?? []).slice(0, MAX_NEIGHBORS_PER_HUB)) {
      if (neighbor.type === "Source") continue;
      const upgraded = score + 0.5;
      const prev = best.get(neighbor.id);
      if (!prev || prev.score < upgraded) best.set(neighbor.id, { n: neighbor, score: upgraded });
    }
  }

  const top = [...best.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit + MAX_NEIGHBORS_PER_HUB)
    .map((x) => x.n);

  // Collect cited sources from the retrieved nodes.
  const sourceIds = new Set<string>();
  for (const n of top) for (const s of n.sources) sourceIds.add(s);
  const sources: RetrievedSource[] = [...sourceIds]
    .map((id) => byId.get(id))
    .filter((s): s is GraphNode => Boolean(s))
    .map((s) => ({
      title: (s.name.en ?? s.name.ko ?? s.id) as string,
      url: String(s.props.url ?? ""),
      type: String(s.props.type ?? ""),
      accessed: String(s.props.accessed ?? ""),
    }));

  return { category, categoryVia: via, nodes: top, sources };
}

/** Compact, provenance-tagged context string for the generation model. */
export function buildContext(r: Retrieval, locale: Locale): string {
  return r.nodes
    .map((n) => {
      const props = Object.entries(n.props)
        .filter(([, v]) => v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0))
        .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
        .join(", ");
      return `- [${n.type} · confidence:${n.confidence}] ${nodeName(n, locale)} { ${props} }`;
    })
    .join("\n");
}

/** No-LLM fallback: assemble a grounded answer from the top facts. */
export function buildFallbackAnswer(r: Retrieval, locale: Locale): string {
  if (r.nodes.length === 0) {
    return locale === "en"
      ? "Unknown — no matching facts were found in the wiki graph."
      : "미확인 — 위키 그래프에서 관련 정보를 찾지 못했습니다.";
  }
  const lead = locale === "en" ? "Based on the wiki graph:" : "위키 그래프 기준으로:";
  const lines = r.nodes.slice(0, 5).map((n) => {
    const name = nodeName(n, locale);
    const conf = n.confidence;
    const bits: string[] = [];
    for (const key of ["element", "role_ko", "aniilog_no", "rarity", "level_band", "status", "biome_notes", "excerpt"]) {
      const v = n.props[key];
      if (v) bits.push(`${key}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`);
    }
    return `• ${name} (${n.type}, ${conf})${bits.length ? " — " + bits.join(", ") : ""}`;
  });
  return `${lead}\n${lines.join("\n")}`;
}
