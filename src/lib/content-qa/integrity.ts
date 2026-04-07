import type { DocType, QAIssue, PackTree } from './types';

// ─── Helpers ───

function allDocIds(tree: PackTree): Set<string> {
  const ids = new Set<string>();
  if (tree.pack?._id) ids.add(tree.pack._id);
  for (const m of tree.modules) if (m._id) ids.add(m._id);
  for (const a of tree.approaches) if (a._id) ids.add(a._id);
  for (const act of tree.activities) if (act._id) ids.add(act._id);
  for (const b of tree.badges) if (b._id) ids.add(b._id);
  return ids;
}

function collectRefs(obj: unknown, refs: Array<{ ref: string; path: string }>, currentPath = ''): void {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => collectRefs(item, refs, `${currentPath}[${i}]`));
    return;
  }
  const record = obj as Record<string, unknown>;
  if ('_ref' in record && typeof record._ref === 'string') {
    refs.push({ ref: record._ref, path: currentPath });
    return;
  }
  for (const [key, val] of Object.entries(record)) {
    if (key.startsWith('_')) continue;
    collectRefs(val, refs, currentPath ? `${currentPath}.${key}` : key);
  }
}

function refOf(v: unknown): string | null {
  if (!v || typeof v !== 'object') return null;
  const r = (v as any)._ref;
  return typeof r === 'string' ? r : null;
}

function docIssue(
  docType: DocType,
  docId: string,
  field: string,
  message: string,
  severity: 'error' | 'warning' = 'error'
): QAIssue {
  return { docType, docId, field, severity, message, path: field.split('.') };
}

// ─── Broken refs ───

export function checkBrokenRefs(tree: PackTree): QAIssue[] {
  const knownIds = allDocIds(tree);
  const issues: QAIssue[] = [];

  function scanDoc(doc: any, docType: DocType): void {
    if (!doc) return;
    const docId: string = doc._id ?? doc._key ?? 'unknown';
    const refs: Array<{ ref: string; path: string }> = [];
    collectRefs(doc, refs);
    for (const { ref, path } of refs) {
      if (!knownIds.has(ref)) {
        issues.push(docIssue(docType, docId, path, `Broken reference: _ref "${ref}" points to a document not found in the pack tree`));
      }
    }
  }

  scanDoc(tree.pack, 'pack');
  for (const m of tree.modules) scanDoc(m, 'module');
  for (const a of tree.approaches) scanDoc(a, 'approach');
  for (const act of tree.activities) scanDoc(act, 'activity');
  for (const b of tree.badges) scanDoc(b, 'badge');

  return issues;
}

// ─── Orphans ───

export function checkOrphans(tree: PackTree): QAIssue[] {
  const issues: QAIssue[] = [];
  const packId: string = tree.pack?._id;
  const moduleIds = new Set(tree.modules.map((m: any) => m._id).filter(Boolean));
  const approachIds = new Set(tree.approaches.map((a: any) => a._id).filter(Boolean));

  for (const approach of tree.approaches) {
    const docId: string = approach._id ?? 'unknown';
    const moduleRef = refOf(approach.module);
    if (!moduleRef || !moduleIds.has(moduleRef)) {
      issues.push(docIssue('approach', docId, 'module', `Orphan approach: module ref "${moduleRef}" not found in pack`));
    }
  }

  for (const activity of tree.activities) {
    const docId: string = activity._id ?? 'unknown';
    const approachRef = refOf(activity.approach);
    if (!approachRef || !approachIds.has(approachRef)) {
      issues.push(docIssue('activity', docId, 'approach', `Orphan activity: approach ref "${approachRef}" not found in pack`));
    }
  }

  for (const badge of tree.badges) {
    const docId: string = badge._id ?? 'unknown';
    const packRef = refOf(badge.pack);
    if (!packRef || packRef !== packId) {
      issues.push(docIssue('badge', docId, 'pack', `Orphan badge: pack ref "${packRef}" does not match pack "${packId}"`));
    }
  }

  return issues;
}

// ─── Duplicate slugs ───

export function checkDuplicateSlugs(tree: PackTree): QAIssue[] {
  const issues: QAIssue[] = [];

  function findDuplicates(docs: any[], docType: DocType): void {
    const seen = new Map<string, string>();
    for (const doc of docs) {
      const slug: string | undefined = doc?.slug?.current;
      const docId: string = doc._id ?? 'unknown';
      if (!slug) continue;
      if (seen.has(slug)) {
        issues.push(docIssue(docType, docId, 'slug.current', `Duplicate slug "${slug}" — also used by doc "${seen.get(slug)}"`));
      } else {
        seen.set(slug, docId);
      }
    }
  }

  findDuplicates(tree.modules, 'module');
  findDuplicates(tree.approaches, 'approach');
  findDuplicates(tree.activities, 'activity');
  findDuplicates(tree.badges, 'badge');

  return issues;
}

// ─── Pack count drift ───

export function checkCountDrift(tree: PackTree): QAIssue[] {
  const issues: QAIssue[] = [];
  const pack = tree.pack;
  if (!pack) return issues;

  const packId: string = pack._id ?? 'unknown';
  const actualModuleCount = tree.modules.length;
  const actualActivityCount = tree.activities.length;

  if (
    typeof pack.moduleCount === 'number' &&
    pack.moduleCount !== actualModuleCount
  ) {
    issues.push(
      docIssue(
        'pack',
        packId,
        'moduleCount',
        `Count drift: pack.moduleCount is ${pack.moduleCount} but actual module count is ${actualModuleCount}`,
        'warning'
      )
    );
  }

  if (
    typeof pack.totalActivities === 'number' &&
    pack.totalActivities !== actualActivityCount
  ) {
    issues.push(
      docIssue(
        'pack',
        packId,
        'totalActivities',
        `Count drift: pack.totalActivities is ${pack.totalActivities} but actual activity count is ${actualActivityCount}`,
        'warning'
      )
    );
  }

  return issues;
}
