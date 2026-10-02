// Shared types for the admin community-ingest pipeline
// (DC Inside gallery + Reddit r/Aniimo → Jev curation → knowledge graph).

export type PostSource = "dcinside" | "reddit";

/** A post collected from a community source, before Jev curation. */
export type FetchedPost = {
  source: PostSource;
  /** DC: gallery post number · Reddit: t3_xxx */
  nativeId: string;
  url: string;
  title: string;
  /** Plain-text body (may be empty when the detail fetch failed). */
  body: string;
  /** YYYY-MM-DD */
  postedAt: string;
  author: string | null;
};

/** A post persisted in data/research/community.json after passing Jev curation. */
export type StoredCommunityPost = {
  /** Stable graph id: community:<source>:<nativeId> */
  id: string;
  source: PostSource;
  nativeId: string;
  url: string;
  title: string;
  excerpt: string;
  /** YYYY-MM-DD */
  postedAt: string;
  author: string | null;
  /** Ontology top-level category chosen by Jev. */
  category: string;
  /** Jev usefulness confidence (0–1). */
  jevConfidence: number;
  /** YYYY-MM-DD */
  ingestedAt: string;
};

/** Response payload of POST /api/admin/ingest-community. */
export type IngestSummary = {
  from: string;
  to: string;
  fetched: { dcinside: number; reddit: number };
  useful: number;
  injected: number;
  duplicates: number;
  /** Posts dropped before curation because their hash/id is already ingested. */
  skipped: number;
  errors: string[];
  graphLog?: string;
};

/** One row of the admin ingest-history listing (GET /api/admin/ingest-history). */
export type IngestHistoryItem = {
  id: string;
  source: PostSource;
  nativeId: string;
  url: string;
  title: string;
  /** YYYY-MM-DD — original post date */
  postedAt: string;
  /** YYYY-MM-DD — when it was ingested */
  ingestedAt: string;
  /** sha-256 of the fetched content; null for entries ingested before the hash index existed. */
  contentHash: string | null;
};
