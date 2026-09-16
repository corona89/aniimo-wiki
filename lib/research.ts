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
