// Jev (TypeSafe System One) curation for the admin community ingest.
//
// Each fetched post is evaluated with two structured questions:
//   1. useful     — does the post carry factual, wiki-worthy Aniimo information?
//   2. category   — which ontology category does it primarily belong to?
//
// Jev is a cheap classifier (no text generation), matching the wiki's
// no-invent policy: a post passing curation is still stored with confidence
// "community" — it is a claim from a forum, not a verified fact.

import { CATEGORY_TAXONOMY } from "@/lib/knowledge/ontology";
import { systemOne } from "@/lib/knowledge/typesafe";
import type { FetchedPost } from "@/lib/ingest/types";

const USEFUL_CRITERIA: Record<string, string> = {
  useful:
    "Contains specific, factual, actionable information about the Aniimo game: mechanics, capture/evolution/training details, spawn or habitat reports, event/patch facts, item data, or official news relays. Guides, discoveries, data mining and concrete bug reports count.",
  not_useful:
    "Memes or screenshots with no information, hype or rants without facts, guild/friend recruitment, face-code only threads, off-topic chatter, politics, drama, or anything unrelated to the Aniimo game.",
};

const CATEGORY_CRITERIA: Record<string, string> = Object.fromEntries(
  CATEGORY_TAXONOMY.map((c) => [c.id, c.description.en]),
);

export type Curation = {
  post: FetchedPost;
  useful: boolean;
  category: string;
  confidence: number;
};

/** Curate posts with bounded concurrency. Per-post failures don't abort the batch. */
export async function curatePosts(
  posts: FetchedPost[],
  concurrency = 5,
): Promise<{ curated: Curation[]; errors: string[] }> {
  const curated: Curation[] = [];
  const errors: string[] = [];

  for (let i = 0; i < posts.length; i += concurrency) {
    const batch = posts.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (post): Promise<Curation | null> => {
        try {
          const state = `[source: ${post.source} · ${post.postedAt}]\n${post.title}\n\n${post.body.slice(0, 1_500)}`;
          const res = await systemOne(state, {
            useful: {
              type: "choice",
              instructions:
                "Is this community forum post useful factual information about the Aniimo game for a fan-wiki knowledge graph?",
              criteria: USEFUL_CRITERIA,
            },
            category: {
              type: "choice",
              instructions: "Which Aniimo wiki category does this post primarily belong to?",
              criteria: CATEGORY_CRITERIA,
            },
          });

          const usefulAnswer = res.answers.useful;
          const categoryAnswer = res.answers.category;
          return {
            post,
            useful: usefulAnswer?.type === "choice" ? usefulAnswer.choice === "useful" : false,
            category:
              categoryAnswer?.type === "choice" && categoryAnswer.choice in CATEGORY_CRITERIA
                ? categoryAnswer.choice
                : "meta",
            confidence: usefulAnswer?.type === "choice" ? usefulAnswer.confidence : 0,
          } satisfies Curation;
        } catch (err) {
          errors.push(`${post.source}:${post.nativeId} — ${err instanceof Error ? err.message : String(err)}`);
          return null;
        }
      }),
    );
    for (const result of results) if (result) curated.push(result);
  }

  return { curated, errors };
}
