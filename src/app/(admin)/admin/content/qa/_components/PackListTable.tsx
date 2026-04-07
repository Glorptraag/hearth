'use client';

import Link from 'next/link';
import type { PackSummary } from '@/lib/content-qa/run';

interface Props {
  packs: PackSummary[];
  loading: boolean;
}

function completenessColor(pct: number): string {
  if (pct >= 90) return 'bg-sage';
  if (pct >= 70) return 'bg-text-muted';
  return 'bg-ember';
}

function timeAgo(d: string | null): string {
  if (!d) return '\u2014';
  const now = Date.now();
  const then = new Date(d).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

export default function PackListTable({ packs, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-lg border border-border-subtle p-lg text-center">
        <p className="font-sans text-sm text-text-muted">Loading packs...</p>
      </div>
    );
  }

  if (packs.length === 0) {
    return (
      <div className="rounded-lg border border-border-subtle p-xl text-center">
        <p className="font-sans text-sm text-text-muted">No packs found in Sanity.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border-subtle overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-subtle bg-surface-raised">
            <Th>Pack</Th>
            <Th>Status</Th>
            <Th>Modules</Th>
            <Th>Activities</Th>
            <Th>Completeness</Th>
            <Th>Issues</Th>
            <Th>Updated</Th>
          </tr>
        </thead>
        <tbody>
          {packs.map((pack) => (
            <tr
              key={pack.id}
              className="border-b border-border-subtle hover:bg-surface-hover transition-colors duration-200"
              style={{ height: 'var(--admin-row-height, 40px)' }}
            >
              <td className="px-md">
                <Link
                  href={`/admin/content/qa/${pack.id}`}
                  className="font-serif text-sm font-semibold text-text-primary hover:text-ember transition-colors duration-200"
                >
                  {pack.title}
                </Link>
                {pack.slug && (
                  <span className="block font-sans text-[0.65rem] text-text-muted">
                    /{pack.slug}
                  </span>
                )}
              </td>
              <td className="px-md">
                <span className="inline-flex rounded-[6px] border border-border-subtle bg-surface-raised px-1.5 py-px font-sans text-[0.65rem] text-text-secondary capitalize">
                  {pack.status}
                </span>
              </td>
              <td className="px-md font-sans text-sm text-text-secondary">
                {pack.moduleCount}
              </td>
              <td className="px-md font-sans text-sm text-text-secondary">
                {pack.activityCount}
              </td>
              <td className="px-md">
                <div className="flex items-center gap-sm">
                  <div className="flex-1 h-1.5 rounded-full bg-surface-raised overflow-hidden max-w-[100px]">
                    <div
                      className={`h-full rounded-full ${completenessColor(pack.completeness)} transition-all duration-[400ms]`}
                      style={{ width: `${pack.completeness}%` }}
                    />
                  </div>
                  <span className="font-sans text-xs text-text-muted w-[32px] text-right">
                    {pack.completeness}%
                  </span>
                </div>
              </td>
              <td className="px-md">
                {pack.errorCount > 0 || pack.warningCount > 0 ? (
                  <Link
                    href={`/admin/content/qa/issues?packId=${pack.id}`}
                    className="font-sans text-xs text-text-muted hover:text-ember transition-colors duration-200"
                  >
                    {pack.errorCount > 0 && (
                      <span className="text-ember">{pack.errorCount} error{pack.errorCount !== 1 ? 's' : ''}</span>
                    )}
                    {pack.errorCount > 0 && pack.warningCount > 0 && ' \u00B7 '}
                    {pack.warningCount > 0 && (
                      <span>{pack.warningCount} warning{pack.warningCount !== 1 ? 's' : ''}</span>
                    )}
                  </Link>
                ) : (
                  <span className="font-sans text-xs text-sage">Clean</span>
                )}
              </td>
              <td className="px-md font-sans text-xs text-text-muted">
                {timeAgo(pack.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-md py-sm text-left font-sans text-[0.65rem] font-semibold text-text-muted uppercase tracking-wider">
      {children}
    </th>
  );
}
