// Classify free-text (systems.md, notes, user questions) into the graph's
// top-level categories using Jev (cheap, structured). Falls back to a
// deterministic keyword match when TypeSafe is not configured, so the
// pipeline works offline and in local dev without any API cost.

import { CATEGORY_TAXONOMY } from "@/lib/knowledge/ontology";
import { isTypeSafeConfigured, systemOne } from "@/lib/knowledge/typesafe";

const CATEGORY_CRITERIA: Record<string, string> = Object.fromEntries(
  CATEGORY_TAXONOMY.map((c) => [c.id, c.description.en]),
);

// Fallback keyword hints per top-level category (KO + EN).
const KEYWORDS: Record<string, string[]> = {
  game: ["release", "platform", "publisher", "developer", "출시", "플랫폼", "퍼블리셔", "등급"],
  world: ["region", "idyll", "biome", "continent", "지역", "에이델", "대륙", "바이오메"],
  creature: ["aniimo", "element", "evolution", "stats", "종족치", "속성", "진화", "도감", "형태"],
  system: ["twine", "capture", "combat", "aniipod", "트와인", "포획", "전투", "애니팟", "홈랜드"],
  training: ["potential", "sparkling", "resonance", "breeding", "잠재력", "스파클", "공명", "교배", "부화"],
  item: ["astranite", "material", "pod", "재료", "아스트라나이트", "정수"],
  quest: ["quest", "event", "reward", "퀘스트", "이벤트", "보상"],
  map: ["map", "marker", "spawn", "지도", "마커", "스폰", "좌표"],
  meta: ["source", "naming", "version", "출처", "표기", "버전"],
};

export type CategoryResult = {
  category: string;
  confidence: number;
  via: "jev" | "fallback";
};

export async function classifyCategory(text: string): Promise<CategoryResult> {
  if (isTypeSafeConfigured()) {
    const res = await systemOne(text, {
      category: {
        type: "choice",
        instructions: "Which Aniimo wiki category does this text primarily belong to?",
        criteria: CATEGORY_CRITERIA,
      },
    });
    const answer = res.answers.category;
    if (answer && answer.type === "choice") {
      return { category: answer.choice, confidence: answer.confidence, via: "jev" };
    }
  }

  const lower = text.toLowerCase();
  let best = "meta";
  let bestScore = 0;
  for (const [category, words] of Object.entries(KEYWORDS)) {
    const score = words.reduce((n, w) => (lower.includes(w.toLowerCase()) ? n + 1 : n), 0);
    if (score > bestScore) {
      bestScore = score;
      best = category;
    }
  }
  return { category: best, confidence: bestScore > 0 ? 0.5 : 0.2, via: "fallback" };
}
