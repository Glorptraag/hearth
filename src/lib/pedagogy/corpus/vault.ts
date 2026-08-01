// Vault walker + orchestrator: read corpus/pedagogy/, parse and compile
// every entry, collect issues, and report per-framework coverage against
// the Wave-1 targets. Used by scripts/compile-pedagogy-corpus.ts and by the
// vault-validity test that runs in CI.

import * as fs from 'fs';
import * as path from 'path';
import { parseEntry } from './parse';
import { compileEntry } from './compile';
import { parseSourceRegistry } from './registry';
import { parseTagRegistry, buildAliasMap } from './tags';
import {
  FRAMEWORKS,
  LAYER_DIRS,
  LAYER_TARGETS,
  type CompiledDoc,
  type CorpusIssue,
  type LayerDir,
  type SourceRegistry,
} from './types';

export interface VaultCompileOutput {
  docs: CompiledDoc[];
  issues: CorpusIssue[];
  /** Soft findings — novel/alias/malformed tags. Never blocks the compile. */
  warnings: CorpusIssue[];
  registry: SourceRegistry;
  /** framework dir → layer dir → entry count */
  coverage: Record<string, Record<LayerDir, number>>;
  entryCount: number;
}

const TAG_FORMAT_PATTERN = /^[a-z0-9_]+$/;

export const DEFAULT_VAULT_ROOT = path.join('corpus', 'pedagogy');

export function compileVault(
  vaultRoot: string = DEFAULT_VAULT_ROOT,
  opts: { frameworkDir?: string } = {}
): VaultCompileOutput {
  const issues: CorpusIssue[] = [];
  const warnings: CorpusIssue[] = [];
  const docs: CompiledDoc[] = [];
  const coverage: Record<string, Record<LayerDir, number>> = {};
  let entryCount = 0;

  const registryPath = path.join(vaultRoot, 'sources.json');
  if (!fs.existsSync(registryPath)) {
    throw new Error(`source registry not found at ${registryPath}`);
  }
  const registry = parseSourceRegistry(fs.readFileSync(registryPath, 'utf8'));

  // Tag vocabulary — soft gate. Absence of tags.json is not an error; a
  // parse error in it is (it's a hard issue, not a per-tag warning).
  let tagAliasMap: Map<string, string> | undefined;
  let tagRegistryKeys: Set<string> | undefined;
  const tagsPath = path.join(vaultRoot, 'tags.json');
  if (fs.existsSync(tagsPath)) {
    try {
      const tagRegistry = parseTagRegistry(fs.readFileSync(tagsPath, 'utf8'));
      tagRegistryKeys = new Set(Object.keys(tagRegistry));
      tagAliasMap = buildAliasMap(tagRegistry);
    } catch (err) {
      issues.push({ file: 'tags.json', message: (err as Error).message });
    }
  }

  const seenIds = new Map<string, string>();

  for (const framework of FRAMEWORKS) {
    if (opts.frameworkDir && framework.dir !== opts.frameworkDir) continue;
    const frameworkPath = path.join(vaultRoot, framework.dir);
    if (!fs.existsSync(frameworkPath)) continue;

    coverage[framework.dir] = Object.fromEntries(
      LAYER_DIRS.map((l) => [l, 0])
    ) as Record<LayerDir, number>;

    for (const layerDir of LAYER_DIRS) {
      const layerPath = path.join(frameworkPath, layerDir);
      if (!fs.existsSync(layerPath)) continue;

      const files = fs
        .readdirSync(layerPath)
        .filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md')
        .sort();

      for (const file of files) {
        const relPath = `${framework.dir}/${layerDir}/${file}`;
        entryCount++;
        let raw: string;
        try {
          raw = fs.readFileSync(path.join(layerPath, file), 'utf8');
        } catch (err) {
          issues.push({ file: relPath, message: `unreadable: ${(err as Error).message}` });
          continue;
        }

        let entry;
        try {
          entry = parseEntry(relPath, raw);
        } catch (err) {
          issues.push({ file: relPath, message: (err as Error).message });
          continue;
        }

        const { doc, issues: entryIssues } = compileEntry(entry, registry);
        issues.push(...entryIssues);
        if (!doc) continue;

        if (tagRegistryKeys && tagAliasMap) {
          const tags = Array.isArray(doc.tags) ? (doc.tags as unknown[]) : [];
          for (const tag of tags) {
            if (typeof tag !== 'string') continue;
            if (tagRegistryKeys.has(tag)) {
              // registered canonical key — OK
            } else if (tagAliasMap.has(tag)) {
              warnings.push({
                file: relPath,
                message: `tag "${tag}" is an alias of "${tagAliasMap.get(tag)}" — use the canonical tag`,
              });
            } else {
              warnings.push({
                file: relPath,
                message: `novel tag "${tag}" — add it to tags.json or fix the spelling`,
              });
            }
            if (!TAG_FORMAT_PATTERN.test(tag)) {
              warnings.push({
                file: relPath,
                message: `tag "${tag}" is not lowercase snake_case (must match ${TAG_FORMAT_PATTERN}) — fix the formatting`,
              });
            }
          }
        }

        const priorFile = seenIds.get(doc._id);
        if (priorFile) {
          issues.push({ file: relPath, message: `duplicate document id ${doc._id} (also defined in ${priorFile})` });
          continue;
        }
        seenIds.set(doc._id, relPath);

        coverage[framework.dir][layerDir]++;
        docs.push(doc);
      }
    }
  }

  return { docs, issues, warnings, registry, coverage, entryCount };
}

/** Render the coverage table as terminal-friendly lines. */
export function formatCoverage(coverage: VaultCompileOutput['coverage']): string[] {
  const lines: string[] = [];
  for (const [frameworkDir, layers] of Object.entries(coverage)) {
    const total = Object.values(layers).reduce((a, b) => a + b, 0);
    lines.push(`  ${frameworkDir} (${total} entries)`);
    for (const layerDir of LAYER_DIRS) {
      const count = layers[layerDir];
      const target = LAYER_TARGETS[layerDir];
      const bar = count >= target ? '●' : count > 0 ? '◐' : '○';
      lines.push(`    ${bar} ${layerDir.padEnd(26)} ${String(count).padStart(3)} / ${target}`);
    }
  }
  return lines;
}
