'use client';

import Link from 'next/link';

export interface StaleFamily {
  familyId: string;
  familyName: string;
  rebuiltAt: string;
  lastWrite: string;
}

function timeAgo(d: string | null): string {
  if (!d) return '—';
  const now = Date.now();
  const then = new Date(d).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

interface Props {
  families: StaleFamily[];
  onRebuild: (familyId: string, familyName: string) => void;
}

export default function StaleAlertsList({ families, onRebuild }: Props) {
  if (families.length === 0) {
    return (
      <div className="rounded-lg border border-border-subtle bg-surface-panel p-lg text-center">
        <p className="font-sans text-sm text-sage">All snapshots are fresh</p>
        <p className="font-sans text-xs text-text-muted mt-xs">
          No families have writes that outpace their snapshot.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border-subtle overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-subtle bg-surface-raised">
            <Th>Family</Th>
            <Th>Snapshot age</Th>
            <Th>Last write</Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody>
          {families.map((f) => (
            <tr
              key={f.familyId}
              className="border-b border-border-subtle last:border-0"
              style={{ height: 'var(--admin-row-height, 40px)' }}
            >
              <td className="px-md">
                <Link
                  href={`/admin/families/${f.familyId}`}
                  className="font-sans text-sm font-medium text-ember hover:text-ember-hover transition-colors duration-[var(--motion-quick)]"
                >
                  {f.familyName}
                </Link>
              </td>
              <td className="px-md font-sans text-xs text-text-muted">
                {timeAgo(f.rebuiltAt)}
              </td>
              <td className="px-md font-sans text-xs text-text-muted">
                {timeAgo(f.lastWrite)}
              </td>
              <td className="px-md text-right">
                <button
                  onClick={() => onRebuild(f.familyId, f.familyName)}
                  className="rounded-md border border-border-subtle px-sm py-xs font-sans text-xs font-medium text-text-secondary hover:border-ember hover:text-ember transition-all duration-[var(--motion-quick)]"
                >
                  Rebuild
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="px-md py-sm text-left font-sans text-[0.65rem] font-semibold text-text-muted uppercase tracking-wider">
      {children}
    </th>
  );
}
