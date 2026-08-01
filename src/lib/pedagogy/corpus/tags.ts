// Tag registry — soft-warning vocabulary control.
//
// corpus/pedagogy/tags.json declares the canonical tag vocabulary (plus known
// aliases) used across the vault. Unlike sources.json (a hard licence gate),
// this registry is advisory: novel tags, alias usage, and formatting slips
// WARN but never block a compile. The goal is convergence toward a shared
// vocabulary over time, not a wall authors have to clear on day one.

export type TagCategory = 'situation' | 'age_band' | 'concept' | 'tension' | 'domain';

const TAG_CATEGORIES: TagCategory[] = ['situation', 'age_band', 'concept', 'tension', 'domain'];

export interface TagRegistryEntry {
  category: TagCategory;
  aliases?: string[];
  description?: string;
}

export type TagRegistry = Record<string, TagRegistryEntry>;

export function parseTagRegistry(rawJson: string): TagRegistry {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err) {
    throw new Error(`tags.json is not valid JSON: ${(err as Error).message}`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('tags.json must be an object keyed by tag');
  }

  const registry: TagRegistry = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    registry[key] = validateTagEntry(key, value);
  }

  // Alias collisions: an alias must not shadow a top-level tag key, and must
  // not be claimed by more than one entry.
  const aliasOwners = new Map<string, string>();
  for (const [key, entry] of Object.entries(registry)) {
    for (const alias of entry.aliases ?? []) {
      if (alias in registry) {
        throw new Error(
          `tags.json: alias "${alias}" (declared under "${key}") collides with the top-level tag key "${alias}"`
        );
      }
      const owner = aliasOwners.get(alias);
      if (owner) {
        throw new Error(
          `tags.json: alias "${alias}" is declared under both "${owner}" and "${key}" — aliases must be unique`
        );
      }
      aliasOwners.set(alias, key);
    }
  }

  return registry;
}

function validateTagEntry(key: string, value: unknown): TagRegistryEntry {
  if (!value || typeof value !== 'object') {
    throw new Error(`tags.json["${key}"] must be an object`);
  }
  const v = value as Record<string, unknown>;

  if (!TAG_CATEGORIES.includes(v.category as TagCategory)) {
    throw new Error(
      `tags.json["${key}"].category must be one of ${TAG_CATEGORIES.join(', ')} — got "${v.category}"`
    );
  }

  let aliases: string[] | undefined;
  if ('aliases' in v) {
    if (!Array.isArray(v.aliases) || v.aliases.some((a) => typeof a !== 'string')) {
      throw new Error(`tags.json["${key}"].aliases must be an array of strings`);
    }
    aliases = v.aliases as string[];
  }

  if ('description' in v && typeof v.description !== 'string') {
    throw new Error(`tags.json["${key}"].description must be a string`);
  }

  return {
    category: v.category as TagCategory,
    aliases,
    description: typeof v.description === 'string' ? v.description : undefined,
  };
}

/** Build an alias → canonical key lookup from a parsed registry. */
export function buildAliasMap(registry: TagRegistry): Map<string, string> {
  const map = new Map<string, string>();
  for (const [key, entry] of Object.entries(registry)) {
    for (const alias of entry.aliases ?? []) {
      map.set(alias, key);
    }
  }
  return map;
}
