<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 애니모 위키 (Aniimo fan wiki) — project guide

Korean-first, bilingual (KO/EN) fan wiki for **애니모 / Aniimo**. Unofficial; not
affiliated with Pawprint Studio or FunPlus. Next.js 16 (App Router, Turbopack) +
React 19 + TypeScript + Tailwind v4.

## Hard rules (data integrity)

- **Never invent** map coordinates, creature stats, or Korean names. Values appear
  only when verified against an official/cited source; otherwise stay `null` /
  "미확인" (unknown). `data/maps/empty-collection.json` stays an empty FeatureCollection.
- **Do not copy** copyrighted assets/data (official game art, community-map/game-file
  data). Use original fan art and factual, attributed data. See `THIRD_PARTY_LICENSES.md`.

## Commands

- `npm run dev` — dev server (http://localhost:3000)
- `npm run build` — production build (also type-checks)
- `npm run lint` — eslint
- `node scripts/build-graph.mjs` — rebuild the QnA knowledge graph
- `node scripts/hash-password.mjs "pw"` — generate `ADMIN_PASSWORD_HASH`

## Layout

- `app/` — routes (App Router). Pages: `/`, `/world`, `/creatures`,
  `/creatures/[slug]`, `/systems`, `/training`, `/maps`, `/search`, `/sources`,
  `/qna`, `/admin`. API routes under `app/api/` (`auth/*`, `qna`).
- `components/` — shared UI. `components/ui/` is the reusable kit (Hero, Card,
  Badge, ElementBadge, StatBar, SectionHeading, Breadcrumbs, Stat, Callout,
  LinkButton). `components/i18n/LocaleProvider.tsx` powers the KO/EN toggle.
- `lib/`
  - `research.ts` — loads `data/research/*` + helpers (creaturesInRegion, elementImage…)
  - `i18n.ts` (server: getLocale/getT) + `i18n-dict.ts` (client-safe KO/EN dictionary)
  - `auth.ts` — admin session (Google SSO + password), admin allowlist
  - `labels.ts`, `types.ts`
  - `knowledge/` — QnA: `ontology.ts` (graph categories/nodes/edges),
    `classify.ts` (Jev + fallback), `typesafe.ts` (Jev client), `llm.ts`
    (Ollama glm-5.3), `retrieve.ts` (grounding over the graph)
- `data/research/*` — source data (creatures, regions, meta, systems, sources…).
  `data/knowledge/graph.json` — generated knowledge graph for QnA.
- `public/art/` — original fan-made illustrations (hero, elements, Idyll map, crest).

## i18n

Cookie-based locale (default `ko`). Server components call `getT()`; client leaf
components read `useI18n()`. Add strings to both `ko` and `en` in `lib/i18n-dict.ts`.
Reading the cookie makes routes dynamic — expected.

## Admin & QnA

- Admin edits are gated by `AdminEditLink` / `/admin` (Google SSO or username/password).
  Initial admin: `cpar2002@gmail.com`. Config via env (see `.env.example`).
- QnA (`/qna`, `/api/qna`) grounds answers on `data/knowledge/graph.json`.
  Classification/routing uses Jev (`JEV_KEY`); generation uses Ollama glm-5.3
  (`OLLAMA_API_KEY`). Without keys it falls back to deterministic classification +
  a no-LLM grounded answer that never invents and says "미확인" when unsupported.

## Env

See `.env.example`. Secrets are injected into new Cloud Agent runs (not existing ones).
