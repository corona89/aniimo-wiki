// Persistence for the admin community ingest.
//
// data/research/community.json is the source of truth for ingested posts;
// data/knowledge/graph.json stays GENERATED — after merging new entries we
// re-run scripts/build-graph.mjs so the graph is rebuilt through the same
// single pipeline used by `node scripts/build-graph.mjs` on the CLI.

import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import type { StoredCommunityPost } from "@/lib/ingest/types";

const execFileAsync = promisify(execFile);
const COMMUNITY_PATH = path.join(process.cwd(), "data", "research", "community.json");
const BUILD_SCRIPT = path.join(process.cwd(), "scripts", "build-graph.mjs");

export async function readCommunityPosts(): Promise<StoredCommunityPost[]> {
  try {
    const raw = JSON.parse(await fs.readFile(COMMUNITY_PATH, "utf8")) as StoredCommunityPost[];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

/** Merge entries (dedupe by id), persist, and regenerate the knowledge graph. */
export async function mergeAndRebuild(
  entries: StoredCommunityPost[],
): Promise<{ injected: number; duplicates: number; total: number; graphLog: string }> {
  const existing = await readCommunityPosts();
  const byId = new Map(existing.map((entry) => [entry.id, entry]));

  let duplicates = 0;
  for (const entry of entries) {
    if (byId.has(entry.id)) {
      duplicates++;
      continue;
    }
    byId.set(entry.id, entry);
  }

  const merged = [...byId.values()].sort((a, b) => (a.id < b.id ? -1 : 1));
  await fs.writeFile(COMMUNITY_PATH, JSON.stringify(merged, null, 2) + "\n", "utf8");

  // Regenerate graph.json through the canonical build script.
  const { stdout } = await execFileAsync(process.execPath, [BUILD_SCRIPT], {
    cwd: process.cwd(),
    timeout: 60_000,
  });

  return {
    injected: merged.length - existing.length,
    duplicates,
    total: merged.length,
    graphLog: stdout.trim().split("\n").slice(-2).join(" · "),
  };
}
