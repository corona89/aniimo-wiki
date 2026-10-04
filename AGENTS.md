<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 애니모 위키 (Aniimo fan wiki) — project guide

Korean-first, bilingual (KO/EN) fan wiki for **애니모 / Aniimo**. Unofficial; not
affiliated with Pawprint Studio or FunPlus. Next.js 16 (App Router) + React 19 +
TypeScript + Tailwind v4.

## Hard rules (data integrity)

- **Never invent** map coordinates, creature stats, or Korean names. Values appear
  only when verified against an official/cited source; otherwise stay `null` /
  "미확인" (unknown). `data/maps/empty-collection.json` stays an empty FeatureCollection.
- **Official wiki imports are allowed** (owner decision 2026-09-29): stats, skills
  and descriptions from wiki.aniimo.com are imported as `confirmed` via
  `node scripts/scrape-official-wiki.mjs`; official art is **hotlinked** from the
  official CDN (`worldx-website-cdn.aniimo.com`, allow-listed in next.config.ts)
  with © Pawprint Studio attribution — never copied into this repo.
- Do not copy other third-party assets (community-map/game-file rips). See
  `THIRD_PARTY_LICENSES.md`.
- Check confidence tags and naming ambiguities in `data/research/README.md`
  before writing region/creature names.

## Commands & verification

- `npm run dev` — dev server (http://localhost:3000)
- `npm run build` — production build; **this is also the type-check** (there is no
  separate typecheck script)
- `npm run lint` — eslint
- `node scripts/build-graph.mjs` — regenerates `data/knowledge/graph.json` from
  `data/research/*`. graph.json is **gitignored**; `npm run build` regenerates it
  automatically via `prebuild`. During dev without building, **run it manually
  after editing research data**, or `/qna` keeps serving the stale graph.
- `node scripts/scrape-official-wiki.mjs [--dry]` — re-imports live stats/skills/
  art URLs for every creature from the official Aniilog (wiki.aniimo.com/ko)
  into `data/research/creatures.json`; re-run build-graph afterwards.
- `node scripts/hash-password.mjs "pw"` — generate `ADMIN_PASSWORD_HASH`

No test suite exists. Verify changes with `npm run lint` + `npm run build`.

## Layout

- `app/` — routes (App Router): `/`, `/world`, `/creatures`, `/creatures/[slug]`,
  `/systems`, `/training`, `/maps`, `/search`, `/sources`, `/qna`, `/admin`.
  API routes under `app/api/` (`auth/*`, `qna`).
- `components/` — shared UI. `components/ui/` holds reusable primitives, exported
  via its `index.ts` barrel. Feature clients: `MapPlanner`, `TrainingLab`,
  `CreatureBrowser`, `QnaClient`, `SearchClient`. `components/i18n/LocaleProvider.tsx`
  powers the KO/EN toggle.
- `lib/`
  - `research.ts` — loads `data/research/*` + helpers (creaturesInRegion, elementImage…)
  - `i18n.ts` (server: getLocale/getT) + `i18n-dict.ts` (client-safe KO/EN dictionary)
  - `markersDb.ts` — client-only IndexedDB store for personal markers on the
    Leaflet-based `/maps` planner. Markers are per-browser; there is no
    server-side marker storage — don't go looking for (or add) a marker API.
  - `ingest/` — admin community ingest (`/admin` → 주입): fetches DC Inside
    (mgallery HTML) + Reddit (RSS; the old `.json` API is dead), curates with
    Jev, then re-runs build-graph. DC fetches need a Korean/residential IP.
  - `auth.ts` — admin session (Google SSO + password), admin allowlist
  - `labels.ts`, `types.ts`
  - `knowledge/` — QnA: `ontology.ts` (graph categories/nodes/edges),
    `classify.ts` (Jev + fallback), `typesafe.ts` (Jev client), `llm.ts`
    (Ollama glm-5.3), `retrieve.ts` (grounding over the graph)
- `data/research/*` — source of truth (creatures, regions, meta, systems,
  sources…). `data/research/community.json` holds admin-injected community
  posts (always confidence `community`). `data/knowledge/graph.json` is
  **generated** by build-graph — don't hand-edit it.
- `public/art/` — original fan-made illustrations (hero, elements, Idyll map, crest).

## i18n

Cookie-based locale (default `ko`). Server components call `getT()`; client leaf
components read `useI18n()`. Add new strings to both `ko` and `en` in
`lib/i18n-dict.ts`. Reading the cookie makes routes dynamic — expected, don't
try to "fix" it.

## Admin & QnA

- Admin edits are gated by `AdminEditLink` / `/admin` (Google SSO or
  username/password). Initial admin: `cpar2002@gmail.com`. Config via env
  (see `.env.example`).
- QnA (`/qna`, `/api/qna`) grounds answers on `data/knowledge/graph.json`.
  Classification/routing uses Jev (`JEV_KEY`); generation uses Ollama glm-5.3
  (`OLLAMA_API_KEY`). Without keys it falls back to deterministic classification +
  a no-LLM grounded answer that never invents and says "미확인" when unsupported.

## Env

See `.env.example`. Secrets are injected into new Cloud Agent runs (not existing
ones).
