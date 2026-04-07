'use client';

import { useState, useEffect, useCallback } from 'react';
import SnapshotAgeHistogram from './_components/SnapshotAgeHistogram';
import StaleAlertsList, { type StaleFamily } from './_components/StaleAlertsList';

interface Bucket {
  key: string;
  label: string;
  count: number;
}

interface HealthData {
  buckets: Bucket[];
  total: number;
}

interface RebuildModal {
  familyId: string;
  familyName: string;
}

export default function SnapshotsClient() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [stale, setStale] = useState<StaleFamily[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<RebuildModal | null>(null);
  const [reason, setReason] = useState('');
  const [rebuilding, setRebuilding] = useState(false);
  const [rebuildError, setRebuildError] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [healthRes, staleRes] = await Promise.all([
        fetch('/api/admin/snapshots/health'),
        fetch('/api/admin/snapshots/stale'),
      ]);
      if (healthRes.ok) setHealth(await healthRes.json());
      if (staleRes.ok) {
        const data = await staleRes.json();
        setStale(data.stale);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function openRebuild(familyId: string, familyName: string) {
    setModal({ familyId, familyName });
    setReason('');
    setRebuildError('');
  }

  async function submitRebuild() {
    if (!modal || !reason.trim()) return;
    setRebuilding(true);
    setRebuildError('');
    try {
      const res = await fetch('/api/admin/snapshots/rebuild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyId: modal.familyId, reason: reason.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setRebuildError(data.error ?? 'Rebuild failed');
        return;
      }
      setModal(null);
      setReason('');
      fetchAll();
    } finally {
      setRebuilding(false);
    }
  }

  return (
    <div className="p-lg max-w-[960px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-lg">
        <h1 className="font-serif text-xl font-semibold text-text-primary">
          Snapshot Health
        </h1>
        <div className="flex items-center gap-md">
          {!loading && (
            <span className="font-sans text-[0.7rem] text-text-muted">
              {health?.total ?? 0} snapshot{health?.total !== 1 ? 's' : ''} tracked
            </span>
          )}
          <button
            onClick={fetchAll}
            className="rounded-md border border-border-subtle px-sm py-xs font-sans text-[0.7rem] font-medium text-text-muted hover:text-text-primary hover:border-border-medium transition-all duration-200"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <p className="font-sans text-sm text-text-muted">Loading...</p>
      ) : (
        <>
          {/* Age distribution */}
          <div className="rounded-lg border border-border-subtle bg-surface-panel p-md mb-lg">
            <h2 className="font-sans text-[0.7rem] font-semibold text-text-muted uppercase tracking-wider mb-md">
              Snapshot Age Distribution
            </h2>
            {health && (
              <SnapshotAgeHistogram buckets={health.buckets} total={health.total} />
            )}
          </div>

          {/* Stale alerts */}
          <div className="mb-lg">
            <div className="flex items-center gap-sm mb-md">
              <h2 className="font-sans text-[0.7rem] font-semibold text-text-muted uppercase tracking-wider">
                Stale Snapshot Alerts
              </h2>
              {stale.length > 0 && (
                <span className="rounded-full bg-ember/15 px-1.5 py-px font-sans text-[0.65rem] font-semibold text-ember">
                  {stale.length}
                </span>
              )}
            </div>
            <StaleAlertsList families={stale} onRebuild={openRebuild} />
          </div>
        </>
      )}

      {/* Rebuild reason modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rebuild-modal-title"
        >
          <div className="w-full max-w-[400px] rounded-lg border border-border-subtle bg-surface-panel p-lg shadow-medium mx-md">
            <h3
              id="rebuild-modal-title"
              className="font-serif text-base font-semibold text-text-primary mb-xs"
            >
              Rebuild Snapshot
            </h3>
            <p className="font-sans text-xs text-text-muted mb-md">
              Queuing a manual rebuild for{' '}
              <span className="font-semibold text-text-secondary">{modal.familyName}</span>.
              A reason is required for the audit log.
            </p>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for manual rebuild…"
              rows={3}
              className="w-full rounded-md border border-border-subtle bg-surface-body px-md py-sm font-sans text-sm text-text-primary placeholder:text-text-muted/50 focus:border-ember focus:outline-none resize-none transition-colors duration-200"
              autoFocus
            />

            {rebuildError && (
              <p className="mt-xs font-sans text-xs text-ember">{rebuildError}</p>
            )}

            <div className="flex gap-sm mt-md justify-end">
              <button
                onClick={() => setModal(null)}
                disabled={rebuilding}
                className="rounded-md border border-border-subtle px-md py-sm font-sans text-[0.8rem] font-medium text-text-secondary hover:text-text-primary transition-all duration-200 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={submitRebuild}
                disabled={rebuilding || !reason.trim()}
                className="rounded-md bg-ember px-md py-sm font-sans text-[0.8rem] font-semibold text-text-inverse hover:bg-ember-hover transition-all duration-200 disabled:opacity-40"
              >
                {rebuilding ? 'Queuing…' : 'Queue Rebuild'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
