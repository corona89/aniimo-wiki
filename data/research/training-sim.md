# Aniimo — Training / Breeding simulation research (육성 시뮬레이션)

**Accessed:** 2026-09-16  
**Goal:** Feed a future fan **training/breeding sim UI** (not only wiki + maps).  
**Hard rule:** Prefer schema stubs + nulls over invented combat/growth numbers.

Confidence: `confirmed` | `marketing` | `community` | `unknown`

---

## 1. Acquisition → training pipeline

1. **Wild capture** (애니팟) → individual rolls Potential / traits / possible Sparkling (`confirmed` odds page + `community` Potential).
2. **Eggs** → Homeland Hatchinator incubation (`community`).
3. **Breeding** → inheritance rules for Sparkling / Prismana (`community` quoting in-game item text).
4. **Evolution** Lumin → Gamma → Nova (+ regional/weather branches) (`community`).
5. **Resonance training** levels 20–60 via Astranites (`community`).
6. **Accessories / equipment** from research notebook milestones & elite drops (`confirmed` launch copy + official odds for elite gear).

---

## 2. Species base stats (도감 종족치)

Official KO index shows per-form species stats, e.g. 수줍달 / 싹크랩:

| Field (KO) | EN working name | Notes |
|------------|-----------------|-------|
| 속성 (합) | total_attr | Species sum shown on index |
| HP | hp | |
| 무력화 | break / stagger | Role 격파 tied |
| 공격 | attack | |
| 마법 방어 | magic_def | |
| 물리 방어 | phys_def | |
| 에너지 회복 | energy_regen | |

Also community roles: DPS / Break / Support / Heal / Regen; nine elements.

**Sim need:** `base_stats` object per `creature_slug` + `form`; pull from wiki.aniimo.com — **do not hardcode guessed DPS**.

Sources: https://wiki.aniimo.com/ko/item/10003298 · https://wiki.aniimo.com/ko/item/10003310 · https://aniimoguide.com/aniidex

---

## 3. Individual variance (개체값)

| System | What is known | Numbers | Confidence |
|--------|---------------|---------|------------|
| **Potential** | Grades Common → Perfect; appraised quality | Band deltas **unpublished** | community |
| **Innate Potential / 선천 어빌리티** | Aniipod tier biases rolls; Champion pod corrects toward ≥6 on key abilities (press); Sparkling Cube → Perfect + Sparkling | Exact tables partial | community / press |
| **Traits** | Four MBTI-style personality axes boosting specific stats | Axis names & magnitudes `unknown` in this pack | community |
| **Sparkling styles** | 일반 / 찬란한 / 그림자 | Official % tables | **confirmed** |

Official Sparkling style table (스파클 애니팟 / 인장 / 광채): see aniimo.com/ko/formula-multipliers.

---

## 4. Evolution routes & conditions

- Stages: **Lumin / Gamma / Nova** (`community` UI naming — verify live strings).
- Materials can **branch** element lines (Pebbling example) (`community`).
- **Regional evolution:** evolve in matching region → Highland / Beach / Mountain Woods / etc. (`community`).
- **Weather evolution:** Rainstorm / Thunderstorm windows (`community`).
- Regional forms can change **element + habitat + stats** — not cosmetic (`community`).
- Prismana / Umbrabow: rare appearance prestige; forms guide claims stats/skills carry over (`community` — re-verify).

**Sim need:** directed graph edges `{from_id, to_id, conditions[]}` with nullable material IDs.

---

## 5. Resonance / 공명 훈련

- Per-creature progression **Lv 20–60**
- Consumes **Astranites**: Basic / Standard / Advanced tiers
- Finite; invest after Potential appraisal
- **Numeric gains per level / tier: unknown** (guides explicitly say not published)

---

## 6. Feeding / Nurture / Branch (생태 육성 · 지맥)

Korean press (GameMeca) + community:

- Region Aniilog % ≈ **40%** → activate 지맥꽃 / ecological nurture (many spawns)
- ≈ **70%** → change weather / trigger **천휘 (Prismana)** phenomenon (3×/day claimed in press)
- ≈ **80%** → Sparkling radar perk (`community`)
- Official nurture odds: 천휘 즉시 3%; +480 energy; soft pity 10500 (`confirmed` formula page)
- Offerings while Nurturing can bias Sparkling appearance (`community` item text)

**Feeding** as pet care: Homelands place Aniimo / crops — detailed food→stat tables **unknown**.

---

## 7. Bonding & Twine growth

- Twine requires bond with captured Aniimo (`marketing`/`confirmed` concept).
- Friendship meters, Twine skill unlock curves, combat mastery stats: **unknown** — sim should expose nullable `bond_level`.

---

## 8. Eggs & Hatchinator

| Item / concept | Notes | Confidence |
|----------------|-------|------------|
| Zone / species eggs | Many egg types in community catalogs (~111 claimed) | community |
| Sparkling Egg | Guaranteed Sparkling hatch | community |
| Wonder Egg | At least Alpha or Sparkling | community |
| Departure Sparkling Egg | New Pathfinder gift | community |
| Susuta / 수줍달 mysterious egg | Pre-registration reward | confirmed (aniimo.com/ko) |
| Promise / Bond Pact egg | Beta seal → launch reclaim | community |
| Perfect Egg | Login milestone | marketing |
| Obsidian egg | Special Sparkling style odds on official table | confirmed |
| Hatchinator Caress | Skip timer; ~20 uses observed | community |
| Incubation real-time | Timers in real time | community |

---

## 9. Form variants relevant to sim

| Variant | KO | Notes | Confidence |
|---------|----|-------|------------|
| Regional forms | (지역 형태) | Beach, Highland, Mudflat, … | community + official index tabs |
| Weather forms | 비바람 등 | Rainstorm, Thunderstorm, Snowfield | community |
| Prismana | **천휘** | Rainbow rare; free pick at Junior Wayfarer / 초급 탐구자 | confirmed marketing + press |
| Umbrabow | (그림자/암흑 대응) | Darkler-tied | community |
| Sparkling | **스파클** | Trait layer; styles 일반/찬란한/그림자 | confirmed |
| Alpha / Omega | — | Boss-tier oversized; Alpha capturable | community |
| Night form | 밤 형태 | e.g. 수줍달 | confirmed official index |

---

## 10. Capture pods affecting “training quality”

From official multipliers + press:

- Champion Aniipod / 챔피언 애니팟 — guaranteed catch; better innate rolls (press)
- Sparkling Aniipod / 스파클 애니팟 — guaranteed catch + Sparkling conversion odds table
- Sparkling Cube / Sigil / 스파클 인장 / 광채 — grant or reroll Sparkling style

Sim inventory should model pods as **catch modifiers**, not combat damage items.

---

## 11. Breeding (교배)

Community quotes of game text:

- Specified parent **Sparkling 100% inherit**
- Specified parent **Prismana Form 100% inherit**
- Broader IV/Potential inheritance formulas: **unknown** in this pack

---

## 12. Accessories & gear

- Research notebook progress → Aniimo accessories (`confirmed` aniimo.com/ko)
- Elite title-gated equipment drop rarities (`confirmed` formula page)
- Exact accessory stat lines: `unknown`

---

## 13. What a sim UI needs (checklist)

**Must have (data-backed):**

- Creature catalog FK + forms
- Evolution edge graph (conditions often unknown → store as text/null)
- Potential grade enum
- Sparkling flag + style enum + official style odds
- Egg types & guaranteed outcomes where known
- Aniipod list + catch coeffs from official page
- Region collection thresholds for nurture/Prismana/radar (press/community — mark confidence)

**Should have (nullable):**

- Species base stats from official index
- Resonance cost tables (null until datamined)
- Trait axes
- Bond / Twine progress
- Breeding IV rules

**Must NOT invent:**

- Damage formulas, DPS rotations, unpublished Potential band deltas, fake Astranite gain curves, fake coordinates

See `training-sim-schema.json`.
