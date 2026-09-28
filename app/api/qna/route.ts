import { NextResponse } from "next/server";
import { isLlmConfigured, generate } from "@/lib/knowledge/llm";
import { isTypeSafeConfigured } from "@/lib/knowledge/typesafe";
import { buildContext, buildFallbackAnswer, retrieve } from "@/lib/knowledge/retrieve";
import type { Locale } from "@/lib/i18n-dict";

const SYSTEM_PROMPT = [
  "You are the assistant for an unofficial, Korean-first Aniimo fan wiki.",
  "Answer ONLY using the provided FACTS (a knowledge graph excerpt).",
  "Never invent coordinates, stats, names, or mechanics.",
  "If the facts do not contain the answer, say it is unknown (Korean: 미확인).",
  "Surface confidence when relevant and stay concise.",
  "Answer in the user's locale (ko or en).",
].join(" ");

export async function POST(request: Request) {
  let body: { question?: string; locale?: Locale };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const question = (body.question ?? "").trim();
  const locale: Locale = body.locale === "en" ? "en" : "ko";
  if (!question) return NextResponse.json({ error: "empty_question" }, { status: 400 });

  const r = await retrieve(question);
  const context = buildContext(r, locale);

  let answer: string;
  let mode: "llm" | "grounded-fallback";

  if (isLlmConfigured() && r.nodes.length > 0) {
    try {
      answer = await generate(
        SYSTEM_PROMPT,
        `Locale: ${locale}\n\nFACTS:\n${context}\n\nQUESTION: ${question}`,
      );
      mode = "llm";
    } catch {
      answer = buildFallbackAnswer(r, locale);
      mode = "grounded-fallback";
    }
  } else {
    answer = buildFallbackAnswer(r, locale);
    mode = "grounded-fallback";
  }

  return NextResponse.json({
    answer,
    mode,
    category: r.category,
    routing: r.categoryVia,
    classifier: isTypeSafeConfigured() ? "jev" : "fallback",
    generator: isLlmConfigured() ? "glm-5.3" : "none",
    sources: r.sources,
    facts: r.nodes.map((n) => ({ id: n.id, type: n.type, confidence: n.confidence, name: n.name })),
  });
}
