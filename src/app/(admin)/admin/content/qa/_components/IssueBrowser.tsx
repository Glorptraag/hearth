'use client';

import Link from 'next/link';
import type { QAIssueFlat } from '@/lib/content-qa/run';

interface Props {
  issues: QAIssueFlat[];
  loading: boolean;
  filters: {
    type: string;
    docType: string;
    packId: string;
    severity: string;
  };
  onFilterChange: (key: string, value: string) => void;
}

const ISSUE_TYPES = [
  { value: '', label: 'All types' },
  { value: 'missing', label: 'Missing field' },
  { value: 'weak', label: 'Weak field' },
  { value: 'broken_ref', label: 'Broken ref' },
  { value: 'orphan', label: 'Orphan' },
  { value: 'count_drift', label: 'Count drift' },
  { value: 'duplicate_slug', label: 'Duplicate slug' },
];

const DOC_TYPES: Array<{ value: string; label: string }> = [
  { value: '', label: 'All doc types' },
  { value: 'pack', label: 'Pack' },
  { value: 'module', label: 'Module' },
  { value: 'approach', label: 'Approach' },
  { value: 'activity', label: 'Activity' },
  { value: 'badge', label: 'Badge' },
];

const SEVERITIES = [
  { value: '', label: 'All severities' },
  { value: 'error', label: 'Error' },
  { value: 'warning', label: 'Warning' },
];

function issueTypeFromMessage(message: string): string {
  if (message.startsWith('Missing required field')) return 'missing';
  if (message.startsWith('Weak field value')) return 'weak';
  if (message.includes('Broken reference')) return 'broken_ref';
  if (message.includes('Orphan')) return 'orphan';
  if (message.includes('Count drift')) return 'count_drift';
  if (message.includes('Duplicate slug')) return 'duplicate_slug';
  return 'other';
}

export default function IssueBrowser({ issues, loading, filters, onFilterChange }: Props) {
  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-sm mb-md flex-wrap">
        <FilterSelect
          value={filters.type}
          options={ISSUE_TYPES}
          onChange={(v) => onFilterChange('type', v)}
        />
        <FilterSelect
          value={filters.docType}
          options={DOC_TYPES}
          onChange={(v) => onFilterChange('docType', v)}
        />
        <FilterSelect
          value={filters.severity}
          options={SEVERITIES}
          onChange={(v) => onFilterChange('severity', v)}
        />
      </div>

      {loading ? (
        <div className="rounded-lg border border-border-subtle p-lg text-center">
          <p className="font-sans text-sm text-text-muted">Loading issues...</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="rounded-lg border border-border-subtle p-xl text-center">
          <p className="font-sans text-sm text-text-muted">No issues found.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border-subtle overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-raised">
                <Th>Issue</Th>
                <Th>Type</Th>
                <Th>Severity</Th>
                <Th>Document</Th>
                <Th>Pack</Th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue, i) => (
                <tr
                  key={`${issue.docId}-${issue.field}-${i}`}
                  className="border-b border-border-subtle hover:bg-surface-hover transition-colors duration-[var(--motion-quick)]"
                  style={{ height: 'var(--admin-row-height, 40px)' }}
                >
                  <td className="px-md font-sans text-xs text-text-secondary max-w-[300px] truncate">
                    {issue.message}
                  </td>
                  <td className="px-md">
                    <span className="inline-flex rounded-[6px] border border-border-subtle bg-surface-raised px-1.5 py-px font-sans text-[0.6rem] text-text-secondary">
                      {issueTypeFromMessage(issue.message)}
                    </span>
                  </td>
                  <td className="px-md">
                    <SeverityPill severity={issue.severity} />
                  </td>
                  <td className="px-md">
                    <Link
                      href={`/admin/content/qa/${issue.packId}`}
                      className="font-sans text-xs text-text-secondary hover:text-ember transition-colors duration-[var(--motion-quick)]"
                    >
                      <span className="capitalize">{issue.docType}</span>: {issue.docTitle}
                    </Link>
                  </td>
                  <td className="px-md">
                    <Link
                      href={`/admin/content/qa/issues?packId=${issue.packId}`}
                      className="font-sans text-xs text-text-muted hover:text-ember transition-colors duration-[var(--motion-quick)]"
                    >
                      {issue.packTitle}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-sm">
        <span className="font-sans text-xs text-text-muted">
          {issues.length} issue{issues.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

function SeverityPill({ severity }: { severity: 'error' | 'warning' }) {
  if (severity === 'error') {
    return (
      <span className="inline-flex rounded-[6px] bg-surface-raised border border-ember/30 px-1.5 py-px font-sans text-[0.6rem] font-semibold text-ember">
        error
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-[6px] bg-surface-panel border border-border-subtle px-1.5 py-px font-sans text-[0.6rem] font-semibold text-text-muted">
      warning
    </span>
  );
}

function FilterSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-border-subtle bg-surface-body px-sm py-xs font-sans text-xs text-text-secondary focus:border-ember focus:outline-none transition-colors duration-[var(--motion-quick)]"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-md py-sm text-left font-sans text-[0.65rem] font-semibold text-text-muted uppercase tracking-wider">
      {children}
    </th>
  );
}
