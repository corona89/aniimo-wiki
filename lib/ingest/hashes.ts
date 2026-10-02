// Content-hash registry for the admin community ingest.
//
// data/research/ingested-hashes.json keeps one SHA-256 per ingested document
// so re-running an overlapping date range skips posts that were already
// stored: no re-fetch of DC detail pages, no repeated Jev curation, no
// re-injection. community.json stays the source of truth for post content;
// this file is a derived index — deleting it only costs a re-curation pass
// that mergeAndRebuild would dedupe by id anyway.

import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { FetchedPost, PostSource } from "@/lib/ingest/types";

const HASHES_PATH = path.join(process.cwd(), "data", "research", "ingested-hashes.json");

/**
 * SHA-256 over the stable content identity of a fetched post (after DC detail
 * enrichment). Fields are joined with NUL so no field content can fake a
 * boundary. Hashing the fetched (full) content — not the truncated stored
 * excerpt — keeps the value reproducible across runs.
 */
export function hashPost(post: FetchedPost): string {
  const parts = [post.source, post.nativeId, post.url, post.title, post.body];
  return createHash("sha256").update(parts.join("\u0000")).digest("hex");
}

/** One ingested document, as recorded in the hash index. */
export type HashRecord = {
  /** Stable graph id: community:<source>:<nativeId> */
  id: string;
  source: PostSource;
  nativeId: string;
  url: string;
  title: string;
  /** YYYY-MM-DD */
  ingestedAt: string;
};

/** sha-256 hex → record. */
export type HashRegistry = Record<string, HashRecord>;

export async function readHashRegistry(): Promise<HashRegistry> {
  try {
    const raw = JSON.parse(await fs.readFile(HASHES_PATH, "utf8")) as HashRegistry;
    return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  } catch {
    return {};
  }
}

/** Merge records into the registry file (idempotent — keyed by hash). */
export async function appendHashRecords(added: HashRegistry): Promise<void> {
  if (Object.keys(added).length === 0) return;
  const merged = { ...(await readHashRegistry()), ...added };
  await fs.writeFile(HASHES_PATH, JSON.stringify(merged, null, 2) + "\n", "utf8");
}
