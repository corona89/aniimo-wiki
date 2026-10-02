// DC Inside fetcher for the admin community ingest.
//
// The Aniimo gallery is a MINOR gallery, so the desktop mgallery endpoints are
// used (verified live 2026-09-29 from a Korean residential IP):
//   list:  https://gall.dcinside.com/mgallery/board/lists/?id=aniimo&list_num=100&page=N
//   view:  https://gall.dcinside.com/mgallery/board/view/?id=aniimo&no=<num>
// The list is server-rendered and date-descending; each row carries an exact
// timestamp in <td class="gall_date" title="YYYY-MM-DD HH:MM:SS">, which lets us
// walk pages until the requested window is covered.
//
// Throughput strategy: instead of fixed caps tuned under DC's ~240-request
// burst throttle, requests are paced adaptively — parallel detail fetches with
// a small steady delay while the gallery responds, exponential backoff on the
// first throttle signal (HTTP 429/403/5xx, network error, or a block page),
// then decay back to full speed. Posts already present in the caller's
// hash/id index are skipped before any detail request is spent on them.

import { decodeEntities, htmlToText } from "@/lib/ingest/text";
import type { FetchedPost } from "@/lib/ingest/types";

const GALLERY_ID = "aniimo";
const BASE = "https://gall.dcinside.com";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const MAX_LIST_PAGES = 50; // 50×100 rows scanned — covers any realistic window
const MAX_POSTS = 1000;
const DETAIL_CONCURRENCY = 4; // parallel view-page fetches, sharing one pacer
const MIN_PACE_MS = 150; // steady-state pacing floor
const MAX_PACE_MS = 30_000; // backoff ceiling while throttled
const PACE_GROWTH = 3; // backoff multiplier per throttle signal
const MAX_RETRIES = 5; // per-request retries before giving up on that URL
const BLOCK_MARKERS = ["접속이 거부", "비정상 접속", "차단되었"];

/** Shared adaptive pacer — grows on throttle signals, decays on success. */
type Pace = { delayMs: number };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function headers(): Record<string, string> {
  return { "User-Agent": USER_AGENT, Referer: `${BASE}/`, "Accept-Language": "ko-KR,ko;q=0.8" };
}

function looksBlocked(html: string): boolean {
  return BLOCK_MARKERS.some((marker) => html.includes(marker));
}

/** GET with adaptive backoff; throws only after MAX_RETRIES throttle retries or a fatal status. */
async function getPage(url: string, pace: Pace): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    let html: string | null = null;
    let status = 0;
    try {
      const res = await fetch(url, {
        headers: headers(),
        signal: AbortSignal.timeout(15_000),
        cache: "no-store",
      });
      status = res.status;
      html = await res.text();
    } catch {
      html = null; // network error / timeout → retryable
    }

    if (html !== null && status >= 200 && status < 300 && !looksBlocked(html)) {
      pace.delayMs = Math.max(MIN_PACE_MS, Math.floor(pace.delayMs / 2));
      return html;
    }

    const retryable =
      html === null || status === 429 || status === 403 || status >= 500 || looksBlocked(html);
    if (!retryable) throw new Error(`DC Inside HTTP ${status} on ${url}`);
    if (attempt >= MAX_RETRIES) {
      throw new Error(`DC Inside throttled (HTTP ${status || "network"}) on ${url}`);
    }
    await sleep(pace.delayMs);
    pace.delayMs = Math.min(pace.delayMs * PACE_GROWTH, MAX_PACE_MS);
  }
}

type ListRow = { no: string; title: string; href: string; date: string; author: string | null };

/** Extract non-notice post rows from a server-rendered mgallery list page. */
function parseListRows(html: string): ListRow[] {
  const rows: ListRow[] = [];
  const rowRe = /<tr[^>]*class="[^"]*\bub-content\b[^"]*"[^>]*>([\s\S]*?)<\/tr>/g;
  for (const rowMatch of html.matchAll(rowRe)) {
    const row = rowMatch[1] ?? "";
    if (/icon_notice|icon_survey/.test(row)) continue; // 공지/설문 제외

    const no = row.match(/<td class="gall_num"[^>]*>\s*(\d+)\s*<\/td>/)?.[1];
    const date = row.match(/class="gall_date"[^>]*title="(\d{4}-\d{2}-\d{2})/)?.[1];
    const titleMatch = row.match(/class="gall_tit[^"]*"[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    if (!no || !date || !titleMatch) continue;

    const title = htmlToText(titleMatch[2] ?? "");
    if (!title || title.includes("삭제된 게시글")) continue;

    const href = decodeEntities(titleMatch[1] ?? "").trim();
    rows.push({
      no,
      title,
      href: href.startsWith("http") ? href : `${BASE}${href}`,
      date,
      author: decodeEntities(row.match(/data-nick="([^"]*)"/)?.[1] ?? "") || null,
    });
  }
  return rows;
}

/** Fetch one post view page; parsing failures yield empty strings, transport errors throw. */
async function fetchPostDetail(
  no: string,
  pace: Pace,
): Promise<{ title: string; body: string; date: string } | null> {
  const html = await getPage(`${BASE}/mgallery/board/view/?id=${GALLERY_ID}&no=${no}`, pace);
  const title = htmlToText(html.match(/class="title_subject"[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? "");
  const date = html.match(/class="gall_date"[^>]*title="(\d{4}-\d{2}-\d{2})/)?.[1] ?? "";
  const bodyMatch = html.match(
    /<div[^>]*class="write_div"[^>]*>([\s\S]*?)(?:<ul[^>]*class="appending_file"|<div[^>]*class="cmt_btn"|<div[^>]*class="bottom|<\/article>)/,
  );
  const body = bodyMatch ? htmlToText(bodyMatch[1] ?? "").slice(0, 1_200) : "";
  return { title, body, date };
}

/** Enrich in-window posts with body text via a shared-pacer worker pool. */
async function withBodies(posts: FetchedPost[], notes: string[]): Promise<FetchedPost[]> {
  const pace: Pace = { delayMs: MIN_PACE_MS };
  let next = 0;
  let failed = 0;

  const worker = async (): Promise<void> => {
    while (true) {
      const i = next++;
      if (i >= posts.length) return;
      const post = posts[i];
      try {
        const detail = await fetchPostDetail(post.nativeId, pace);
        if (detail) {
          if (detail.title) post.title = detail.title;
          if (detail.body) post.body = detail.body;
          if (detail.date) post.postedAt = detail.date;
        }
        await sleep(pace.delayMs / DETAIL_CONCURRENCY);
      } catch {
        failed++; // 삭제·거부된 글 — 제목만으로 진행
      }
    }
  };

  await Promise.all(Array.from({ length: DETAIL_CONCURRENCY }, worker));
  if (failed > 0) {
    notes.push(`${failed}건은 서버 거부·삭제로 본문 수집에 실패했습니다 — 제목 기준으로 판정됩니다.`);
  }
  return posts;
}

/**
 * Collect posts whose date (YYYY-MM-DD) falls within [from, to] inclusive.
 * `opts.skipNativeIds` lists gallery post numbers already ingested — they are
 * excluded from the result without spending a detail request.
 */
export async function fetchDcinsidePosts(
  from: string,
  to: string,
  opts: { skipNativeIds?: ReadonlySet<string> } = {},
): Promise<{ posts: FetchedPost[]; notes: string[]; skipped: number }> {
  const posts: FetchedPost[] = [];
  const notes: string[] = [];
  const seen = new Set<string>();
  let skipped = 0;
  let windowComplete = false;
  const pace: Pace = { delayMs: MIN_PACE_MS };

  for (let page = 1; page <= MAX_LIST_PAGES && posts.length < MAX_POSTS; page++) {
    let html: string;
    try {
      html = await getPage(
        `${BASE}/mgallery/board/lists/?id=${GALLERY_ID}&list_num=100&page=${page}`,
        pace,
      );
    } catch (err) {
      // Keep whatever earlier pages yielded instead of losing the whole run.
      notes.push(`${page - 1}페이지까지 수집 — 이후 ${err instanceof Error ? err.message : String(err)}`);
      break;
    }
    const rows = parseListRows(html);
    if (rows.length === 0) break;

    for (const row of rows) {
      if (row.date > to) continue; // 범위보다 최신 — 건너뜀
      if (row.date < from) {
        windowComplete = true; // 내림차순이라 창 종료
        break;
      }
      if (seen.has(row.no) || posts.length >= MAX_POSTS) continue;
      seen.add(row.no);
      if (opts.skipNativeIds?.has(row.no)) {
        skipped++; // 이미 주입됨 — 본문 요청 예산을 아끼고 즉시 스킵
        continue;
      }
      posts.push({
        source: "dcinside",
        nativeId: row.no,
        url: row.href,
        title: row.title,
        body: "",
        postedAt: row.date,
        author: row.author,
      });
    }
    if (windowComplete) break;
  }

  if (posts.length >= MAX_POSTS) {
    notes.push(`범위 내 게시물이 ${MAX_POSTS}건 제한에 걸렸습니다 — 날짜 범위를 나눠서 주입하세요.`);
  }

  return { posts: await withBodies(posts, notes), notes, skipped };
}
