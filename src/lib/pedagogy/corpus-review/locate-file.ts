// Locate the vault .md file backing a compiled doc.
//
// compileVault() doesn't carry a source path on its output docs (only
// CorpusIssue does). Rather than lean on the `{short}-{nnn}-{slug}.md`
// filename convention, re-read each candidate file's `id:` frontmatter
// line and match on that directly — the vault layer directories are tiny
// (dozens of files), so this is cheap and doesn't assume anything about
// filenames beyond "lives in this framework/layer directory".

import * as fs from 'fs';
import * as path from 'path';

const ID_LINE = /^id:\s*"?([^"\n]+?)"?\s*$/m;

/** Returns the absolute-or-relative (matches vaultRoot's own style) file path, or null if not found. */
export function locateVaultFile(
  vaultRoot: string,
  frameworkDir: string,
  layerDir: string,
  shortId: string
): string | null {
  const layerPath = path.join(vaultRoot, frameworkDir, layerDir);
  if (!fs.existsSync(layerPath)) return null;

  const files = fs
    .readdirSync(layerPath)
    .filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md');

  for (const file of files) {
    const filePath = path.join(layerPath, file);
    let raw: string;
    try {
      raw = fs.readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }
    const match = raw.match(ID_LINE);
    if (match && match[1] === shortId) return filePath;
  }

  return null;
}
