export type Confidence = "confirmed" | "marketing" | "community" | "unknown";

export type OfficialStats = {
  total_attr: number | null;
  hp: number | null;
  break: number | null;
  attack: number | null;
  magic_def: number | null;
  phys_def: number | null;
  energy_regen: number | null;
  confidence: Confidence;
  source?: string;
  accessed?: string;
};

/** Skill scraped from the official Aniilog (wiki.aniimo.com). */
export type OfficialSkill = {
  name: string;
  desc?: string;
  kind?: string;
  cost?: number | null;
  power?: number | null;
  icon?: string | null;
};

export type Creature = {
  id: string;
  slug: string;
  aniilog_no?: string | null;
  name_en?: string | null;
  name_ko?: string | null;
  element?: string | null;
  evolution_notes?: string | null;
  habitat_region_hints?: string[] | null;
  rarity?: string | null;
  form_notes?: string | null;
  confidence: Confidence;
  source?: string;
  source_accessed?: string;
  stats?: OfficialStats | null;
  notes?: string | null;
  role_ko?: string | null;
  forms_known?: string[];
  official_stats_species?: OfficialStats | null;
  /** Official full art (hotlinked from the official CDN, © Pawprint Studio). */
  official_image?: string | null;
  official_desc_ko?: string | null;
  skills?: OfficialSkill[];
};

export type Region = {
  id: string;
  name_en?: string | null;
  name_en_alt?: string[];
  name_ko?: string | null;
  name_ko_alt?: string[];
  name_ko_confidence?: Confidence;
  biome_notes?: string | null;
  weather_notes?: string | null;
  level_band?: string | null;
  notable_landmarks?: string[];
  status?: string;
  confidence: Confidence;
  source_urls?: string[];
};

export type Source = {
  title: string;
  url: string;
  type: string;
  accessed: string;
  notes?: string;
};
