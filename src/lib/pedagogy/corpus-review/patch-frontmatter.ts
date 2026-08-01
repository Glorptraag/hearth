// Surgical frontmatter patch for scripts/corpus-confirm.ts.
//
// Deliberately NOT a parse-then-reserialise round trip through
// src/lib/pedagogy/corpus/frontmatter.ts: `serialiseFrontmatter` decides
// array formatting (inline vs block) by length, which can silently
// reformat fields the confirm script has no business touching. This
// touches exactly one line — the `suggestedDraft:` line — and leaves
// everything else in the file byte-for-byte as authored.

/**
 * Set `suggestedDraft: false` in a vault entry's frontmatter, touching
 * nothing else. If the key is present (`true` or `false`), its line is
 * replaced in place. If absent (the vault default is "true"), a new line
 * is inserted — directly after `status:` when present (matching the
 * existing entries' convention), otherwise just before the closing `---`.
 */
export function setSuggestedDraftFalse(raw: string): string {
  const lines = raw.split(/\r?\n/);
  if (lines[0]?.trim() !== '---') {
    throw new Error('file must start with a `---` frontmatter delimiter');
  }

  let closeIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      closeIdx = i;
      break;
    }
  }
  if (closeIdx === -1) {
    throw new Error('frontmatter is missing its closing `---` delimiter');
  }

  let suggestedDraftIdx = -1;
  let statusIdx = -1;
  for (let i = 1; i < closeIdx; i++) {
    if (/^suggestedDraft:\s*(true|false)\s*$/.test(lines[i])) suggestedDraftIdx = i;
    if (/^status:\s*\S/.test(lines[i])) statusIdx = i;
  }

  if (suggestedDraftIdx !== -1) {
    lines[suggestedDraftIdx] = 'suggestedDraft: false';
  } else {
    const insertAt = statusIdx !== -1 ? statusIdx + 1 : closeIdx;
    lines.splice(insertAt, 0, 'suggestedDraft: false');
  }

  return lines.join('\n');
}
