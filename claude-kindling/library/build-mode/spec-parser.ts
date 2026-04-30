/**
 * Spec parser — turns a per-module spec markdown doc into a structured object.
 *
 * The spec template lives at `design/specs/modules/_module-spec-template.md` and a real
 * example at `design/specs/modules/module-1-1-looking-closely.md`.
 *
 * This parser is deliberately tolerant: spec docs in the wild are partly hand-edited and
 * carry [LOCKED] / [SUGGESTION] / [GAP] markers, narrative prose, and tables. We extract
 * the fields the orchestrator needs (kindlingId, pack ref, status, four pillars, approach
 * lineup) and leave everything else as raw section text for the orchestrator to display
 * back to Drew if it needs prompting.
 *
 * If a section is missing or unparseable, the parser returns `null` / `[]` for that field
 * and the orchestrator decides how to react. The parser does NOT enforce the bucket gate —
 * that's the orchestrator's job, after consulting the register.
 */

import { readFile } from 'node:fs/promises';

export type Modality =
  | 'kinesthetic'
  | 'visual'
  | 'auditory'
  | 'narrative'
  | 'social'
  | 'exploratory';

export type Texture = 'kit' | 'chunk' | 'loose-piece';

export interface ApproachSpec {
  index: number;                  // 1-based
  title: string;                  // e.g. "Outdoor observation kit"
  modality: Modality | null;
  angle: string | null;           // The locked teaching angle
  texture: Texture | null;
  activityCount: number | null;   // Spec's suggested activity count for this approach
  durationLabel: string | null;   // Free-form duration string from the spec
}

export interface ResourceRef {
  deterministicId: string;        // e.g. "template:investigation-journal"
  scope: 'pack-level' | 'module-specific' | 'unknown';
  status: 'NEEDED' | 'published' | 'draft' | 'unknown';
  productionOwner?: string;
  raw: string;                    // The original table row, for surfacing
}

export interface ModuleSpec {
  filePath: string;
  // Header
  kindlingId: string;             // e.g. "module.1.1.looking-closely"
  packRef: string;                // e.g. "pack.1.backyard-scientist"
  packTitle: string | null;
  status: string | null;          // raw status string from frontmatter (may be aspirational)
  lastRevised: string | null;
  specSession: string | null;
  // Pillars confirmed checklist (from the bottom of the spec)
  pillarsConfirmed: {
    understanding: boolean;
    hours: boolean;
    topicCoverage: boolean;
    resources: boolean;
  };
  // Glance section
  subjects: string[];             // raw subject tokens
  ageRange: { min: number; max: number } | null;
  approachCount: number | null;
  worldview: string | null;
  // Pillar 1
  targetUnderstanding: string | null;
  understandingIndicators: {
    emerging: string[];
    developing: string[];
    demonstrating: string[];
  };
  // Pillar 2
  durationActiveLabel: string | null;
  durationOverheadLabel: string | null;
  // Pillar 3
  acCodes: string[];              // free-form list of AC code strings
  capabilityThreads: {
    label: string;
    domain: string;
    primary: boolean;
    tier: string | null;
  }[];
  // Pillar 4 — every resource referenced anywhere in the spec
  resources: ResourceRef[];
  // Approach lineup
  approaches: ApproachSpec[];
  // Misc — preserved as raw text for orchestrator surfacing if needed
  rawByHeading: Record<string, string>;
}

// ─── Top-level entry ─────────────────────────────────────────────────────────

export async function parseModuleSpec(filePath: string): Promise<ModuleSpec> {
  const raw = await readFile(filePath, 'utf8');
  return parseModuleSpecText(raw, filePath);
}

export function parseModuleSpecText(text: string, filePath = '<inline>'): ModuleSpec {
  const headings = splitByHeadings(text);
  const header = parseHeader(text);
  const glance = parseGlance(headings['Module at a glance'] ?? '');
  const pillar1 = parsePillar1(headings);
  const pillar2 = parsePillar2(headings);
  const pillar3 = parsePillar3(headings);
  const pillar4 = parsePillar4(headings, text);
  const approaches = parseApproaches(headings, text);
  const pillarsConfirmed = parsePillarsConfirmed(headings['Pillars confirmed checklist'] ?? '');

  return {
    filePath,
    kindlingId: header.kindlingId,
    packRef: header.packRef,
    packTitle: header.packTitle,
    status: header.status,
    lastRevised: header.lastRevised,
    specSession: header.specSession,
    pillarsConfirmed,
    subjects: glance.subjects,
    ageRange: glance.ageRange,
    approachCount: glance.approachCount,
    worldview: glance.worldview,
    targetUnderstanding: pillar1.targetUnderstanding,
    understandingIndicators: pillar1.indicators,
    durationActiveLabel: pillar2.activeLabel,
    durationOverheadLabel: pillar2.overheadLabel,
    acCodes: pillar3.acCodes,
    capabilityThreads: pillar3.threads,
    resources: pillar4,
    approaches,
    rawByHeading: headings,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Split markdown into a map of `heading text → body`. Uses level-2 and level-3 headings.
 * Level-3 headings are stored both standalone AND as `parentH2 > h3` joined keys, so
 * callers can fetch by either name.
 */
function splitByHeadings(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lines = text.split('\n');
  let currentH2: string | null = null;
  let currentH3: string | null = null;
  let buf: string[] = [];
  const flush = () => {
    if (currentH3) {
      const key = `${currentH2 ?? ''} > ${currentH3}`;
      out[key] = (out[key] ?? '') + buf.join('\n');
      out[currentH3] = (out[currentH3] ?? '') + buf.join('\n');
    } else if (currentH2) {
      out[currentH2] = (out[currentH2] ?? '') + buf.join('\n');
    }
    buf = [];
  };
  for (const line of lines) {
    const h2 = /^##\s+(.+?)\s*$/.exec(line);
    const h3 = /^###\s+(.+?)\s*$/.exec(line);
    if (h2) {
      flush();
      currentH2 = h2[1].trim();
      currentH3 = null;
      continue;
    }
    if (h3) {
      flush();
      currentH3 = h3[1].trim();
      continue;
    }
    buf.push(line);
  }
  flush();
  return out;
}

interface HeaderInfo {
  kindlingId: string;
  packRef: string;
  packTitle: string | null;
  status: string | null;
  lastRevised: string | null;
  specSession: string | null;
}

function parseHeader(text: string): HeaderInfo {
  const id = /\*\*kindlingId:\*\*\s*`([^`]+)`/i.exec(text);
  const pack = /\*\*Pack:\*\*\s*`([^`]+)`(?:\s*\(([^)]+)\))?/i.exec(text);
  const status = /\*\*Status:\*\*\s*([^\n]+)/i.exec(text);
  const revised = /\*\*Last revised:\*\*\s*([^\n]+)/i.exec(text);
  const session = /\*\*Spec authored by:\*\*\s*([^\n]+)/i.exec(text);
  return {
    kindlingId: id ? id[1] : '',
    packRef: pack ? pack[1] : '',
    packTitle: pack && pack[2] ? pack[2].trim() : null,
    status: status ? status[1].trim() : null,
    lastRevised: revised ? revised[1].trim() : null,
    specSession: session ? session[1].trim() : null,
  };
}

interface GlanceInfo {
  subjects: string[];
  ageRange: { min: number; max: number } | null;
  approachCount: number | null;
  worldview: string | null;
}

function parseGlance(body: string): GlanceInfo {
  const subjectsLine = /\*\*Subjects:\*\*\s*([^\n]+)/i.exec(body);
  const ageLine = /\*\*Age range:\*\*\s*([^\n]+)/i.exec(body);
  const approachLine = /\*\*Approach count:\*\*\s*([0-9]+)/i.exec(body);
  const worldviewLine = /\*\*Worldview alignment:\*\*\s*([^\n]+)/i.exec(body);

  const subjects: string[] = [];
  if (subjectsLine) {
    for (const tok of subjectsLine[1].split(/[,;]/)) {
      const cleaned = tok.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();
      const word = cleaned.split(/\s+/)[0].replace(/\*+/g, '');
      if (word && /^[a-z]+$/.test(word)) subjects.push(word);
    }
  }

  let ageRange: { min: number; max: number } | null = null;
  if (ageLine) {
    const m = /(\d+)\s*[-–—]\s*(\d+)/.exec(ageLine[1]);
    if (m) ageRange = { min: parseInt(m[1], 10), max: parseInt(m[2], 10) };
  }

  return {
    subjects,
    ageRange,
    approachCount: approachLine ? parseInt(approachLine[1], 10) : null,
    worldview: worldviewLine ? worldviewLine[1].trim() : null,
  };
}

interface Pillar1 {
  targetUnderstanding: string | null;
  indicators: {
    emerging: string[];
    developing: string[];
    demonstrating: string[];
  };
}

function parsePillar1(headings: Record<string, string>): Pillar1 {
  const body = findHeading(headings, /^Pillar 1:.*Understanding goal/i) ?? '';
  let target: string | null = null;
  const targetSection = findHeading(headings, /^Target understanding/i) ?? body;
  const tuMatch = /^>\s+([\s\S]+?)(?:\n\n|\n##|\n###|$)/m.exec(targetSection);
  if (tuMatch) {
    target = tuMatch[1].replace(/\n>\s*/g, ' ').trim();
  }

  const emerging = extractIndicatorList(body, 'Emerging');
  const developing = extractIndicatorList(body, 'Developing');
  const demonstrating = extractIndicatorList(body, 'Demonstrating');
  return { targetUnderstanding: target, indicators: { emerging, developing, demonstrating } };
}

function extractIndicatorList(body: string, tier: string): string[] {
  const re = new RegExp(`\\*\\*${tier}\\*\\*[^\\n]*\\n([\\s\\S]*?)(?:\\n\\*\\*[A-Z][a-z]+\\*\\*|\\n##|\\n###|$)`, 'i');
  const m = re.exec(body);
  if (!m) return [];
  return m[1]
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('-'))
    .map((l) => l.replace(/^-\s*/, '').trim())
    .filter(Boolean);
}

interface Pillar2 {
  activeLabel: string | null;
  overheadLabel: string | null;
}

function parsePillar2(headings: Record<string, string>): Pillar2 {
  const body = findHeading(headings, /^Pillar 2:.*Expected hours/i) ?? '';
  const active = /\*\*Active total:\*\*\s*([^\n]+)/i.exec(body);
  const overhead = /\*\*With setup\/cleanup:\*\*\s*([^\n]+)/i.exec(body);
  return {
    activeLabel: active ? active[1].trim() : null,
    overheadLabel: overhead ? overhead[1].trim() : null,
  };
}

interface Pillar3 {
  acCodes: string[];
  threads: {
    label: string;
    domain: string;
    primary: boolean;
    tier: string | null;
  }[];
}

function parsePillar3(headings: Record<string, string>): Pillar3 {
  const body = findHeading(headings, /^Pillar 3:.*Topic coverage/i) ?? '';
  const codeMatches = body.match(/\b(AC\d?[A-Z][A-Z0-9]+)\b/g) ?? [];
  const acCodes = Array.from(new Set(codeMatches));

  const threads: Pillar3['threads'] = [];
  const lines = body.split('\n');
  let inTable = false;
  for (const line of lines) {
    if (/^\|.*Thread.*Domain.*Primary.*Tier/i.test(line)) {
      inTable = true;
      continue;
    }
    if (inTable && /^\|\s*[-:]+\s*\|/.test(line)) continue;
    if (inTable) {
      if (!line.trim().startsWith('|')) {
        inTable = false;
        continue;
      }
      const cells = line.split('|').map((c) => c.trim()).filter((c, i, arr) => i > 0 && i < arr.length - 1);
      if (cells.length >= 3) {
        const label = cells[0].replace(/\*\*/g, '').trim();
        if (!label) continue;
        const domain = cells[1].trim();
        const primaryCell = cells[2].toLowerCase();
        const tier = cells[3]?.trim() || null;
        threads.push({
          label,
          domain,
          primary: primaryCell.includes('primary') && !primaryCell.includes('secondary'),
          tier: tier === '—' || tier === '-' ? null : tier,
        });
      }
    }
  }
  return { acCodes, threads };
}

/**
 * Pillar 4 is messy: resources show up under `### Approach 1` / `### Approach 2` headings
 * AND in a dedicated `### `[NEEDED]` summary` table at the bottom. We harvest from
 * everywhere — the union of deterministic IDs found.
 */
function parsePillar4(headings: Record<string, string>, fullText: string): ResourceRef[] {
  const out = new Map<string, ResourceRef>();
  const detIdRe = /`([a-z]+(?:\.[a-z0-9-]+)+|[a-z]+:[a-z0-9-]+)`/g;
  // First: harvest from the `[NEEDED]` summary table.
  const summaryHeading = findHeading(headings, /\[NEEDED\] summary/i) ?? '';
  if (summaryHeading) {
    for (const line of summaryHeading.split('\n')) {
      if (!line.trim().startsWith('|')) continue;
      const cells = line.split('|').map((c) => c.trim()).filter((c, i, arr) => i > 0 && i < arr.length - 1);
      if (cells.length < 3) continue;
      const idMatch = /`([^`]+)`/.exec(cells[0]);
      if (!idMatch) continue;
      const id = idMatch[1];
      const scopeCell = (cells[1] ?? '').toLowerCase();
      const statusCell = (cells[2] ?? '').toLowerCase();
      let scope: ResourceRef['scope'] = 'unknown';
      if (scopeCell.includes('pack-level')) scope = 'pack-level';
      else if (scopeCell.includes('module')) scope = 'module-specific';
      let status: ResourceRef['status'] = 'unknown';
      if (statusCell.includes('needed') || statusCell.includes('[needed]')) status = 'NEEDED';
      else if (statusCell.includes('published')) status = 'published';
      else if (statusCell.includes('draft')) status = 'draft';
      out.set(id, {
        deterministicId: id,
        scope,
        status,
        productionOwner: cells[3] ?? undefined,
        raw: line,
      });
    }
  }
  // Then: scan the full text for any deterministic IDs we missed; default to NEEDED.
  let m: RegExpExecArray | null;
  detIdRe.lastIndex = 0;
  while ((m = detIdRe.exec(fullText)) !== null) {
    const id = m[1];
    if (!isResourceId(id)) continue;
    if (!out.has(id)) {
      out.set(id, {
        deterministicId: id,
        scope: 'unknown',
        status: 'NEEDED',
        raw: id,
      });
    }
  }
  return Array.from(out.values());
}

function isResourceId(id: string): boolean {
  if (/^(template|image|reference|audio|worksheet|card_set|handout|manipulative):[a-z0-9-]+$/.test(id)) return true;
  if (/^commons\.[a-z0-9-]+\.[a-z0-9-]+/.test(id)) return true;
  if (/^text\.pack-\d+\.module-\d+-\d+\./.test(id)) return true;
  return false;
}

function parseApproaches(
  headings: Record<string, string>,
  fullText: string,
): ApproachSpec[] {
  const out: ApproachSpec[] = [];
  const lineupBody = findHeading(headings, /^Approach lineup/i) ?? '';
  const search = lineupBody || fullText;
  const re = /###\s+Approach\s+(\d+)\s*[—–-]\s*([^\n*[\]]+)(?:\s*\*\*\[[A-Z]+[^\]]*\]\*\*)?/g;
  let m: RegExpExecArray | null;
  const positions: { index: number; title: string; pos: number }[] = [];
  while ((m = re.exec(search)) !== null) {
    positions.push({ index: parseInt(m[1], 10), title: m[2].trim(), pos: m.index });
  }
  positions.sort((a, b) => a.pos - b.pos);
  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].pos;
    const end = i + 1 < positions.length ? positions[i + 1].pos : search.length;
    const body = search.slice(start, end);
    const modality = matchEnum<Modality>(body, /\*\*Modality:\*\*\s*([a-z-]+)/i, [
      'kinesthetic',
      'visual',
      'auditory',
      'narrative',
      'social',
      'exploratory',
    ]);
    const angle = /\*\*Angle:\*\*\s*([\s\S]+?)(?:\n\s*-\s*\*\*[A-Z]|\n###|\n##|$)/i.exec(body)?.[1]?.trim() ?? null;
    const textureRaw = /\*\*Texture:\*\*\s*([a-z- ]+)/i.exec(body)?.[1]?.trim().toLowerCase() ?? null;
    let texture: Texture | null = null;
    if (textureRaw) {
      if (textureRaw.startsWith('kit')) texture = 'kit';
      else if (textureRaw.startsWith('chunk')) texture = 'chunk';
      else if (textureRaw.startsWith('loose')) texture = 'loose-piece';
    }
    const countMatch = /\*\*Activity count:\*\*[^\d\n]*([0-9]+)/i.exec(body);
    const durationMatch = /\*\*Approximate duration:\*\*\s*([^\n]+)/i.exec(body);
    out.push({
      index: positions[i].index,
      title: positions[i].title.replace(/\s+\(.*?\)\s*$/, '').trim(),
      modality,
      angle,
      texture,
      activityCount: countMatch ? parseInt(countMatch[1], 10) : null,
      durationLabel: durationMatch ? durationMatch[1].trim() : null,
    });
  }
  return out.sort((a, b) => a.index - b.index);
}

function matchEnum<T extends string>(body: string, re: RegExp, allowed: T[]): T | null {
  const m = re.exec(body);
  if (!m) return null;
  const value = m[1].trim().toLowerCase();
  for (const v of allowed) {
    if (value.startsWith(v as string)) return v;
  }
  return null;
}

function parsePillarsConfirmed(body: string): ModuleSpec['pillarsConfirmed'] {
  const fn = (label: string) => {
    const re = new RegExp(`-\\s*\\[([ xX])\\]\\s*\\*\\*Pillar.*?${label}`, 'i');
    const m = re.exec(body);
    return m ? m[1].toLowerCase() === 'x' : false;
  };
  return {
    understanding: fn('Understanding'),
    hours: fn('Expected hours'),
    topicCoverage: fn('Topic coverage'),
    resources: fn('Resource list'),
  };
}

function findHeading(headings: Record<string, string>, re: RegExp): string | null {
  for (const [key, value] of Object.entries(headings)) {
    if (re.test(key)) return value;
  }
  return null;
}
