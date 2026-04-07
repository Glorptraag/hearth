'use client';

import { useState } from 'react';
import ReasonModal from './ReasonModal';

interface Props {
  familyId: string;
  onRebuilt: () => void;
}

export default function SnapshotRebuildButton({ familyId, onRebuilt }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<'idle' | 'queued' | 'error'>('idle');

  async function handleRebuild(reason: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/families/${familyId}/snapshot/rebuild`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error('Failed');
      setResult('queued');
      setShowModal(false);
      onRebuilt();
    } catch {
      setResult('error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => { setShowModal(true); setResult('idle'); }}
        className="rounded-md border border-border-subtle bg-surface-raised px-md py-sm font-sans text-[0.8rem] font-semibold text-text-secondary hover:border-border-medium hover:text-text-primary transition-all duration-200"
      >
        Trigger Rebuild
      </button>

      {result === 'queued' && (
        <span className="font-sans text-xs text-sage ml-sm">Rebuild queued</span>
      )}
      {result === 'error' && (
        <span className="font-sans text-xs text-red-400 ml-sm">Rebuild failed</span>
      )}

      <ReasonModal
        open={showModal}
        title="Trigger Snapshot Rebuild"
        description="This will queue a full snapshot rebuild for this family. This access will be logged."
        confirmLabel="Queue Rebuild"
        loading={loading}
        onConfirm={handleRebuild}
        onCancel={() => setShowModal(false)}
      />
    </>
  );
}
