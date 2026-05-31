import { sanityClient } from '@/lib/sanity/client';
import { fetchPackTree, mergeWithDrafts } from './tree';
import { checkDocument } from './rules';
import { checkBrokenRefs, checkOrphans, checkDuplicateSlugs, checkCountDrift } from './integrity';
import { getCached, setCached } from './cache';
import type { DocType, QAIssue, PackTree, SanityDoc } from './types';

function refValue(v: unknown): string | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const ref = (v as Record<string, unknown>)._ref;
  return typeof ref === 'string' ? ref : undefined;
}

// ─── Types returned by QA runs ───

export interface PackSummary {
  id: string;
  title: string;
  slug: string;
  status: string;
  moduleCount: number;
  activityCount: number;
  completeness: number;
  errorCount: number;
  warningCount: number;
  updatedAt: string | null;
}

export interface TreeNode {
  docType: DocType;
  docId: string;
  title: string;
  completeness: number;
  errors: QAIssue[];
  warnings: QAIssue[];
  children: TreeNode[];
}

export interface PackDetail {
  pack: PackSummary;
  tree: TreeNode[];
  issues: QAIssue[];
  readinessState: 'NOT_READY' | 'READY_WITH_WARNINGS' | 'READY';
}

export type QAIssueFlat = QAIssue & {
  packId: string;
  packTitle: string;
  docTitle: string;
  foundAt: string;
};

// ─── All packs query ───
// SANITY-GATING EXEMPT: this module powers the admin QA dashboard, which
// MUST see drafts. Consumers are restricted to /api/admin/qa/* routes.
// See src/lib/sanity/queries.ts header for the invariant.

const ALL_PACKS_QUERY = /* groq */ `
*[_type == "pack"] | order(_updatedAt desc) {
  _id, title, "slug": slug.current, status, _updatedAt,
  "moduleCount": count(modules),
  "modules": modules[]->{
    _id,
    "approaches": approaches[]->{
      _id,
      "activities": activities[]->{ _id }
    }
  }
}
`;

// ─── Fetch all packs with completeness ───

export async function fetchAllPackSummaries(): Promise<PackSummary[]> {
  const cached = getCached<PackSummary[]>('qa:packs');
  if (cached) return cached;

  const packs = await sanityClient.fetch(ALL_PACKS_QUERY);
  const summaries: PackSummary[] = [];

  for (const pack of packs) {
    const tree = await fetchPackTree(pack._id);
    const merged = await mergeWithDrafts(tree);
    const result = runFullCheck(merged);

    const activityCount = ((pack.modules ?? []) as SanityDoc[]).reduce(
      (sum: number, m: SanityDoc) =>
        sum +
        ((m.approaches ?? []) as SanityDoc[]).reduce(
          (s: number, a: SanityDoc) => s + ((a.activities as unknown[] | undefined)?.length ?? 0),
          0
        ),
      0
    );

    summaries.push({
      id: pack._id,
      title: pack.title ?? 'Untitled',
      slug: pack.slug ?? '',
      status: pack.status ?? 'draft',
      moduleCount: pack.moduleCount ?? 0,
      activityCount,
      completeness: result.completeness,
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
      updatedAt: pack._updatedAt ?? null,
    });
  }

  // Sort by completeness ASC (least complete first)
  summaries.sort((a, b) => a.completeness - b.completeness);
  setCached('qa:packs', summaries);
  return summaries;
}

// ─── Fetch single pack detail with tree ───

export async function fetchPackDetail(packId: string): Promise<PackDetail | null> {
  const cached = getCached<PackDetail>(`qa:pack:${packId}`);
  if (cached) return cached;

  const rawTree = await fetchPackTree(packId);
  if (!rawTree.pack) return null;

  const merged = await mergeWithDrafts(rawTree);
  const allIssues = runFullCheck(merged);

  // Build tree structure
  const packCheck = checkDocument(merged.pack!, 'pack');
  const treeNodes: TreeNode[] = [];

  const pack = merged.pack!;

  treeNodes.push({
    docType: 'pack',
    docId: pack._id,
    title: pack.title ?? 'Untitled Pack',
    completeness: packCheck.completeness,
    errors: packCheck.errors,
    warnings: packCheck.warnings,
    children: [],
  });

  // Modules
  for (const mod of merged.modules) {
    const modCheck = checkDocument(mod, 'module');
    const modNode: TreeNode = {
      docType: 'module',
      docId: mod._id ?? 'unknown',
      title: mod.title ?? 'Untitled Module',
      completeness: modCheck.completeness,
      errors: modCheck.errors,
      warnings: modCheck.warnings,
      children: [],
    };

    // Approaches under this module
    const modApproaches = merged.approaches.filter(
      (a) => refValue(a.module) === mod._id
    );

    for (const approach of modApproaches) {
      const approachCheck = checkDocument(approach, 'approach');
      const approachNode: TreeNode = {
        docType: 'approach',
        docId: approach._id ?? 'unknown',
        title: approach.title ?? 'Untitled Approach',
        completeness: approachCheck.completeness,
        errors: approachCheck.errors,
        warnings: approachCheck.warnings,
        children: [],
      };

      // Activities under this approach
      const approachActivities = merged.activities.filter(
        (act) => refValue(act.approach) === approach._id
      );

      for (const activity of approachActivities) {
        const actCheck = checkDocument(activity, 'activity');
        approachNode.children.push({
          docType: 'activity',
          docId: activity._id ?? 'unknown',
          title: activity.title ?? 'Untitled Activity',
          completeness: actCheck.completeness,
          errors: actCheck.errors,
          warnings: actCheck.warnings,
          children: [],
        });
      }

      modNode.children.push(approachNode);
    }

    treeNodes.push(modNode);
  }

  // Badges
  for (const badge of merged.badges) {
    const badgeCheck = checkDocument(badge, 'badge');
    treeNodes.push({
      docType: 'badge',
      docId: badge._id ?? 'unknown',
      title: badge.title ?? 'Untitled Badge',
      completeness: badgeCheck.completeness,
      errors: badgeCheck.errors,
      warnings: badgeCheck.warnings,
      children: [],
    });
  }

  // Aggregate completeness across all docs
  const allDocs: Array<{ doc: SanityDoc; type: DocType }> = [
    ...(merged.pack ? [{ doc: merged.pack, type: 'pack' as DocType }] : []),
    ...merged.modules.map((m) => ({ doc: m, type: 'module' as DocType })),
    ...merged.approaches.map((a) => ({ doc: a, type: 'approach' as DocType })),
    ...merged.activities.map((a) => ({ doc: a, type: 'activity' as DocType })),
    ...merged.badges.map((b) => ({ doc: b, type: 'badge' as DocType })),
  ];

  let totalCompleteness = 0;
  for (const { doc, type } of allDocs) {
    totalCompleteness += checkDocument(doc, type).completeness;
  }
  const avgCompleteness = allDocs.length > 0 ? Math.round(totalCompleteness / allDocs.length) : 0;

  const readinessState: PackDetail['readinessState'] =
    allIssues.errors.length > 0
      ? 'NOT_READY'
      : allIssues.warnings.length > 0
        ? 'READY_WITH_WARNINGS'
        : 'READY';

  const detail: PackDetail = {
    pack: {
      id: pack._id,
      title: pack.title ?? 'Untitled',
      slug: pack.slug?.current ?? '',
      status: (pack.status as string) ?? 'draft',
      moduleCount: merged.modules.length,
      activityCount: merged.activities.length,
      completeness: avgCompleteness,
      errorCount: allIssues.errors.length,
      warningCount: allIssues.warnings.length,
      updatedAt: pack._updatedAt ?? null,
    },
    tree: treeNodes,
    issues: [...allIssues.errors, ...allIssues.warnings],
    readinessState,
  };

  setCached(`qa:pack:${packId}`, detail);
  return detail;
}

// ─── Fetch all issues across all packs ───

export async function fetchAllIssues(): Promise<QAIssueFlat[]> {
  const cached = getCached<QAIssueFlat[]>('qa:issues');
  if (cached) return cached;

  const packs = await sanityClient.fetch(ALL_PACKS_QUERY);
  const allIssues: QAIssueFlat[] = [];
  const now = new Date().toISOString();

  for (const pack of packs) {
    const rawTree = await fetchPackTree(pack._id);
    const merged = await mergeWithDrafts(rawTree);
    const result = runFullCheck(merged);
    const allDocs = buildDocMap(merged);

    for (const issue of [...result.errors, ...result.warnings]) {
      allIssues.push({
        ...issue,
        packId: pack._id,
        packTitle: pack.title ?? 'Untitled',
        docTitle: allDocs.get(issue.docId) ?? issue.docId,
        foundAt: now,
      });
    }
  }

  setCached('qa:issues', allIssues);
  return allIssues;
}

// ─── Internal helpers ───

function runFullCheck(tree: PackTree): { completeness: number; errors: QAIssue[]; warnings: QAIssue[] } {
  const errors: QAIssue[] = [];
  const warnings: QAIssue[] = [];

  // Field completeness checks
  const allDocs: Array<{ doc: SanityDoc; type: DocType }> = [
    ...(tree.pack ? [{ doc: tree.pack, type: 'pack' as DocType }] : []),
    ...tree.modules.map((m) => ({ doc: m, type: 'module' as DocType })),
    ...tree.approaches.map((a) => ({ doc: a, type: 'approach' as DocType })),
    ...tree.activities.map((a) => ({ doc: a, type: 'activity' as DocType })),
    ...tree.badges.map((b) => ({ doc: b, type: 'badge' as DocType })),
  ];

  let totalCompleteness = 0;
  for (const { doc, type } of allDocs) {
    const result = checkDocument(doc, type);
    totalCompleteness += result.completeness;
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  // Integrity checks
  errors.push(...checkBrokenRefs(tree));
  errors.push(...checkOrphans(tree));
  warnings.push(...checkDuplicateSlugs(tree));
  warnings.push(...checkCountDrift(tree));

  const completeness = allDocs.length > 0 ? Math.round(totalCompleteness / allDocs.length) : 0;
  return { completeness, errors, warnings };
}

function buildDocMap(tree: PackTree): Map<string, string> {
  const map = new Map<string, string>();
  if (tree.pack?._id) map.set(tree.pack._id, tree.pack.title ?? 'Pack');
  for (const m of tree.modules) if (m._id) map.set(m._id, m.title ?? 'Module');
  for (const a of tree.approaches) if (a._id) map.set(a._id, a.title ?? 'Approach');
  for (const act of tree.activities) if (act._id) map.set(act._id, act.title ?? 'Activity');
  for (const b of tree.badges) if (b._id) map.set(b._id, b.title ?? 'Badge');
  return map;
}
