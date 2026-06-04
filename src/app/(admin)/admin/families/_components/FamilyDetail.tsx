'use client';

import { useState } from 'react';
import SnapshotRebuildButton from './SnapshotRebuildButton';

interface FamilyData {
  family: {
    id: string;
    familyName: string;
    clerkUserId: string;
    onboardingComplete: boolean;
    createdAt: string | null;
  };
  settings: {
    pedagogyPreference: string | null;
    state: string | null;
    registrationNumber: string | null;
    nextReportDate: string | null;
  } | null;
  children: Array<{
    id: string;
    name: string;
    dateOfBirth: string | null;
    colourToken: string | null;
    displayOrder: number | null;
    badgeCount: number;
  }>;
  recentEntries: Array<{
    id: string;
    title: string;
    dateOccurred: string;
    status: string;
    evidenceCount: number;
  }>;
  snapshotState: {
    rebuiltAt: string | null;
    rebuildTrigger: string | null;
    snapshotVersion: number | null;
    ageHours: number | null;
  } | null;
  notifications: Array<{
    id: string;
    type: string;
    tier: string;
    title: string;
    state: string;
    createdAt: string | null;
  }>;
}

interface Props {
  data: FamilyData | null;
  loading: boolean;
  onClose: () => void;
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '\u2014';
  return new Date(d).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border-subtle">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-lg py-sm hover:bg-surface-hover transition-colors duration-200"
      >
        <span className="font-sans text-[0.7rem] font-semibold text-text-muted uppercase tracking-wider">
          {title}
        </span>
        <span className="font-sans text-xs text-text-muted">
          {open ? '\u25B2' : '\u25BC'}
        </span>
      </button>
      {open && <div className="px-lg pb-md">{children}</div>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-start gap-md mb-xs">
      <span className="font-sans text-xs text-text-muted w-[100px] flex-shrink-0">{label}</span>
      <span className="font-sans text-sm text-text-secondary">{value ?? '\u2014'}</span>
    </div>
  );
}

export default function FamilyDetail({ data, loading, onClose }: Props) {
  const [, setRefreshKey] = useState(0);

  if (!data && !loading) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-[440px] border-l border-border-subtle bg-surface-panel shadow-float overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle px-lg py-md">
        <h3 className="font-sans text-[0.85rem] font-semibold text-text-primary">
          Family Detail
        </h3>
        <button
          onClick={onClose}
          className="font-sans text-sm text-text-muted hover:text-text-primary transition-colors duration-200"
        >
          Close
        </button>
      </div>

      {loading ? (
        <div className="p-lg font-sans text-sm text-text-muted">Loading...</div>
      ) : data ? (
        <div>
          {/* Family Identity — default open */}
          <CollapsibleSection title="Identity" defaultOpen>
            <Row label="Family ID" value={data.family.id} />
            <Row label="Name" value={data.family.familyName} />
            <Row label="Clerk ID" value={data.family.clerkUserId} />
            <Row label="Signup" value={formatDate(data.family.createdAt)} />
            <Row label="Onboarded" value={data.family.onboardingComplete ? 'Yes' : 'No'} />
            {data.settings && (
              <>
                <Row label="State" value={data.settings.state} />
                <Row label="Pedagogy" value={data.settings.pedagogyPreference} />
                <Row label="Registration #" value={data.settings.registrationNumber} />
                <Row label="Next report" value={formatDate(data.settings.nextReportDate)} />
              </>
            )}
          </CollapsibleSection>

          {/* Children — names + badge counts only */}
          <CollapsibleSection title={`Children (${data.children.length})`}>
            {data.children.length === 0 ? (
              <p className="font-sans text-sm text-text-muted">No children registered</p>
            ) : (
              <div className="space-y-xs">
                {data.children.map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center justify-between rounded-md border border-border-subtle bg-surface-body px-sm py-xs"
                  >
                    <span className="font-sans text-sm text-text-secondary">
                      {child.name}
                    </span>
                    <span className="font-sans text-xs text-text-muted">
                      {child.badgeCount} badge{child.badgeCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Recent Entries — titles only */}
          <CollapsibleSection title={`Recent Entries (${data.recentEntries.length})`}>
            {data.recentEntries.length === 0 ? (
              <p className="font-sans text-sm text-text-muted">No entries yet</p>
            ) : (
              <div className="space-y-xs">
                {data.recentEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-md border border-border-subtle bg-surface-body px-sm py-xs"
                  >
                    <span className="font-sans text-sm text-text-secondary truncate mr-sm">
                      {entry.title}
                    </span>
                    <div className="flex items-center gap-sm flex-shrink-0">
                      {entry.evidenceCount > 0 && (
                        <span className="font-sans text-[0.65rem] text-text-muted">
                          {entry.evidenceCount} photo{entry.evidenceCount !== 1 ? 's' : ''}
                        </span>
                      )}
                      <span className="font-sans text-xs text-text-muted">
                        {formatDate(entry.dateOccurred)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Notifications */}
          <CollapsibleSection title={`Notifications (${data.notifications.length})`}>
            {data.notifications.length === 0 ? (
              <p className="font-sans text-sm text-text-muted">No recent notifications</p>
            ) : (
              <div className="space-y-xs">
                {data.notifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-center justify-between rounded-md border border-border-subtle bg-surface-body px-sm py-xs"
                  >
                    <span className="font-sans text-sm text-text-secondary truncate mr-sm">
                      {n.title}
                    </span>
                    <div className="flex items-center gap-xs flex-shrink-0">
                      <span className="inline-flex rounded-[6px] border border-border-subtle bg-surface-raised px-1.5 py-px font-sans text-[0.6rem] text-text-muted">
                        {n.tier}
                      </span>
                      <span className="inline-flex rounded-[6px] border border-border-subtle bg-surface-raised px-1.5 py-px font-sans text-[0.6rem] text-text-muted">
                        {n.state}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Snapshot State — default open */}
          <CollapsibleSection title="Snapshot State" defaultOpen>
            {data.snapshotState ? (
              <div>
                <Row label="Last rebuild" value={formatDate(data.snapshotState.rebuiltAt)} />
                <Row label="Trigger" value={data.snapshotState.rebuildTrigger} />
                <Row label="Version" value={data.snapshotState.snapshotVersion} />
                <Row
                  label="Age"
                  value={
                    data.snapshotState.ageHours !== null
                      ? `${data.snapshotState.ageHours}h`
                      : 'Never rebuilt'
                  }
                />
                <div className="mt-sm flex items-center">
                  <SnapshotRebuildButton
                    familyId={data.family.id}
                    onRebuilt={() => setRefreshKey((k) => k + 1)}
                  />
                </div>
              </div>
            ) : (
              <div>
                <p className="font-sans text-sm text-text-muted mb-sm">No snapshot exists</p>
                <SnapshotRebuildButton
                  familyId={data.family.id}
                  onRebuilt={() => setRefreshKey((k) => k + 1)}
                />
              </div>
            )}
          </CollapsibleSection>
        </div>
      ) : (
        <div className="p-lg font-sans text-sm text-text-muted">Not found</div>
      )}
    </div>
  );
}
