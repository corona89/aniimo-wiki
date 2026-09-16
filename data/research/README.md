# Aniimo research pack

Structured research for a future **Korean-first fan wiki**, **interactive maps**, and **육성 시뮬레이션 (training/breeding sim)** for *Aniimo* (애니모) by Pawprint Studio.

**Pack date:** 2026-09-16 (PC/console launch day; mobile ~2026-09-23)  
**Path:** `/workspace/aniimo-research/`

---

## Project goals (what this pack supports)

| Goal | Primary files |
|------|----------------|
| Fan wiki (KO-first) | `wiki-outline.md`, `meta.json`, `systems.md`, `world.md` |
| Interactive maps | `maps.md`, `map-schema.json`, `regions.json` |
| Training / breeding sim | `training-sim.md`, `training-sim-schema.json`, `creatures.json` |

---

## Files

| File | Purpose |
|------|---------|
| `meta.json` | Game identity, platforms, dates, ratings, URLs, KO/EN summaries |
| `systems.md` | Twine, capture, combat, evolution, RV/Homeland, multiplayer, dex |
| `world.md` | Idyll vs 에이델 naming; region ambiguities |
| `regions.json` | Region/habitat rows with confidence + sources |
| `creatures.json` | Named Aniimo (EN grid + confirmed KO); roster-size notes |
| `maps.md` | Existing community maps; no invented pins |
| `map-schema.json` | GeoJSON-friendly marker schema for *our* wiki later |
| `training-sim.md` | Growth, eggs, forms, nurture — sim requirements |
| `training-sim-schema.json` | Sim data model; nulls for unknown numbers |
| `sources.json` | Every URL used |
| `wiki-outline.md` | IA including Training/Simulation + Maps |
| `README.md` | This file |

---

## Confidence legend

Use on every claim you promote into the wiki/sim:

- **confirmed** — official site, store, or official index
- **marketing** — trailer/store prose without mechanical detail
- **community** — fan wiki/tools/guides (may be accurate but second-hand)
- **unknown** — not found; leave null

**Never invent** creature lists beyond sources, map coordinates, or combat/growth numbers.

---

## How to use

1. Start at `meta.json` + `wiki-outline.md` for IA and identity.
2. Resolve world naming via `world.md` before writing region pages.
3. Import `regions.json` / `creatures.json` as stubs; enrich from `wiki.aniimo.com` live.
4. Build map UI against `map-schema.json` with **null geometry** until coords verified (see `maps.md` for aniimotools / Fextralife status).
5. Build sim UI against `training-sim-schema.json`; wire official odds from `sources.json` → formula-multipliers.
6. Cite with `sources.json` (`accessed`, `type`, `notes`).

### JSON validity

```bash
python3 -c "import json,glob; [json.load(open(p)) for p in glob.glob('/workspace/aniimo-research/*.json')]; print('OK')"
```

---

## Known ambiguities (read before publishing)

- **Idyll (EN) = 에이델 (KO)** — same continent.
- **Breezy Plains / Crescent Bay** vs Fextralife’s 15-name list — mapping unclear.
- **고래첨벙 해안 / 갈매기 만** — official KO habitats; EN region FK unknown.
- **수수타나** vs **수줍달/Susuta** — do not merge without official string.
- **Island of Peace** — CBT region; launch permanence unconfirmed.
- **Kakao Games** — not confirmed as publisher in sources used.
- **Game8 map** — not found on access day.
- Steam store date **Sep 15** vs official **Sep 16 UTC+8** — timezone/server window.

---

## Updating

When patching this pack: bump `accessed` dates, append `sources.json`, keep confidence tags honest, and refuse placeholder coordinates or fabricated base stats.
