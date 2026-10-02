// Classify free-text (systems.md, notes, user questions) into the graph's
// top-level categories using Jev (cheap, structured). Falls back to a
// deterministic keyword match when TypeSafe is not configured, so the
// pipeline works offline and in local dev without any API cost.

import { CATEGORY_TAXONOMY } from "@/lib/knowledge/ontology";
import { isTypeSafeConfigured, systemOne } from "@/lib/knowledge/typesafe";

const CATEGORY_CRITERIA: Record<string, string> = Object.fromEntries(
  CATEGORY_TAXONOMY.map((c) => [c.id, c.description.en]),
);

// Fallback keyword hints per category (KO + EN). Keys follow the owner's
// taxonomy (2026-09-30): game.<x> + meta.
const KEYWORDS: Record<string, string[]> = {
  "game.region": ["region", "idyll", "biome", "map", "지역", "에이델", "대륙", "바이오메", "지도"],
  "game.creature": ["aniimo", "creature", "evolution", "stats", "dex", "종족치", "도감", "진화", "형태"],
  "game.quest": ["quest", "mission", "퀘스트", "미션"],
  "game.event": ["event", "season", "collab", "이벤트", "시즌", "콜라보", "사전예약"],
  "game.story": ["story", "lore", "boss", "스토리", "설정", "보스", "플롯"],
  "game.party": ["party", "team", "comp", "build", "lineup", "squad", "파티", "조합", "덱", "팀"],
  "game.element": ["element", "fire", "water", "lightning", "속성", "상성", "번개", "바람"],
  "game.item": ["item", "material", "pod", "astranite", "credit", "아이템", "재료", "아스트라나이트", "크레딧", "애니팟"],
  "game.weapon": ["weapon", "무기"],
  "game.egg": ["egg", "hatch", "breed", "알", "부화", "교배"],
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
