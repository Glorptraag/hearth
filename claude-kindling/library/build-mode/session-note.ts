/**
 * Session-note writer — produces (and idempotently updates) the markdown session
 * note that goes alongside every build-mode run.
 *
 * Lives at: `claude-kindling/design/sessions/{session}.md`
 *
 * Two entry points:
 *   - `writeSessionNoteStart(header)` — called once at the top of an orchestrator
 *     run, after gates pass. Writes a header section ("design lock") if the file
 *     doesn't yet exist for this session, or no-ops if it does.
 *   - `appendSessionNoteCloseOut(path, ctx)` — called at the end of the run.
 *     Idempotent: replaces any existing close-out block bracketed by the
 *     sentinel comments. Re-runs overwrite the close-out in place rather than
 *     appending a fresh one.
 *
 * ES2017-safe: no `/s` flag on regex (would cause `SyntaxError: Invalid regular
 * expression: /…/s` in older targets). We use `[\s\S]*?` for cross-line matching.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// ─── Header / start ──────────────────────────────────────────────────────────

export interface SessionNoteHeader {
  session: string;                       // e.g. "2026-04-30-build-1-1"
  mode: 'build';
  module: string;                        // kindlingId
  packRef: string;
  targetUnderstanding: string | null;
  approachCount: number;
  startedAt: string;                     // ISO timestamp
}

/** Returns the absolute path on disk regardless of whether it was newly created. */
export async function writeSessionNoteStart(h: SessionNoteHeader): Promise<string> {
  const sessionPath = sessionNotePathFor(h.session);
  if (!existsSync(dirname(sessionPath))) {
    await mkdir(dirname(sessionPath), { recursive: true });
  }
  if (existsSync(sessionPath)) {
    // Don't clobber an existing file — re-runs only update the close-out section.
    return sessionPath;
  }
  const body = renderHeader(h);
  await writeFile(sessionPath, body, 'utf8');
  return sessionPath;
}

function renderHeader(h: SessionNoteHeader): string {
  const tu = h.targetUnderstanding ?? '_(target understanding not set on the spec)_';
  const lines = [
    `# Build session — ${h.module}`,
    '',
    `> **Session:** ${h.session}  `,
    `> **Mode:** ${h.mode}  `,
    `> **Module:** \`${h.module}\`  `,
    `> **Pack:** \`${h.packRef}\`  `,
    `> **Approach count (from spec):** ${h.approachCount}  `,
    `> **Started:** ${h.startedAt}`,
    '',
    '## Design lock',
    '',
    `**Target understanding:**`,
    '',
    `> ${tu}`,
    '',
    '_(approach angles, asset hints, and in-scope open questions land here as the run proceeds — see Close-out below for the machine-derived summary.)_',
    '',
    '<!-- CLOSE-OUT START -->',
    '<!-- CLOSE-OUT END -->',
    '',
  ];
  return lines.join('\n');
}

// ─── Close-out ──────────────────────────────────────────────────────────────

const CLOSE_OUT_START = '<!-- CLOSE-OUT START -->';
const CLOSE_OUT_END = '<!-- CLOSE-OUT END -->';

/**
 * Structural shape of the orchestrator's `RunContext` (the parts this writer
 * actually reads). Defined locally to avoid importing `orchestrator.ts` —
 * which would create a circular dependency at module-load time.
 */
export interface SessionNoteCloseOutCtx {
  session: string;
  spec: {
    kindlingId: string;
    packRef: string;
  };
  dryRun: boolean;
  created: { type: string; id: string; title: string }[];
  skipped: { type: string; id: string; reason: string }[];
  hardFailures: { id: string; criteria: string[] }[];
  softWarnings: { id: string; criteria: string[] }[];
  neededFlagged: { deterministicId: string; scope: string; raw: string }[];
  overlapWarnings?: { kindlingId: string; jaccard: number }[];
  derivedArtifacts?: {
    statusBoardPath: string;
    heatmapPath: string;
    yamlPath: string;
  };
  derivedArtifactsError?: string;
}

export async function appendSessionNoteCloseOut(
  sessionPath: string,
  ctx: SessionNoteCloseOutCtx,
): Promise<void> {
  if (!existsSync(sessionPath)) {
    // Defensive: writeSessionNoteStart should have created it. If it didn't (test
    // path?), fall back to creating a minimal shell so we still record the close-out.
    const stub = [
      `# Build session — ${ctx.spec.kindlingId}`,
      '',
      `> Session ${ctx.session} (close-out only — header was not written at start).`,
      '',
      CLOSE_OUT_START,
      CLOSE_OUT_END,
      '',
    ].join('\n');
    await writeFile(sessionPath, stub, 'utf8');
  }

  const existing = await readFile(sessionPath, 'utf8');
  const block = renderCloseOut(ctx);
  const replaced = replaceCloseOutBlock(existing, block);
  await writeFile(sessionPath, replaced, 'utf8');
}

function replaceCloseOutBlock(file: string, newBlock: string): string {
  // ES2017-safe: no /s flag — use [\s\S]*? for cross-line non-greedy match.
  const re = new RegExp(
    `${escapeRegex(CLOSE_OUT_START)}[\\s\\S]*?${escapeRegex(CLOSE_OUT_END)}`,
  );
  if (re.test(file)) {
    return file.replace(re, `${CLOSE_OUT_START}\n${newBlock}\n${CLOSE_OUT_END}`);
  }
  // No sentinels in the existing file — append the block at the end.
  const sep = file.endsWith('\n') ? '' : '\n';
  return `${file}${sep}\n${CLOSE_OUT_START}\n${newBlock}\n${CLOSE_OUT_END}\n`;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderCloseOut(ctx: SessionNoteCloseOutCtx): string {
  const lines: string[] = [];
  lines.push('## Close-out');
  lines.push('');
  lines.push(`**Session:** ${ctx.session}`);
  lines.push(`**Module:** \`${ctx.spec.kindlingId}\` (\`${ctx.spec.packRef}\`)`);
  lines.push(`**Mode:** build${ctx.dryRun ? ' (dry-run)' : ''}`);
  lines.push('');

  lines.push('### Created');
  if (ctx.created.length === 0) lines.push('- (none)');
  else for (const c of ctx.created) lines.push(`- **${c.type}**: \`${c.id}\` — ${c.title}`);
  lines.push('');

  lines.push('### Skipped');
  if (ctx.skipped.length === 0) lines.push('- (none)');
  else for (const s of ctx.skipped) lines.push(`- **${s.type}**: \`${s.id}\` — ${s.reason}`);
  lines.push('');

  lines.push('### Hard fails');
  if (ctx.hardFailures.length === 0) lines.push('- (none — clean run)');
  else for (const h of ctx.hardFailures) lines.push(`- \`${h.id}\` — ${h.criteria.join(', ')}`);
  lines.push('');

  lines.push('### Soft warnings');
  if (ctx.softWarnings.length === 0) lines.push('- (none)');
  else for (const w of ctx.softWarnings) lines.push(`- \`${w.id}\` — ${w.criteria.join(', ')}`);
  lines.push('');

  if (ctx.overlapWarnings && ctx.overlapWarnings.length > 0) {
    lines.push('### Overlap warnings');
    for (const o of ctx.overlapWarnings) {
      lines.push(`- Near-duplicate of \`${o.kindlingId}\` (Jaccard ${o.jaccard.toFixed(2)})`);
    }
    lines.push('');
  }

  lines.push('### [NEEDED] flags raised');
  if (ctx.neededFlagged.length === 0) lines.push('- (none)');
  else
    for (const n of ctx.neededFlagged)
      lines.push(`- \`${n.deterministicId}\` (${n.scope}) — ${n.raw}`);
  lines.push('');

  lines.push('### Derived artifacts');
  if (ctx.derivedArtifactsError) {
    lines.push(`- regen failed: ${ctx.derivedArtifactsError}`);
    lines.push('  _(content_constructed event was NOT reversed — failure is logged but isolated.)_');
  } else if (ctx.derivedArtifacts) {
    lines.push(`- status board: \`${ctx.derivedArtifacts.statusBoardPath}\``);
    lines.push(`- heatmap: \`${ctx.derivedArtifacts.heatmapPath}\``);
    lines.push(`- per-module YAML: \`${ctx.derivedArtifacts.yamlPath}\``);
  } else {
    lines.push('- (skipped — dry run, or content_constructed did not fire)');
  }
  return lines.join('\n');
}

// ─── Path resolution ────────────────────────────────────────────────────────

/**
 * Resolve the absolute path for a session note. Lives at
 * `<kindling root>/design/sessions/<session>.md`.
 *
 * The kindling root is two levels up from this file
 * (`library/build-mode/session-note.ts` → `library/build-mode/` → `library/` → root).
 */
function sessionNotePathFor(session: string): string {
  return resolve(__dirname, '..', '..', 'design', 'sessions', `${session}.md`);
}
