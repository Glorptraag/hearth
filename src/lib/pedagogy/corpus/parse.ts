// Corpus vault entry parsing: frontmatter + `## Section` bodies.
//
// Each layer has a fixed contract of frontmatter keys and body sections
// (documented in corpus/pedagogy/README.md). Unknown keys and unknown
// sections are hard errors so authoring drift is caught at compile time,
// not discovered as silently-missing fields in retrieval.

import { parseFrontmatter } from './frontmatter';
import {
  frameworkByDir,
  LAYER_DIRS,
  LAYER_DIR_TO_SANITY_TYPE,
  type FrontmatterValue,
  type LayerDir,
  type ParsedEntry,
} from './types';

interface LayerContract {
  requiredKeys: string[];
  optionalKeys: string[];
  requiredSections: string[];
  optionalSections: string[];
}

const COMMON_REQUIRED = ['id', 'status'];
const COMMON_OPTIONAL = ['suggestedDraft', 'source'];

export const LAYER_CONTRACTS: Record<LayerDir, LayerContract> = {
  'source-excerpts': {
    requiredKeys: [...COMMON_REQUIRED, 'source', 'pageOrChapter', 'isParaphrase', 'tags'],
    optionalKeys: ['suggestedDraft', 'attributionAuthor', 'attributionTitle', 'attributionYear'],
    requiredSections: ['text'],
    optionalSections: ['context'],
  },
  'practice-patterns': {
    requiredKeys: [...COMMON_REQUIRED, 'triggerTitle', 'tags'],
    optionalKeys: COMMON_OPTIONAL,
    requiredSections: ['trigger', 'response'],
    optionalSections: ['anti-pattern', 'grounded in'],
  },
  'observational-markers': {
    requiredKeys: [...COMMON_REQUIRED, 'markerName', 'tags'],
    optionalKeys: COMMON_OPTIONAL,
    requiredSections: ['what it indicates', 'look for'],
    optionalSections: ['grounded in'],
  },
  'facilitation-vocabulary': {
    requiredKeys: COMMON_REQUIRED,
    optionalKeys: COMMON_OPTIONAL,
    requiredSections: ['verbs', 'restraints', 'micro-scripts'],
    optionalSections: [],
  },
  'contraindications': {
    requiredKeys: [...COMMON_REQUIRED, 'warnedAgainst', 'tags'],
    optionalKeys: COMMON_OPTIONAL,
    requiredSections: ['reasoning'],
    optionalSections: ['grounded in'],
  },
  'worked-examples': {
    requiredKeys: [...COMMON_REQUIRED, 'tags'],
    optionalKeys: COMMON_OPTIONAL,
    requiredSections: ['scenario', 'interpretation'],
    optionalSections: ['grounded in'],
  },
};

/**
 * Parse one vault entry file.
 * @param relPath path relative to the vault root, e.g.
 *   'charlotte-mason/source-excerpts/cm-001-educational-triad.md'
 */
export function parseEntry(relPath: string, raw: string): ParsedEntry {
  const parts = relPath.split('/');
  if (parts.length !== 3) {
    throw new Error(`${relPath}: entries must live at <framework>/<layer>/<file>.md`);
  }
  const [frameworkDir, layerDirRaw] = parts;

  const framework = frameworkByDir(frameworkDir);
  if (!framework) {
    throw new Error(`${relPath}: unknown framework directory "${frameworkDir}"`);
  }
  if (!(LAYER_DIRS as readonly string[]).includes(layerDirRaw)) {
    throw new Error(`${relPath}: unknown layer directory "${layerDirRaw}"`);
  }
  const layerDir = layerDirRaw as LayerDir;

  let frontmatter: Record<string, FrontmatterValue>;
  let body: string;
  try {
    const result = parseFrontmatter(raw);
    frontmatter = result.values;
    body = result.body;
  } catch (err) {
    throw new Error(`${relPath}: ${(err as Error).message}`);
  }

  const contract = LAYER_CONTRACTS[layerDir];
  const allowed = new Set([...contract.requiredKeys, ...contract.optionalKeys]);
  for (const key of Object.keys(frontmatter)) {
    if (!allowed.has(key)) {
      throw new Error(`${relPath}: unknown frontmatter key "${key}" for layer ${layerDir}`);
    }
  }
  for (const key of contract.requiredKeys) {
    if (!(key in frontmatter)) {
      throw new Error(`${relPath}: missing required frontmatter key "${key}"`);
    }
  }

  const sections = splitSections(relPath, body);
  const allowedSections = new Set([...contract.requiredSections, ...contract.optionalSections]);
  for (const name of Object.keys(sections)) {
    if (!allowedSections.has(name)) {
      throw new Error(`${relPath}: unknown section "## ${name}" for layer ${layerDir}`);
    }
  }
  for (const name of contract.requiredSections) {
    if (!sections[name] || sections[name].trim() === '') {
      throw new Error(`${relPath}: missing or empty required section "## ${name}"`);
    }
  }

  return {
    file: relPath,
    framework,
    layerDir,
    sanityType: LAYER_DIR_TO_SANITY_TYPE[layerDir],
    frontmatter,
    sections,
  };
}

function splitSections(relPath: string, body: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = body.split('\n');
  let current: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (current !== null) {
      if (current in sections) {
        throw new Error(`${relPath}: duplicate section "## ${current}"`);
      }
      sections[current] = buffer.join('\n').trim();
    }
    buffer = [];
  };

  for (const line of lines) {
    const heading = line.match(/^## (.+)$/);
    if (heading) {
      flush();
      current = heading[1].trim().toLowerCase();
    } else if (current === null) {
      if (line.trim() !== '') {
        throw new Error(`${relPath}: body content before the first "## Section" heading`);
      }
    } else {
      buffer.push(line);
    }
  }
  flush();

  return sections;
}

// ─── Section content helpers ─────────────────────────────────────────────────

/** Parse a plain `- item` list section. Every non-blank line must be an item. */
export function parseListSection(file: string, sectionName: string, content: string): string[] {
  const items: string[] = [];
  for (const line of content.split('\n')) {
    if (line.trim() === '') continue;
    const m = line.match(/^- (.+)$/);
    if (!m) {
      throw new Error(
        `${file}: section "## ${sectionName}" must contain only \`- item\` lines, got: ${line.trim()}`
      );
    }
    items.push(m[1].trim());
  }
  return items;
}

/**
 * Parse a `- **Term** — description` pair list (verbs, micro-scripts).
 * The separator is an em dash surrounded by spaces; the description may
 * itself contain em dashes (only the first separator splits).
 */
export function parsePairListSection(
  file: string,
  sectionName: string,
  content: string
): Array<{ term: string; description: string }> {
  const pairs: Array<{ term: string; description: string }> = [];
  for (const line of content.split('\n')) {
    if (line.trim() === '') continue;
    const m = line.match(/^- \*\*(.+?)\*\* — (.+)$/);
    if (!m) {
      throw new Error(
        `${file}: section "## ${sectionName}" lines must match \`- **Term** — description\`, got: ${line.trim()}`
      );
    }
    pairs.push({ term: m[1].trim(), description: m[2].trim() });
  }
  return pairs;
}
