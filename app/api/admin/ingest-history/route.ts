// Admin-only ingest history listing.
//
// GET /api/admin/ingest-history[?limit=200]
//
// Joins data/research/community.json (stored posts — the source of truth)
// with the content-hash registry (data/research/ingested-hashes.json) by id,
// most recent first, exposing each document's sha-256 hash and source link.
// Entries ingested before the hash index existed surface contentHash: null.

import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { readHashRegistry } from "@/lib/ingest/hashes";
import { readCommunityPosts } from "@/lib/ingest/store";
import type { IngestHistoryItem } from "@/lib/ingest/types";

export async function GET(request: Request) {
  const { isAdmin } = await getAdmin();
  if (!isAdmin) return NextResponse.json({ error: "unauthorized" }, { status: 403 });

  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get("limit"));
  const limit =
    Number.isFinite(limitParam) && limitParam > 0 ? Math.min(Math.floor(limitParam), 1000) : 200;

  const [posts, registry] = await Promise.all([readCommunityPosts(), readHashRegistry()]);

  const hashById = new Map<string, string>();
  for (const [hash, record] of Object.entries(registry)) hashById.set(record.id, hash);

  const items: IngestHistoryItem[] = posts
    .map((post) => ({
      id: post.id,
      source: post.source,
      nativeId: post.nativeId,
      url: post.url,
      title: post.title,
      postedAt: post.postedAt,
      ingestedAt: post.ingestedAt,
      contentHash: hashById.get(post.id) ?? null,
    }))
    .sort((a, b) =>
      a.ingestedAt === b.ingestedAt ? (a.id < b.id ? -1 : 1) : a.ingestedAt < b.ingestedAt ? 1 : -1,
    )
    .slice(0, limit);

  return NextResponse.json({ items, total: posts.length });
}
