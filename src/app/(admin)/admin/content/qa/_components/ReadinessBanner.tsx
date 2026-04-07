'use client';

import type { QAIssue } from '@/lib/content-qa/types';

interface Props {
  readinessState: 'NOT_READY' | 'READY_WITH_WARNINGS' | 'READY';
  errorCount: number;
  warningCount: number;
  errors: QAIssue[];
}

export default function ReadinessBanner({ readinessState, errorCount, warningCount, errors }: Props) {
  if (readinessState === 'READY') {
    return (
      <div className="rounded-lg border border-sage/30 bg-sage/10 px-lg py-md">
        <div className="flex items-center gap-sm">
          <span className="font-sans text-sm font-semibold text-sage">READY</span>
          <span className="font-sans text-xs text-text-secondary">
            All fields complete, no integrity issues
          </span>
        </div>
      </div>
    );
  }

  if (readinessState === 'READY_WITH_WARNINGS') {
    return (
      <div className="rounded-lg border border-border-subtle bg-surface-raised px-lg py-md">
        <div className="flex items-center gap-sm">
          <span className="font-sans text-sm font-semibold text-text-secondary">READY WITH WARNINGS</span>
          <span className="font-sans text-xs text-text-muted">
            {warningCount} warning{warningCount !== 1 ? 's' : ''} — publish allowed but content is incomplete
          </span>
        </div>
      </div>
    );
  }

  // NOT_READY
  const displayErrors = errors.slice(0, 3);
  const remaining = errorCount - displayErrors.length;

  return (
    <div className="rounded-lg border border-ember/30 bg-ember/10 px-lg py-md">
      <div className="flex items-center gap-sm mb-xs">
        <span className="font-sans text-sm font-semibold text-ember">NOT READY</span>
        <span className="font-sans text-xs text-text-muted">
          {errorCount} error{errorCount !== 1 ? 's' : ''}
          {warningCount > 0 && ` \u00B7 ${warningCount} warning${warningCount !== 1 ? 's' : ''}`}
        </span>
      </div>
      <ul className="space-y-xs">
        {displayErrors.map((err, i) => (
          <li key={i} className="font-sans text-xs text-text-secondary">
            {err.message}
          </li>
        ))}
        {remaining > 0 && (
          <li className="font-sans text-xs text-text-muted">
            and {remaining} more...
          </li>
        )}
      </ul>
    </div>
  );
}
