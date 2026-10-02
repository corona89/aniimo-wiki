// Reddit fetcher for the admin community ingest.
//
// The unauthenticated reddit.com/*.json endpoints were shut down in May 2026,
// but the Atom RSS feeds still work (verified 2026-09-29) with a descriptive
// User-Agent — the default curl/fetch UA gets HTTP 429.
//
// Throughput strategy: adaptive paging instead of a fixed 30s crawl delay —
// a short steady delay between pages, exponential backoff (up to 60s, 8
// retries) whenever Reddit answers 429/503, and decay back to full speed on
// success. The page ceiling is effectively the whole subreddit, and whatever
// was collected before a persistent refusal is kept. Combined with the
// caller's hash/id skip index, re-runs only pay for genuinely new posts.

import { decodeEntities, htmlToText } from "@/lib/ingest/text";
import type { FetchedPost } from "@/lib/ingest/types";

const FEED_URL = "https://www.reddit.com/r/Aniimo/new/.rss";
const USER_AGENT = "aniimo-wiki/1.0 (Aniimo fan wiki; admin community ingest)";
const PAGE_SIZE = 100;
const MAX_PAGES = 200; // 20,000 posts — effectively the whole subreddit history
const BASE_PAGE_DELAY_MS = 1_500; // steady-state spacing between pages
const MAX_PAGE_DELAY_MS = 60_000; // backoff ceiling
const MAX_RETRIES_PER_PAGE = 8;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type RawEntry = { nativeId: string; postedAt: string; entry: string };

function parseFeed(xml: string): RawEntry[] {
  const entries: RawEntry[] = [];
  for (const match of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const entry = match[1] ?? "";
    const nativeId = entry.match(/<id>(t3_[a-z0-9]+)<\/id>/i)?.[1];
    if (!nativeId) continue;
    const timestamp =
      entry.match(/<updated>([^<]+)<\/updated>/)?.[1] ??
      entry.match(/<published>([^<]+)<\/published>/)?.[1] ??
      "";
    // Atom dates are ISO 8601 with timezone; the date part sorts lexicographically.
    entries.push({ nativeId, postedAt: timestamp.slice(0, 10), entry });
  }
  return entries;
}

function toPost(raw: RawEntry): FetchedPost {
  const entry = raw.entry;
  const title = decodeEntities(entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "").trim();
  const link = decodeEntities(entry.match(/<link[^>]*href="([^"]+)"/)?.[1] ?? "").trim();
  const author = entry.match(/<name>(\/u\/[^<]+)<\/name>/)?.[1] ?? null;
  const contentHtml = entry.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1] ?? "";
  // Atom content type="html" is XML-escaped: decode entities first, then strip tags.
  const body = htmlToText(contentHtml).slice(0, 1_200);
  return {
    source: "reddit",
    nativeId: raw.nativeId,
    url: link || `https://www.reddit.com/r/Aniimo/comments/${raw.nativeId.slice(3)}/`,
    title,
    body,
    postedAt: raw.postedAt,
    author,
  };
}

/**
 * Collect posts whose date (YYYY-MM-DD) falls within [from, to] inclusive.
 * `opts.skipNativeIds` lists t3_ ids already ingested — they are excluded
 * from the result without costing a curation pass.
 */
export async function fetchRedditPosts(
  from: string,
  to: string,
  opts: { skipNativeIds?: ReadonlySet<string> } = {},
): Promise<{ posts: FetchedPost[]; notes: string[]; skipped: number }> {
  const posts: FetchedPost[] = [];
  const notes: string[] = [];
  const seen = new Set<string>();
  let skipped = 0;
  let after: string | null = null;
  let delayMs = BASE_PAGE_DELAY_MS;

  for (let page = 0; page < MAX_PAGES; page++) {
    if (page > 0) await sleep(delayMs);

    const url = `${FEED_URL}?limit=${PAGE_SIZE}${after ? `&after=${after}` : ""}`;
    let res: Response | null = null;
    for (let attempt = 0; ; attempt++) {
      try {
        res = await fetch(url, {
          headers: { "User-Agent": USER_AGENT, Accept: "application/atom+xml" },
          signal: AbortSignal.timeout(20_000),
          cache: "no-store",
        });
      } catch {
        res = null; // network error / timeout → retryable
      }
      if (res && (res.ok || (res.status !== 429 && res.status !== 503))) break;
      if (attempt >= MAX_RETRIES_PER_PAGE) break;
      await sleep(delayMs);
      delayMs = Math.min(delayMs * 2, MAX_PAGE_DELAY_MS);
    }

    if (!res || !res.ok) {
      const detail = res ? `HTTP ${res.status}` : "네트워크 오류";
      if (page === 0) throw new Error(`Reddit RSS ${detail}`);
      notes.push(
        `${posts.length}건까지만 수집 — Reddit이 ${detail}(속도 제한)로 백오프 후에도 거부했습니다.`,
      );
      break;
    }
    delayMs = Math.max(BASE_PAGE_DELAY_MS, Math.floor(delayMs / 2));

    let rawEntries: RawEntry[];
    try {
      rawEntries = parseFeed(await res.text());
    } catch {
      if (page === 0) throw new Error("Reddit RSS malformed feed");
      notes.push(`${posts.length}건까지만 수집 — 피더 파싱에 실패했습니다.`);
      break;
    }
    if (rawEntries.length === 0) break;

    const oldest = rawEntries[rawEntries.length - 1];
    for (const raw of rawEntries) {
      if (raw.postedAt < from || raw.postedAt > to) continue;
      if (seen.has(raw.nativeId)) continue;
      seen.add(raw.nativeId);
      if (opts.skipNativeIds?.has(raw.nativeId)) {
        skipped++; // 이미 주입됨 — 큐레이션 비용 없이 스킵
        continue;
      }
      posts.push(toPost(raw));
    }

    // Window fully covered, or the feed is exhausted — no more pages needed.
    if (oldest.postedAt < from || rawEntries.length < PAGE_SIZE) break;
    after = oldest.nativeId;
  }

  return { posts, notes, skipped };
}
