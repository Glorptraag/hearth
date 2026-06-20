'use client';

import { useState, useEffect } from 'react';
import StatusPill from './StatusPill';
import type { Invitation, AdminAuditLogEntry } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface Props {
  invitationId: string | null;
  onClose: () => void;
  onRevoked: () => void;
}

function formatDate(d: Date | string | null): string {
  if (!d) return '\u2014';
  const date = new Date(d);
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeAgo(d: Date | string | null): string {
  if (!d) return '\u2014';
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

export default function InvitationDetailPanel({ invitationId, onClose, onRevoked }: Props) {
  const { toast } = useToast();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [auditHistory, setAuditHistory] = useState<AdminAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [showRevokeForm, setShowRevokeForm] = useState(false);

  useEffect(() => {
    if (!invitationId) return;
    // Fetch-on-id-change data hydration; loading flag flips before the await and reset on completion.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/admin/invitations/${invitationId}`)
      .then((r) => r.json())
      .then((data) => {
        setInvitation(data.invitation);
        setAuditHistory(data.auditHistory ?? []);
      })
      .finally(() => setLoading(false));
  }, [invitationId]);

  if (!invitationId) return null;

  async function handleRevoke() {
    if (!invitation || !revokeReason.trim()) return;
    setRevoking(true);
    try {
      const res = await fetch(`/api/admin/invitations/${invitation.id}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: revokeReason }),
      });
      if (!res.ok) throw new Error('Failed to revoke');
      setShowRevokeForm(false);
      setRevokeReason('');
      onRevoked();
    } catch {
      toast('Failed to revoke invitation', 'error');
    } finally {
      setRevoking(false);
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-[400px] border-l border-border-subtle bg-surface-panel shadow-float overflow-y-auto">
      <div className="flex items-center justify-between border-b border-border-subtle px-lg py-md">
        <h3 className="font-sans text-[0.85rem] font-semibold text-text-primary">
          Invitation Detail
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
      ) : invitation ? (
        <div className="p-lg">
          <div className="mb-lg">
            <div className="flex items-center gap-sm mb-md">
              <span className="font-serif text-base font-semibold text-text-primary">
                {invitation.intendedFamilyName}
              </span>
              <StatusPill status={invitation.status} />
            </div>

            <div className="rounded-md bg-surface-raised border border-border-subtle p-md mb-md text-center">
              <span className="font-mono text-lg font-semibold text-ember tracking-wider">
                {invitation.code}
              </span>
            </div>
          </div>

          <div className="space-y-sm mb-lg">
            <Row label="Email" value={invitation.intendedPrimaryEmail} />
            <Row label="State" value={invitation.intendedLocationState} />
            <Row label="Source" value={invitation.sourceLabel} />
            <Row label="Notes" value={invitation.notes} />
            <Row label="Created" value={formatDate(invitation.createdAt)} />
            <Row label="Expires" value={formatDate(invitation.expiresAt)} />
            {invitation.redeemedAt && (
              <Row label="Redeemed" value={formatDate(invitation.redeemedAt)} />
            )}
            {invitation.revokedAt && (
              <>
                <Row label="Revoked" value={formatDate(invitation.revokedAt)} />
                <Row label="Revoke reason" value={invitation.revokedReason} />
              </>
            )}
          </div>

          {invitation.status === 'pending' && !showRevokeForm && (
            <button
              onClick={() => setShowRevokeForm(true)}
              className="w-full rounded-md bg-red-900/20 border border-red-900/30 px-md py-sm font-sans text-[0.8rem] font-semibold text-red-400 hover:bg-red-900/30 transition-all duration-200 mb-lg"
            >
              Revoke Invitation
            </button>
          )}

          {showRevokeForm && (
            <div className="rounded-md border border-red-900/30 bg-red-900/10 p-md mb-lg">
              <p className="font-sans text-xs text-red-400 mb-sm">
                Why are you revoking this invitation?
              </p>
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                rows={2}
                placeholder="Required reason..."
                className="w-full rounded-md border border-red-900/30 bg-surface-body px-sm py-xs font-sans text-sm text-text-primary placeholder:text-text-muted/50 focus:border-red-400 focus:outline-none mb-sm resize-none"
              />
              <div className="flex gap-sm">
                <button
                  onClick={() => { setShowRevokeForm(false); setRevokeReason(''); }}
                  className="flex-1 rounded-md border border-border-subtle px-sm py-xs font-sans text-xs text-text-muted hover:text-text-secondary transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevoke}
                  disabled={!revokeReason.trim() || revoking}
                  className="flex-1 rounded-md bg-red-600 px-sm py-xs font-sans text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-all duration-200"
                >
                  {revoking ? 'Revoking...' : 'Confirm Revoke'}
                </button>
              </div>
            </div>
          )}

          {auditHistory.length > 0 && (
            <div>
              <h4 className="font-sans text-[0.7rem] font-semibold text-text-muted uppercase tracking-wider mb-sm">
                Audit History
              </h4>
              <div className="space-y-xs">
                {auditHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-md border border-border-subtle bg-surface-body px-sm py-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-xs font-medium text-text-secondary">
                        {entry.action}
                      </span>
                      <span className="font-sans text-[0.65rem] text-text-muted">
                        {timeAgo(entry.createdAt)}
                      </span>
                    </div>
                    {entry.reason && (
                      <p className="font-sans text-xs text-text-muted mt-xs">
                        {entry.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-lg font-sans text-sm text-text-muted">Not found</div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-md">
      <span className="font-sans text-xs text-text-muted w-[80px] flex-shrink-0">{label}</span>
      <span className="font-sans text-sm text-text-secondary">{value || '\u2014'}</span>
    </div>
  );
}
