// Compile a parsed vault entry into the Sanity document the live PKB
// schemas define (src/sanity/schemas/pedagogy*.ts). Document IDs are
// deterministic — `{sanityType}.{frameworkShort}.{nnn}` — so recompiling is
// a createOrReplace update in place, never a duplicate.
//
// The vault deliberately carries MORE than Sanity does (## Context notes,
// ## Grounded in wikilinks, registry provenance). Compilation projects the
// schema subset; the rest stays in the vault as authoring context.

import { parseListSection, parsePairListSection } from './parse';
import type { CompiledDoc, CorpusIssue, ParsedEntry, SourceRegistry } from './types';
import { checkLicenceGate } from './registry';

const ID_PATTERN = /^[a-z_]+\.\d{3}$/;

export interface CompileResult {
  doc: CompiledDoc | null;
  issues: CorpusIssue[];
}

export function compileEntry(entry: ParsedEntry, registry: SourceRegistry): CompileResult {
  const issues: CorpusIssue[] = [];
  const fm = entry.frontmatter;
  const file = entry.file;

  const id = str(fm.id);
  const isSingleton = entry.layerDir === 'facilitation-vocabulary';
  if (isSingleton) {
    if (id !== entry.framework.short) {
      issues.push({
        file,
        message: `facilitation vocabulary is a singleton — id must be "${entry.framework.short}", got "${id}"`,
      });
    }
  } else if (!ID_PATTERN.test(id)) {
    issues.push({ file, message: `id must match "{framework}.{nnn}" (e.g. ${entry.framework.short}.001), got "${id}"` });
  } else if (!id.startsWith(`${entry.framework.short}.`)) {
    issues.push({
      file,
      message: `id "${id}" does not belong to framework "${entry.framework.dir}" (expected prefix "${entry.framework.short}.")`,
    });
  }

  const status = str(fm.status);
  if (status !== 'draft' && status !== 'published') {
    issues.push({ file, message: `status must be "draft" or "published", got "${status}"` });
  }

  // Absent suggestedDraft means true — matching the Sanity schema initialValue,
  // so an entry only enters retrieval when a human has explicitly confirmed it.
  const suggestedDraft = fm.suggestedDraft === undefined ? true : fm.suggestedDraft === true;

  const tags = Array.isArray(fm.tags) ? fm.tags : undefined;
  if ('tags' in fm && (!tags || tags.length === 0)) {
    issues.push({ file, message: 'tags must be a non-empty array' });
  }

  // Licence gate — required for source excerpts, optional provenance elsewhere.
  const sourceKey = 'source' in fm ? str(fm.source) : null;
  if (sourceKey) {
    const isParaphrase = fm.isParaphrase === true;
    const gate = checkLicenceGate(file, sourceKey, registry, isParaphrase);
    if (gate) issues.push(gate);
  }

  if (issues.length > 0) return { doc: null, issues };

  const base = {
    _id: `${entry.sanityType}.${id}`,
    _type: entry.sanityType,
    framework: {
      _type: 'reference' as const,
      _ref: `pedagogicalFramework.${entry.framework.slug}`,
    },
    suggestedDraft,
    status,
  };

  try {
    switch (entry.layerDir) {
      case 'source-excerpts': {
        const source = registry[sourceKey!];
        return {
          doc: {
            ...base,
            text: entry.sections['text'],
            isParaphrase: fm.isParaphrase === true,
            sourceAttribution: {
              author: str(fm.attributionAuthor) || source.author,
              title: str(fm.attributionTitle) || source.title,
              year: str(fm.attributionYear) || source.year,
              pageOrChapter: str(fm.pageOrChapter),
            },
            tags,
          },
          issues,
        };
      }

      case 'practice-patterns':
        return {
          doc: {
            ...base,
            triggerTitle: str(fm.triggerTitle),
            triggerContext: entry.sections['trigger'],
            traditionResponse: entry.sections['response'],
            ...(entry.sections['anti-pattern'] ? { antiPattern: entry.sections['anti-pattern'] } : {}),
            tags,
          },
          issues,
        };

      case 'observational-markers':
        return {
          doc: {
            ...base,
            markerName: str(fm.markerName),
            whatItIndicates: entry.sections['what it indicates'],
            markersToLookFor: parseListSection(file, 'Look for', entry.sections['look for']),
            tags,
          },
          issues,
        };

      case 'facilitation-vocabulary': {
        const verbs = parsePairListSection(file, 'Verbs', entry.sections['verbs']);
        const scripts = parsePairListSection(file, 'Micro-scripts', entry.sections['micro-scripts']);
        return {
          doc: {
            ...base,
            verbs: verbs.map((v, i) => ({
              _key: `verb-${String(i + 1).padStart(3, '0')}`,
              verb: v.term,
              meaning: v.description,
            })),
            characteristicRestraints: parseListSection(file, 'Restraints', entry.sections['restraints']),
            microScripts: scripts.map((s, i) => ({
              _key: `script-${String(i + 1).padStart(3, '0')}`,
              situation: s.term,
              script: s.description,
            })),
          },
          issues,
        };
      }

      case 'contraindications':
        return {
          doc: {
            ...base,
            warnedAgainst: str(fm.warnedAgainst),
            traditionReasoning: entry.sections['reasoning'],
            tags,
          },
          issues,
        };

      case 'worked-examples':
        return {
          doc: {
            ...base,
            scenario: entry.sections['scenario'],
            interpretationInTraditionVoice: entry.sections['interpretation'],
            tags,
          },
          issues,
        };
    }
  } catch (err) {
    issues.push({ file, message: (err as Error).message });
    return { doc: null, issues };
  }
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
