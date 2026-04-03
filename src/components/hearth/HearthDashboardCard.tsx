'use client';

import Link from 'next/link';

interface HearthDashboardCardProps {
  id: string;
  name: string;
  memberCount: number;
  nextSession: { id: string; title: string; date: string } | null;
  pendingScaffoldCount: number;
}

export default function HearthDashboardCard({
  id,
  name,
  memberCount,
  nextSession,
  pendingScaffoldCount,
}: HearthDashboardCardProps) {
  return (
    <Link
      href={'/hearths/' + id}
      className="bg-surface-panel rounded-lg p-xl border border-border-subtle shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:-translate-y-[2px] hover:border-border-medium hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] relative overflow-hidden cursor-pointer before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-gradient-to-r before:from-ember before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-[400ms] block"
    >
      <div className="flex items-start justify-between mb-md">
        <div>
          <h3 className="font-serif text-lg font-semibold text-text-primary">{name}</h3>
          <p className="font-sans text-xs text-text-muted mt-xs">
            {memberCount} {memberCount === 1 ? 'family' : 'families'}
          </p>
        </div>
      </div>

      {nextSession && (
        <div className="bg-surface-raised rounded-[10px] p-sm px-md flex items-center gap-sm mb-sm">
          <span className="font-sans text-xs text-text-secondary flex-1">{nextSession.title}</span>
          <span className="font-sans text-xs text-text-muted shrink-0">{nextSession.date}</span>
        </div>
      )}

      {pendingScaffoldCount > 0 && (
        <div className="bg-ember/[0.08] border border-ember/15 rounded-[10px] p-sm px-md mt-sm">
          <span className="font-sans text-xs text-ember font-medium">
            {pendingScaffoldCount} pending scaffold{pendingScaffoldCount > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </Link>
  );
}
