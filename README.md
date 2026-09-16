# 애니모 위키 (Aniimo fan wiki)

Korean-first fan wiki for **애니모 / Aniimo** (Pawprint Studio). Unofficial. Not affiliated with Pawprint Studio or FunPlus.

## What this is

- Next.js + TypeScript + Tailwind
- Wiki pages: home, world/regions, creatures, systems, maps stub, training-sim stub
- Research pack lives in `data/research/` (2026-09-16)

## Hard rules

- Do **not** invent map coordinates. `data/maps/empty-collection.json` stays an empty FeatureCollection until geometry is verified.
- Do **not** invent creature combat or growth numbers. Species stats appear only when the official index is cited in the pack; otherwise fields stay `null`.

## Scripts

```bash
npm install
npm run dev
npm run build
```

## Data

See `data/research/README.md` for confidence tags (`confirmed` / `marketing` / `community` / `unknown`) and known naming ambiguities (Idyll = 에이델, 수수타나 ≠ 수줍달 until proven).
