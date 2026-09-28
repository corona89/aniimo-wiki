import graphData from "@/data/knowledge/graph.json";
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

const graph = graphData as unknown as Graph;
const byId = new Map(graph.nodes.map((n) => [n.id, n]));

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

export async function retrieve(question: string, limit = 8): Promise<Retrieval> {
  const { category, via } = await classifyCategory(question);
  const topCat = category.split(".")[0];
  const terms = question.toLowerCase().split(/\s+/).filter((t) => t.length > 1);

  const scored = graph.nodes
    .filter((n) => n.type !== "Source")
    .map((n) => {
      const hay = `${n.name.ko ?? ""} ${n.name.en ?? ""} ${JSON.stringify(n.props)}`.toLowerCase();
      let score = 0;
      for (const term of terms) if (hay.includes(term)) score += 2;
      if (n.category.startsWith(topCat)) score += 1;
      return { n, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.n);

  // Collect cited sources from the retrieved nodes.
  const sourceIds = new Set<string>();
  for (const n of scored) for (const s of n.sources) sourceIds.add(s);
  const sources: RetrievedSource[] = [...sourceIds]
    .map((id) => byId.get(id))
    .filter((s): s is GraphNode => Boolean(s))
    .map((s) => ({
      title: (s.name.en ?? s.name.ko ?? s.id) as string,
      url: String(s.props.url ?? ""),
      type: String(s.props.type ?? ""),
      accessed: String(s.props.accessed ?? ""),
    }));

  return { category, categoryVia: via, nodes: scored, sources };
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
    for (const key of ["element", "role_ko", "aniilog_no", "rarity", "level_band", "status", "biome_notes"]) {
      const v = n.props[key];
      if (v) bits.push(`${key}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`);
    }
    return `• ${name} (${n.type}, ${conf})${bits.length ? " — " + bits.join(", ") : ""}`;
  });
  return `${lead}\n${lines.join("\n")}`;
}
