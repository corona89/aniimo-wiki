// Admin-only community data injection.
//
// POST /api/admin/ingest-community
//   { sources: ("dcinside" | "reddit")[], from: "YYYY-MM-DD", to: "YYYY-MM-DD" }
//
// Pipeline: build the dedup index (community.json ids + content-hash registry)
// → fetch posts in range, skipping already-ingested ones before they cost a
// detail request → Jev usefulness curation → persist useful posts to
// data/research/community.json (confidence "community") → record their content
// hashes in data/research/ingested-hashes.json → regenerate
// data/knowledge/graph.json via scripts/build-graph.mjs. The running server
// picks up the new graph on the next /api/qna request (mtime-cached load).

import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { curatePosts } from "@/lib/ingest/curate";
import { fetchDcinsidePosts } from "@/lib/ingest/dcinside";
import { appendHashRecords, hashPost, readHashRegistry, type HashRegistry } from "@/lib/ingest/hashes";
import { fetchRedditPosts } from "@/lib/ingest/reddit";
import { mergeAndRebuild, readCommunityPosts } from "@/lib/ingest/store";
import type { FetchedPost, PostSource, StoredCommunityPost } from "@/lib/ingest/types";
import { isTypeSafeConfigured } from "@/lib/knowledge/typesafe";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 366;

/** Union index of everything already ingested: stable ids + content hashes. */
type DedupIndex = {
  knownIds: Set<string>;
  knownHashes: Set<string>;
  skipNativeIds: Record<PostSource, Set<string>>;
};

async function buildDedupIndex(): Promise<DedupIndex> {
  const [registry, stored] = await Promise.all([readHashRegistry(), readCommunityPosts()]);
  const index: DedupIndex = {
    knownIds: new Set(stored.map((p) => p.id)),
    knownHashes: new Set(Object.keys(registry)),
    skipNativeIds: { dcinside: new Set(), reddit: new Set() },
  };
  for (const post of stored) index.skipNativeIds[post.source].add(post.nativeId);
  for (const record of Object.values(registry)) {
    // Hash-indexed entries also block by id even if community.json was edited.
    index.knownIds.add(record.id);
    index.skipNativeIds[record.source].add(record.nativeId);
  }
  return index;
}

export async function POST(request: Request) {
  const { isAdmin } = await getAdmin();
  if (!isAdmin) return NextResponse.json({ error: "unauthorized" }, { status: 403 });

  let body: { sources?: unknown; from?: unknown; to?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const sources = Array.isArray(body.sources)
    ? body.sources.filter((s): s is PostSource => s === "dcinside" || s === "reddit")
    : [];
  const from = typeof body.from === "string" ? body.from.trim() : "";
  const to = typeof body.to === "string" ? body.to.trim() : "";

  if (sources.length === 0 || !DATE_RE.test(from) || !DATE_RE.test(to) || from > to) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  if ((Date.parse(to) - Date.parse(from)) / 86_400_000 > MAX_RANGE_DAYS) {
    return NextResponse.json({ error: "range_too_wide" }, { status: 400 });
  }
  if (!isTypeSafeConfigured()) {
    // Jev curation is the data-quality gate; without it we refuse rather than
    // inject unfiltered forum noise into the graph.
    return NextResponse.json({ error: "jev_key_missing" }, { status: 503 });
  }

  const errors: string[] = [];
  const fetched: FetchedPost[] = [];
  const counts = { dcinside: 0, reddit: 0 };
  let skipped = 0;

  const index = await buildDedupIndex();

  if (sources.includes("dcinside")) {
    try {
      const { posts, notes, skipped: dcSkipped } = await fetchDcinsidePosts(from, to, {
        skipNativeIds: index.skipNativeIds.dcinside,
      });
      counts.dcinside = posts.length;
      skipped += dcSkipped;
      fetched.push(...posts);
      errors.push(...notes.map((note) => `dcinside: ${note}`));
    } catch (err) {
      errors.push(`dcinside: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  if (sources.includes("reddit")) {
    try {
      const { posts, notes, skipped: rdSkipped } = await fetchRedditPosts(from, to, {
        skipNativeIds: index.skipNativeIds.reddit,
      });
      counts.reddit = posts.length;
      skipped += rdSkipped;
      fetched.push(...posts);
      errors.push(...notes.map((note) => `reddit: ${note}`));
    } catch (err) {
      errors.push(`reddit: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Second hash/id gate after fetch: content that is already ingested never
  // reaches Jev curation, so re-runs only pay for genuinely new posts.
  const candidates: FetchedPost[] = [];
  for (const post of fetched) {
    if (index.knownHashes.has(hashPost(post))) {
      skipped++;
      continue;
    }
    if (index.knownIds.has(`community:${post.source}:${post.nativeId}`)) {
      skipped++;
      continue;
    }
    candidates.push(post);
  }

  const { curated, errors: curationErrors } = await curatePosts(candidates);
  errors.push(...curationErrors);

  const today = new Date().toISOString().slice(0, 10);
  const useful = curated.filter((c) => c.useful);
  const entries: StoredCommunityPost[] = useful.map((c) => ({
    id: `community:${c.post.source}:${c.post.nativeId}`,
    source: c.post.source,
    nativeId: c.post.nativeId,
    url: c.post.url,
    title: c.post.title.slice(0, 200),
    excerpt: c.post.body.slice(0, 500),
    postedAt: c.post.postedAt,
    author: c.post.author,
    category: c.category,
    jevConfidence: Math.round(c.confidence * 100) / 100,
    ingestedAt: today,
  }));

  let injected = 0;
  let duplicates = 0;
  let graphLog: string | undefined;
  if (entries.length > 0) {
    try {
      const result = await mergeAndRebuild(entries);
      injected = result.injected;
      duplicates = result.duplicates;
      graphLog = result.graphLog;

      // Record content hashes for everything that passed curation — injected
      // now, or already present under the same id (edited reposts included).
      const added: HashRegistry = {};
      for (const c of useful) {
        added[hashPost(c.post)] = {
          id: `community:${c.post.source}:${c.post.nativeId}`,
          source: c.post.source,
          nativeId: c.post.nativeId,
          url: c.post.url,
          title: c.post.title.slice(0, 80),
          ingestedAt: today,
        };
      }
      try {
        await appendHashRecords(added);
      } catch (err) {
        errors.push(`hash index: ${err instanceof Error ? err.message : String(err)}`);
      }
    } catch (err) {
      errors.push(`graph rebuild: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({
    from,
    to,
    fetched: counts,
    useful: entries.length,
    injected,
    duplicates,
    skipped,
    errors,
    graphLog,
  });
}
