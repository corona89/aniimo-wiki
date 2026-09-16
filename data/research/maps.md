# Aniimo — Existing maps & proposed wiki map schema

**Accessed:** 2026-09-16  
**Policy:** Document community maps; **do not invent coordinates or fake pins**.

---

## Community / fan maps found

### 1. Aniimo Tools Interactive Map — `confirmed` (community, actively updated)

- **URL:** https://aniimotools.dev/map/
- **Coverage:** Idyll regions; default focus **Breezy Plains**; claims spawns at **real in-game coordinates**.
- **Stated scope:** 15 regions + Island of Peace; markers ship as coordinates confirmed; WIP borders/level bands (updated 2026-09-16).
- **Marker / filter types (from site copy):**
  - Aniimo spawns (filter by element, evolution stage, day/night)
  - Weather-only forms (rain, thunderstorm, snow, Prismana Flow)
  - Chests
  - Gathering nodes
  - Bosses
  - Teleporters
  - Landmarks / points of interest
- **Related:** https://aniimotools.dev/regions/ · https://aniimotools.dev/systems/weather/
- **Beginner guide claim:** ~3,958 markers across Idyll + 25 in Astra (chests, eggs, Aniipods, Lumin Amber) — `community` count; verify before citing as wiki fact.

### 2. Fextralife Aniimo Wiki Interactive Map — `community` (incomplete)

- **URLs:** https://aniimo.wiki.fextralife.com/Interactive_Map · https://fextralife.com/wiki/aniimo/Interactive_Map
- **Status on access:** Page describes planned features (Aniimos, chests, sanctums, puzzles) but states **“We're working on getting you some markers soon”** (last edited ~2026-03-26). Fetch of primary URL returned 500 during this research — content also via fextralife.com mirror.
- **Intended marker types (page prose, not live pins):** Aniimo, hidden chests, sanctums, puzzles, landmarks / POI.

### 3. Game8

- **Search (2026-09-16):** No Game8 Aniimo interactive map / guide results found.
- **Status:** Treat as **not found / not confirmed** for this pack. Re-check later; do not invent a Game8 map entry.

### 4. Official

- **wiki.aniimo.com** Official Aniimo Index — creature pages with habitats, not a full interactive world map in the pages used here.
- Official site marketing maps: trailers / key art only for this pack.

### 5. Other community

- https://aniimoguide.com/ — Aniidex + claims of interactive map / marker counts in beginner guide.
- https://wikily.gg/aniimo/habitats — habitat list (secondary).

---

## Coordinate system notes

| Topic | Finding | Confidence |
|-------|---------|------------|
| In-game coordinates exist | aniimotools claims pins use “exact in-game location / real in-game coordinates” | community |
| Public coord format (x,y,z / map units) | **Not documented** in pages fetched | unknown |
| Geo projection | N/A for game world; for our wiki use local Cartesian or game-native XY if later datamined | — |
| This pack | **No coordinates stored** — schema only | — |

---

## Marker types observed across community maps (union)

Use as enum candidates for our schema (presence ≠ we have pins):

1. `spawn_aniimo` — wild spawn
2. `spawn_weather` — weather-gated form
3. `spawn_time` — day/night gated
4. `chest`
5. `gathering` / resource node (Lumin Amber etc.)
6. `boss` / Alpha / Omega encounter
7. `egg` (field egg)
8. `teleporter` / waypoint
9. `sanctum` (Fextralife planned)
10. `puzzle`
11. `rv_park` / campsite (store mentions RV campsites; **map pin confirmation sparse** — flag)
12. `landmark`
13. `ecological_observation` / 생태 관찰점 (KR guides)
14. `branch` / 지맥꽃 / nurture point (press)

---

## Proposed schema for OUR wiki

See `map-schema.json`. Principles:

- GeoJSON-friendly `Feature` / `FeatureCollection`
- `region_id` foreign key → `regions.json`
- `creature_id` / `slug` optional FK → `creatures.json`
- `confidence` + `source_url` required on every feature
- Coordinates **nullable** until verified; never placeholder fake numbers
- Separate layers: spawns, collectibles, travel, social (RV), encounters

---

## Gaps

- No authoritative official interactive map URL in this pack
- Fextralife markers not live
- Game8 absent
- EN↔KO region ID mapping incomplete (고래첨벙 해안 etc.)
