import creaturesPack from "@/data/research/creatures.json";
import emptyMap from "@/data/maps/empty-collection.json";
import metaPack from "@/data/research/meta.json";
import regionsPack from "@/data/research/regions.json";
import sourcesPack from "@/data/research/sources.json";
import simSchema from "@/data/research/training-sim-schema.json";
import type { Creature, Region, Source } from "@/lib/types";

export const meta = metaPack;
export const creatures = creaturesPack.creatures as Creature[];
export const creatureRosterNotes = creaturesPack.roster_size_notes;
export const creatureNamingFlags = creaturesPack.naming_flags;
export const regions = regionsPack.regions as Region[];
export const worldInfo = regionsPack.world;
export const regionCountNotes = regionsPack.region_count_notes;
export const sources = sourcesPack as Source[];
export const mapCollection = emptyMap;
export const trainingSchema = simSchema;

export function displayName(creature: Creature, locale: "ko" | "en" = "ko"): string {
  if (locale === "ko") {
    return creature.name_ko ?? creature.name_en ?? creature.slug;
  }
  return creature.name_en ?? creature.name_ko ?? creature.slug;
}

export function regionDisplayName(region: Region, locale: "ko" | "en" = "ko"): string {
  if (locale === "ko") {
    return region.name_ko ?? region.name_en ?? region.id;
  }
  return region.name_en ?? region.name_ko ?? region.id;
}

export function getCreature(slug: string): Creature | undefined {
  return creatures.find((creature) => creature.slug === slug);
}

export function officialStatCreatures(): Creature[] {
  return creatures.filter((creature) => creature.official_stats_species);
}

export function getRegion(id: string): Region | undefined {
  return regions.find((region) => region.id === id);
}

function regionNames(region: Region): string[] {
  return [
    region.name_ko,
    region.name_en,
    ...(region.name_ko_alt ?? []),
    ...(region.name_en_alt ?? []),
  ].filter((value): value is string => Boolean(value));
}

/** Creatures linked to a region via explicit habitat hints or region-name mentions in notes. */
export function creaturesInRegion(region: Region): Creature[] {
  const names = regionNames(region).map((name) => name.toLowerCase());
  if (names.length === 0) return [];

  return creatures.filter((creature) => {
    const hints = (creature.habitat_region_hints ?? []).map((hint) => hint.toLowerCase());
    if (hints.some((hint) => names.some((name) => hint.includes(name) || name.includes(hint)))) {
      return true;
    }
    const text = `${creature.notes ?? ""} ${creature.form_notes ?? ""}`.toLowerCase();
    return names.some((name) => name.length > 2 && text.includes(name));
  });
}

/** Regions a creature is linked to (inverse of creaturesInRegion). */
export function regionsForCreature(creature: Creature): Region[] {
  return regions.filter((region) => creaturesInRegion(region).some((c) => c.id === creature.id));
}

/** Related creatures: same evolution line (by name mention) first, then same element. */
export function relatedCreatures(creature: Creature, limit = 6): Creature[] {
  const selfName = (creature.name_en ?? "").toLowerCase();
  const scored = creatures
    .filter((other) => other.id !== creature.id)
    .map((other) => {
      const otherText = `${other.evolution_notes ?? ""} ${other.notes ?? ""} ${other.form_notes ?? ""}`.toLowerCase();
      const mentionsSelf = selfName.length > 2 && otherText.includes(selfName);
      const selfText = `${creature.evolution_notes ?? ""} ${creature.notes ?? ""}`.toLowerCase();
      const selfMentionsOther =
        (other.name_en ?? "").length > 2 && selfText.includes((other.name_en ?? "").toLowerCase());
      const sameElement = Boolean(creature.element) && other.element === creature.element;
      const score = (mentionsSelf ? 4 : 0) + (selfMentionsOther ? 4 : 0) + (sameElement ? 1 : 0);
      return { other, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((entry) => entry.other);
}

export function elementImage(element?: string | null): string | null {
  if (!element) return null;
  const known = ["Fire", "Water", "Grass", "Lightning", "Earth", "Wind", "Dark", "Ice", "Light"];
  return known.includes(element) ? `/art/elements/${element.toLowerCase()}.jpg` : null;
}

/** Sources whose URL is referenced by a creature or region (by matching source url). */
export function creatureSources(creature: Creature): Source[] {
  if (!creature.source) return [];
  return sources.filter((source) => creature.source?.includes(source.url));
}
