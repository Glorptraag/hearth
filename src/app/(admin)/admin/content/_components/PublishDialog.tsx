'use client';

import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import {
  packPublishSchema,
  workbenchContentFlags,
  workbenchIdResolutionFlags,
  type WorkbenchFlag,
} from '@/lib/content-studio/validation';
import type { PackDraft } from '@/lib/content-studio/types';
import { CheckCircle, WarningCircle, X } from '@/components/icons';

interface PublishResult {
  packId: string;
  moduleIds: string[];
  badgeIds: string[];
  workbenchFlags: WorkbenchFlag[];
}

interface PublishDialogProps {
  open: boolean;
  pack: PackDraft | null;
  packIndex: number;
  draftId: string | null;
  onClose: () => void;
  onSaveNow: () => Promise<boolean>;
  onPublished: (result: PublishResult) => void;
}

// Breadcrumb labels for the array-index segments of a Zod issue path.
const CONTAINER_LABELS: Record<string, string> = {
  modules: 'Module',
  approaches: 'Approach',
  activities: 'Activity',
  badges: 'Badge',
  materials: 'Material',
  workbenches: 'Workbench',
  furtherReading: 'Further reading',
  keyPoints: 'Key point',
};

interface ReadableIssue {
  location: string;
  field: string;
  message: string;
}

export function humaniseField(field: string): string {
  if (!field) return '';
  const spaced = field
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[._]/g, ' ')
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// Turn raw Zod issues into "Module "X" › Approach "Y" — Instructions required" lines,
// resolving array indices to their titles so an author can find the offending field.
export function describeIssues(pack: PackDraft, issues: z.ZodIssue[]): ReadableIssue[] {
  return issues.map((issue) => {
    const crumbs: string[] = [];
    let node: unknown = pack;
    for (let i = 0; i < issue.path.length; i++) {
      const seg = issue.path[i];
      if (typeof seg === 'number') {
        const containerKey = String(issue.path[i - 1]);
        const item = Array.isArray(node) ? (node[seg] as Record<string, unknown> | undefined) : undefined;
        const label = CONTAINER_LABELS[containerKey] ?? containerKey;
        const name = (item?.title ?? item?.name) as string | undefined;
        crumbs.push(name ? `${label} "${name}"` : `${label} #${seg + 1}`);
        node = item;
      } else if (typeof seg === 'string' && node && typeof node === 'object') {
        node = (node as Record<string, unknown>)[seg];
      }
    }
    const fieldSeg = [...issue.path].reverse().find((s) => typeof s === 'string');
    return {
      location: crumbs.length ? crumbs.join(' › ') : 'Pack',
      field: typeof fieldSeg === 'string' ? fieldSeg : '',
      message: issue.message,
    };
  });
}

// Mirror the server's soft workbench flags for an at-a-glance preview. These never block.
function computeWarnings(pack: PackDraft): WorkbenchFlag[] {
  const flags: WorkbenchFlag[] = [];
  const declaredIds = new Set((pack.workbenches ?? []).map((w) => w.id));
  flags.push(...workbenchIdResolutionFlags({ declaredIds, modules: pack.modules }));
  for (const m of pack.modules) {
    for (const a of m.approaches) {
      for (const act of a.activities) {
        if (!act.workbench) continue;
        flags.push(
          ...workbenchContentFlags(
            {
              handOffFraming: act.workbench.handOffFraming,
              parentOffGuidance: act.workbench.parentOffGuidance,
              whatTheBenchInvites: act.workbench.whatTheBenchInvites,
            },
            `module[${m.title}].approach[${a.title}].activity[${act.title}]`,
          ),
        );
      }
    }
  }
  return flags;
}

export function PublishDialog({
  open,
  pack,
  packIndex,
  draftId,
  onClose,
  onSaveNow,
  onPublished,
}: PublishDialogProps) {
  const [phase, setPhase] = useState<'review' | 'publishing' | 'done' | 'error'>('review');
  const [result, setResult] = useState<PublishResult | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  // Reset to the review phase each time the dialog is opened for a pack.
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase('review');
      setResult(null);
      setServerError(null);
    }
  }, [open]);

  // Close on Escape (unless mid-publish).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase !== 'publishing') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, phase, onClose]);

  const { issues, warnings } = useMemo(() => {
    if (!pack) return { issues: [] as ReadableIssue[], warnings: [] as WorkbenchFlag[] };
    const parsed = packPublishSchema.safeParse(pack);
    return {
      issues: parsed.success ? [] : describeIssues(pack, parsed.error.issues),
      warnings: computeWarnings(pack),
    };
  }, [pack]);

  if (!open || !pack) return null;

  const blocked = issues.length > 0;
  const moduleCount = pack.modules.length;
  const activityCount = pack.modules.reduce(
    (sum, m) => sum + m.approaches.reduce((s, a) => s + a.activities.length, 0),
    0,
  );

  async function handlePublish() {
    if (!draftId || blocked) return;
    setPhase('publishing');
    setServerError(null);

    // Publish reads the SAVED draft from the DB, so flush the autosave first.
    const saved = await onSaveNow();
    if (!saved) {
      setServerError('Could not save the draft before publishing. Check your connection and try again.');
      setPhase('error');
      return;
    }

    try {
      const res = await fetch('/api/admin/content/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId, packIndex }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.details || data.error || `Publish failed (${res.status})`);
        setPhase('error');
        return;
      }
      setResult(data as PublishResult);
      setPhase('done');
      onPublished(data as PublishResult);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Network error during publish.');
      setPhase('error');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-modal p-md"
      onClick={() => phase !== 'publishing' && onClose()}
    >
      <div
        className="bg-surface-panel border border-border-subtle rounded-lg shadow-float w-full max-w-lg flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-xl py-md border-b border-border-subtle shrink-0">
          <h3 id="publish-dialog-title" className="font-serif text-base font-semibold text-text-primary">
            Publish to Sanity
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={phase === 'publishing'}
            className="text-text-muted hover:text-text-primary transition-colors disabled:opacity-40"
            aria-label="Close"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-xl py-md">
          {phase === 'done' && result ? (
            <div className="text-center py-lg">
              <div className="inline-flex justify-center text-sage mb-md" aria-hidden="true">
                <CheckCircle size={32} weight="fill" />
              </div>
              <h4 className="font-serif text-lg font-semibold text-text-primary mb-sm">Published</h4>
              <p className="text-sm text-text-secondary font-sans mb-md">
                &ldquo;{pack.title}&rdquo; is now live in Sanity — {result.moduleIds.length} module
                {result.moduleIds.length === 1 ? '' : 's'} and {result.badgeIds.length} badge
                {result.badgeIds.length === 1 ? '' : 's'} written.
              </p>
              <code className="font-mono text-xs text-ember">{result.packId}</code>
              {result.workbenchFlags.length > 0 && (
                <p className="text-xs text-text-muted font-sans mt-md">
                  {result.workbenchFlags.length} non-blocking workbench warning
                  {result.workbenchFlags.length === 1 ? '' : 's'} were recorded — review when convenient.
                </p>
              )}
            </div>
          ) : phase === 'error' ? (
            <div className="py-md">
              <div className="flex items-start gap-2 text-red-400 mb-sm">
                <WarningCircle size={18} weight="fill" aria-hidden="true" className="mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-sans text-sm font-semibold">Publish failed</h4>
                  <p className="text-sm text-text-secondary font-sans mt-1">{serverError}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Summary line */}
              <p className="text-sm text-text-secondary font-sans mb-md">
                Publishing <span className="text-text-primary font-medium">&ldquo;{pack.title}&rdquo;</span> writes{' '}
                {moduleCount} module{moduleCount === 1 ? '' : 's'} and {activityCount} activit
                {activityCount === 1 ? 'y' : 'ies'} to Sanity as <span className="text-text-primary">published</span>.
              </p>

              {/* Blocking issues */}
              {blocked ? (
                <div className="mb-md">
                  <div className="flex items-center gap-1.5 text-red-400 text-xs font-sans font-semibold uppercase tracking-[0.05em] mb-sm">
                    <WarningCircle size={14} weight="fill" aria-hidden="true" />
                    {issues.length} issue{issues.length === 1 ? '' : 's'} blocking publish
                  </div>
                  <ul className="space-y-1.5">
                    {issues.map((iss, i) => (
                      <li
                        key={i}
                        className="bg-surface-body border border-red-900/30 rounded-[8px] px-3 py-2 text-sm"
                      >
                        <span className="text-text-muted font-sans text-xs">{iss.location}</span>
                        <div className="text-text-primary font-sans">
                          {iss.field && <span className="text-text-secondary">{humaniseField(iss.field)}: </span>}
                          {iss.message}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-sage text-sm font-sans mb-md">
                  <CheckCircle size={16} weight="fill" aria-hidden="true" />
                  All required fields are complete.
                </div>
              )}

              {/* Soft warnings (never block) */}
              {warnings.length > 0 && (
                <div className="mb-sm">
                  <div className="flex items-center gap-1.5 text-text-muted text-xs font-sans font-semibold uppercase tracking-[0.05em] mb-sm">
                    <WarningCircle size={14} aria-hidden="true" />
                    {warnings.length} warning{warnings.length === 1 ? '' : 's'} (won&rsquo;t block)
                  </div>
                  <ul className="space-y-1.5">
                    {warnings.map((w, i) => (
                      <li
                        key={i}
                        className="bg-surface-body border border-border-subtle rounded-[8px] px-3 py-2 text-xs"
                      >
                        <span className="text-text-muted font-mono">{w.location}</span>
                        <div className="text-text-secondary font-sans mt-0.5">{w.message}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-xl py-md border-t border-border-subtle shrink-0">
          {phase === 'done' ? (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-ember text-text-inverse font-sans text-sm font-semibold rounded-[8px] hover:bg-ember-hover transition-colors duration-150"
            >
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={phase === 'publishing'}
                className="px-4 py-2 bg-surface-raised border border-border-subtle rounded-[8px] text-text-secondary font-sans text-sm hover:bg-surface-hover transition-colors duration-150 disabled:opacity-40"
              >
                {phase === 'error' ? 'Close' : 'Cancel'}
              </button>
              {phase !== 'error' && (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={blocked || phase === 'publishing'}
                  className="px-4 py-2 bg-ember text-text-inverse font-sans text-sm font-semibold rounded-[8px] hover:bg-ember-hover transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {phase === 'publishing' ? 'Publishing…' : 'Publish to Sanity'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
