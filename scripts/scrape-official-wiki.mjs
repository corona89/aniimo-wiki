#!/usr/bin/env node
// Scrape the OFFICIAL Aniimo wiki (https://wiki.aniimo.com/ko) and merge every
// creature's live data — stats, skills, official art URLs, descriptions, forms —
// into data/research/creatures.json.
//
// Owner decision (2026-09-29): official-wiki data may be imported; images are
// HOTLINKED from the official CDN (not copied into this repo) with attribution.
//
// Site notes (verified 2026-09-29):
//   - Nuxt SSR; each page embeds a devalue payload in <script data-nuxt-data>.
//   - Roster: home payload state["header-aniimo-list-ko"] (86 entries).
//   - Item page: /ko/item/{entryId} (e.g. 049) — server-rendered stat rows use
//     `LABEL：` + value spans; skills render as `circle-component` blocks.
//   - Element comes from the hero CSS class `attribute-<element>`.
// Run: node scripts/scrape-official-wiki.mjs [--dry]

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const DELAY_MS = 350;
const DRY = process.argv.includes("--dry");
const ACCESSED = new Date().toISOString().slice(0, 10);

const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.8" },
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
  return await res.text();
}

// --- devalue payload decoder (numbers inside objects/arrays = 1-based indices) ---
function decodePayload(html) {
  const m = html.match(/<script[^>]*data-nuxt-data[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return null;
  const arr = JSON.parse(m[1]);
  const WRAPPERS = new Set(["ShallowReactive", "Reactive", "ShallowRef", "Ref"]);
  const memo = new Map();
  function hydrate(i, depth) {
    if (memo.has(i)) return memo.get(i);
    if (depth > 500 || !Number.isInteger(i) || i < 1 || i >= arr.length) return undefined;
    const out = revive(arr[i], depth + 1);
    memo.set(i, out);
    return out;
  }
  function revive(v, depth) {
    if (typeof v === "number" && Number.isInteger(v)) return hydrate(v, depth);
    if (Array.isArray(v)) {
      // Unwrap Nuxt reactive containers: ["ShallowReactive", inner].
      if (v.length === 2 && typeof v[0] === "string" && WRAPPERS.has(v[0])) return revive(v[1], depth);
      return v.map((x) => revive(x, depth));
    }
    if (v && typeof v === "object") {
      const out = {};
      for (const [k, x] of Object.entries(v)) out[k] = revive(x, depth);
      return out;
    }
    return v;
  }
  return revive(arr[1], 0);
}

// Site tokens differ from ontology names for some elements (verified 2026-09-29):
// `electric` = Lightning, `rock` = Earth, `holy` = Light.
const ELEMENT_KO = {
  fire: "Fire", water: "Water", grass: "Grass", electric: "Lightning",
  lightning: "Lightning", rock: "Earth", earth: "Earth", wind: "Wind",
  dark: "Dark", ice: "Ice", holy: "Light", light: "Light",
};

function decodeEntities(s) {
  return String(s)
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"').replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

function parseItemPage(html) {
  // Stats: `>HP：</span> … <span>92</span>` full-width colon.
  const stats = {};
  const statRe = />(HP|무력화|공격|마법 방어|물리 방어|에너지 회복)：<\/span>[\s\S]{0,500}?<span[^>]*>(\d+)<\/span>/g;
  for (const m of html.matchAll(statRe)) stats[m[1]] = Number(m[2]);
  const total = Number(html.match(/속성：(\d+)/)?.[1] ?? 0);

  // Element from the hero layer class.
  const element = ELEMENT_KO[html.match(/attribute-(fire|water|grass|electric|lightning|rock|earth|wind|dark|ice|holy|light)\b/)?.[1] ?? ""] ?? null;

  // Skills: split on rendered skill cards.
  const skills = [];
  for (const block of html.split("circle-component").slice(1)) {
    const icon = block.match(/https:[^"']*Skill_(\d+)_Icon\.png/)?.[0] ?? null;
    const name = decodeEntities(block.match(/md:text-\[16px\][^>]*>([^<]+)<\/div>/)?.[1] ?? "").trim();
    if (!name) continue;
    const desc = decodeEntities(block.match(/whitespace-normal"[^>]*>([^<]+)</)?.[1] ?? "").trim();
    const kind = decodeEntities(block.match(/유형: <\/span>[\s\S]{0,300}?<span[^>]*>([^<]{2,24})<\/span>/)?.[1] ?? "").trim();
    const cost = block.match(/소모 에너지: <\/span><span[^>]*>(\d+)</)?.[1] ?? null;
    const power = block.match(/위력: <\/span><span[^>]*>(\d+)</)?.[1] ?? null;
    skills.push({ name, desc, kind, cost: cost == null ? null : Number(cost), power: power == null ? null : Number(power), icon });
  }
  return { stats, total, element, skills };
}

// --- 1. Roster from the home payload ---
console.log("fetching roster: https://wiki.aniimo.com/ko");
const homeHtml = await get("https://wiki.aniimo.com/ko");
const homeState = (() => {
  const payload = decodePayload(homeHtml);
  // Root is the app payload { data, state, ... } — async data lives under `data`.
  return payload?.data ?? payload;
})();
const roster = (homeState?.["header-aniimo-list-ko"] ?? [])
  .map((entry) => ({
    oldId: entry?.id ?? null,
    entryId: entry?.searchKey?.entryId ?? null,
    name_ko: entry?.searchKey?.name ?? null,
    image: entry?.searchKey?.imageUrl ?? null,
  }))
  .filter((e) => e.entryId && e.name_ko);
console.log(`roster: ${roster.length} creatures`);

// --- 2. Fetch each item page ---
const results = [];
let failures = 0;
for (const item of roster) {
  const url = `https://wiki.aniimo.com/ko/item/${item.entryId}`;
  try {
    const html = await get(url);
    const parsed = parseItemPage(html);
    const payload = decodePayload(html);
    const detailKey = Object.keys(payload ?? {}).find((k) => k.startsWith("aniimo-detail"));
    const detail = payload?.[detailKey] ?? null;
    const forms = Array.isArray(detail?.morphologyList)
      ? detail.morphologyList.map((f) => f?.name ?? f?.morphologyName).filter(Boolean)
      : [];
    results.push({
      ...item,
      url,
      element: parsed.element,
      total: parsed.total,
      stats: parsed.stats,
      skills: parsed.skills,
      desc: typeof detail?.searchKey?.description === "string" ? detail.searchKey.description.trim() : null,
      forms,
    });
    process.stdout.write(`\r  ${item.entryId} ${item.name_ko}: stats=${Object.keys(parsed.stats).length} skills=${parsed.skills.length}   `);
  } catch (err) {
    failures++;
    console.error(`\n  FAIL ${item.entryId} ${item.name_ko}: ${err.message}`);
    results.push({ ...item, url, error: err.message });
  }
  await sleep(DELAY_MS);
}
console.log(`\nfetched ${results.length - failures}/${results.length}, failures: ${failures}`);

// --- 3. Merge into data/research/creatures.json ---
const packPath = "data/research/creatures.json";
const pack = read(packPath);
const byOldId = new Map();
const byNameKo = new Map();
for (const c of pack.creatures) {
  const oldId = (c.source ?? "").match(/wiki\.aniimo\.com\/(?:ko\/)?item\/(\d+)/)?.[1];
  if (oldId) byOldId.set(oldId, c);
  if (c.name_ko) byNameKo.set(c.name_ko, c);
}

// Guard data for the aniilog_no fallback path below: numbers already claimed by
// an official-wiki source URL, and how many pack creatures hold each number.
// Ids/numbers stay strings ("084") — Set/Map compare without coercion.
const claimedNumbers = new Set();
const numberClaimants = new Map();
for (const c of pack.creatures) {
  const src = c.source ?? "";
  if (src.includes("wiki.aniimo.com")) {
    const id = src.match(/wiki\.aniimo\.com\/(?:ko\/)?item\/(\d+)/)?.[1];
    if (id) claimedNumbers.add(id);
  }
  if (c.aniilog_no != null) {
    numberClaimants.set(c.aniilog_no, (numberClaimants.get(c.aniilog_no) ?? 0) + 1);
  }
}

let updated = 0;
let added = 0;
const unmatched = [];
for (const r of results) {
  if (r.error) continue;
  const itemUrl = `https://wiki.aniimo.com/ko/item/${r.entryId}`;
  const statsOk = Object.keys(r.stats).length >= 6;
  const officialStats = statsOk
    ? {
        total_attr: r.total || Object.values(r.stats).reduce((a, b) => a + b, 0),
        hp: r.stats["HP"] ?? null,
        break: r.stats["무력화"] ?? null,
        attack: r.stats["공격"] ?? null,
        magic_def: r.stats["마법 방어"] ?? null,
        phys_def: r.stats["물리 방어"] ?? null,
        energy_regen: r.stats["에너지 회복"] ?? null,
        confidence: "confirmed",
        source: itemUrl,
        accessed: ACCESSED,
      }
    : null;

  let existing = (r.oldId && byOldId.get(r.oldId)) || byNameKo.get(r.name_ko);
  // Third path (guarded): roster entry whose number uniquely belongs to one
  // community creature with an unknown Korean name, never claimed by an
  // official source URL — merge instead of appending a duplicate.
  if (
    !existing &&
    !claimedNumbers.has(r.entryId) &&
    numberClaimants.get(r.entryId) === 1
  ) {
    const candidate = pack.creatures.find((c) => c.aniilog_no === r.entryId);
    if (candidate && !candidate.name_ko) {
      existing = candidate;
      console.log(`NUMBER-MATCHED: ${r.entryId} → ${existing.slug}`);
    }
  }
  const patch = {
    aniilog_no: r.entryId,
    name_ko: r.name_ko,
    // Only patch element when parsed — Object.assign with undefined would wipe it.
    ...(r.element ? { element: r.element } : {}),
    official_image: r.image ?? null,
    official_desc_ko: r.desc,
    official_stats_species: officialStats,
    skills: r.skills.length > 0 ? r.skills : undefined,
    forms_known: r.forms.length > 0 ? r.forms : undefined,
    confidence: "confirmed",
    source: itemUrl,
    source_accessed: ACCESSED,
  };
  if (existing) {
    Object.assign(existing, patch);
    updated++;
  } else {
    pack.creatures.push({
      id: `aniimo-${r.entryId}`,
      slug: `official-${r.entryId}`,
      ...patch,
    });
    added++;
    unmatched.push(`${r.entryId} ${r.name_ko}`);
  }
}
console.log(`merge: updated=${updated} added=${added}`);
if (unmatched.length) console.log("new entries:", unmatched.join(", "));

if (!DRY) {
  pack.creatures.sort((a, b) => String(a.aniilog_no ?? "999").localeCompare(String(b.aniilog_no ?? "999")));
  fs.writeFileSync(path.join(ROOT, packPath), JSON.stringify(pack, null, 2) + "\n", "utf8");
  console.log(`wrote ${packPath}`);
} else {
  console.log("dry run — nothing written");
}
