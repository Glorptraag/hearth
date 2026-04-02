'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

// ─── Types ───

interface SessionData {
  id: string;
  title: string;
  description: string | null;
  date: string;
  timeStart: string | null;
  timeEnd: string | null;
  location: string | null;
  status: string;
  facilitatorFamilyId: string;
}

interface MemberChild {
  firstName: string;
  ageInYears: number | null;
  colourToken: string | null;
}

interface MemberData {
  familyId: string;
  familyName: string;
  role: string;
  joinedAt: string | null;
  consentCrossObservation: boolean;
  consentEvidenceSharing: boolean;
  children: MemberChild[];
}

interface HearthHomeProps {
  hearth: {
    id: string;
    name: string;
    description: string | null;
    location: string | null;
  };
  role: string;
  familyId: string;
  upcoming: SessionData[];
  recent: SessionData[];
  members: MemberData[];
  memberCount: number;
  totalChildrenCount: number;
  sessionCount: number;
  familyLearners: { id: string; name: string; colourToken: string | null }[];
}

type TabId = 'ourstory' | 'sessions' | 'members' | 'settings';

const TABS: { id: TabId; label: string }[] = [
  { id: 'ourstory', label: 'Our Story' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'members', label: 'Members' },
  { id: 'settings', label: 'Settings' },
];

// ─── Helpers ───

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatTime(time: string | null): string {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'pm' : 'am';
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}${m !== '00' ? ':' + m : ''}${ampm}`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'upcoming':
      return {
        label: 'Upcoming',
        classes: 'bg-blue-900/20 text-blue-400 border border-blue-900/30',
      };
    case 'completed':
      return {
        label: 'Logged',
        classes: 'bg-sage/10 text-sage border border-sage/20',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        classes: 'bg-surface-raised text-text-muted border border-border-subtle',
      };
    default:
      return {
        label: status,
        classes: 'bg-surface-raised text-text-secondary border border-border-subtle',
      };
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ─── Component ───

export default function HearthHomeClient({
  hearth,
  role,
  familyId,
  upcoming,
  recent,
  members,
  memberCount,
  totalChildrenCount,
  sessionCount,
  familyLearners,
}: HearthHomeProps) {
  const [activeTab, setActiveTab] = useState<TabId>('ourstory');
  const [editName, setEditName] = useState(hearth.name);
  const [editDescription, setEditDescription] = useState(
    hearth.description ?? ''
  );
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const isCoordinator = role === 'coordinator';

  async function handleSaveSettings() {
    setSaving(true);
    try {
      const res = await fetch(`/api/hearths/${hearth.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, description: editDescription }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast('Settings saved');
      router.refresh();
    } catch {
      toast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-body px-md py-lg md:px-xl md:py-xl">
      <div className="mx-auto max-w-4xl">
        {/* Back nav */}
        <Link
          href="/dashboard"
          className="mb-lg inline-flex items-center gap-xs font-sans text-sm text-text-muted transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:text-text-secondary"
        >
          <span>←</span>
          <span>Back to Dashboard</span>
        </Link>

        {/* Header */}
        <div className="mb-xl">
          <h1 className="font-serif text-3xl font-semibold text-text-primary">
            <span className="mr-sm">🏠</span>
            {hearth.name}
          </h1>
          {hearth.description && (
            <p className="mt-sm font-serif text-base text-text-secondary">
              {hearth.description}
            </p>
          )}
          <div className="mt-sm flex flex-wrap items-center gap-md font-sans text-sm text-text-muted">
            <span>👨‍👩‍👧‍👦 {memberCount} {memberCount === 1 ? 'family' : 'families'}</span>
            <span>·</span>
            <span>👶 {totalChildrenCount} {totalChildrenCount === 1 ? 'child' : 'children'}</span>
            {hearth.location && (
              <>
                <span>·</span>
                <span>📍 {hearth.location}</span>
              </>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="mb-xl border-b border-border-subtle">
          <div className="flex gap-lg">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-sm font-sans text-sm font-semibold transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  activeTab === tab.id
                    ? 'border-b-2 border-ember text-ember'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {activeTab === 'ourstory' && (
          <OurStoryTab
            sessionCount={sessionCount}
            memberCount={memberCount}
            totalChildrenCount={totalChildrenCount}
          />
        )}

        {activeTab === 'sessions' && (
          <SessionsTab
            hearthId={hearth.id}
            upcoming={upcoming}
            recent={recent}
            isCoordinator={isCoordinator}
          />
        )}

        {activeTab === 'members' && (
          <MembersTab
            members={members}
            isCoordinator={isCoordinator}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            hearth={hearth}
            isCoordinator={isCoordinator}
            editName={editName}
            editDescription={editDescription}
            saving={saving}
            onNameChange={setEditName}
            onDescriptionChange={setEditDescription}
            onSave={handleSaveSettings}
          />
        )}
      </div>
    </div>
  );
}

// ─── Our Story Tab ───

function OurStoryTab({
  sessionCount,
  memberCount,
  totalChildrenCount,
}: {
  sessionCount: number;
  memberCount: number;
  totalChildrenCount: number;
}) {
  const stats = [
    { value: sessionCount, label: 'Sessions' },
    { value: memberCount, label: 'Families' },
    { value: totalChildrenCount, label: 'Children' },
  ];

  return (
    <div>
      <div className="mb-2xl grid grid-cols-3 gap-lg">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border-subtle bg-surface-panel p-lg text-center"
          >
            <div className="font-serif text-3xl font-semibold text-ember">
              {stat.value}
            </div>
            <div className="mt-xs font-sans text-xs text-text-muted">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border-subtle bg-surface-panel p-xl shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
        <p className="font-serif text-base text-text-muted">
          Our Story content will be rendered here
        </p>
      </div>
    </div>
  );
}

// ─── Sessions Tab ───

function SessionsTab({
  hearthId,
  upcoming,
  recent,
  isCoordinator,
}: {
  hearthId: string;
  upcoming: SessionData[];
  recent: SessionData[];
  isCoordinator: boolean;
}) {
  return (
    <div>
      {isCoordinator && (
        <div className="mb-xl">
          <Link
            href={`/hearths/${hearthId}/sessions/new`}
            className="inline-flex items-center gap-xs rounded-[10px] bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:brightness-110"
          >
            + New Session
          </Link>
        </div>
      )}

      {/* Upcoming */}
      <div className="mb-2xl">
        <h2 className="mb-md font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
          Upcoming
        </h2>
        {upcoming.length === 0 ? (
          <p className="font-serif text-sm text-text-muted">
            No upcoming sessions scheduled
          </p>
        ) : (
          <div className="flex flex-col gap-md">
            {upcoming.map((session) => (
              <SessionCard key={session.id} session={session} hearthId={hearthId} />
            ))}
          </div>
        )}
      </div>

      {/* Recent */}
      <div>
        <h2 className="mb-md font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
          Recent
        </h2>
        {recent.length === 0 ? (
          <p className="font-serif text-sm text-text-muted">
            No past sessions yet
          </p>
        ) : (
          <div className="flex flex-col gap-md">
            {recent.map((session) => (
              <SessionCard key={session.id} session={session} hearthId={hearthId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SessionCard({
  session,
  hearthId,
}: {
  session: SessionData;
  hearthId: string;
}) {
  const badge = getStatusBadge(session.status);
  const timeStr = [formatTime(session.timeStart), formatTime(session.timeEnd)]
    .filter(Boolean)
    .join(' – ');

  return (
    <Link
      href={`/hearths/${hearthId}/sessions/${session.id}`}
      className="block rounded-lg border border-border-subtle bg-surface-panel p-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:translate-y-[-2px] hover:border-border-medium hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    >
      <div className="mb-sm flex items-center gap-sm">
        <span
          className={`rounded-[6px] px-2 py-0.5 font-sans text-xs ${badge.classes}`}
        >
          {badge.label}
        </span>
        <span className="font-sans text-xs text-text-muted">
          {formatDate(session.date)}
          {timeStr && ` · ${timeStr}`}
        </span>
      </div>
      <h3 className="font-serif text-lg font-semibold text-text-primary">
        {session.title}
      </h3>
      {session.description && (
        <p className="mt-xs line-clamp-2 font-serif text-sm text-text-secondary">
          {session.description}
        </p>
      )}
      {session.location && (
        <div className="mt-sm font-sans text-xs text-text-muted">
          📍 {session.location}
        </div>
      )}
    </Link>
  );
}

// ─── Members Tab ───

function MembersTab({
  members,
  isCoordinator,
}: {
  members: MemberData[];
  isCoordinator: boolean;
}) {
  return (
    <div>
      {isCoordinator && (
        <div className="mb-xl">
          <button className="inline-flex items-center gap-xs rounded-[10px] bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:brightness-110">
            + Invite Family
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-lg sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <MemberCard key={member.familyId} member={member} />
        ))}
      </div>
    </div>
  );
}

function MemberCard({ member }: { member: MemberData }) {
  const initials = getInitials(member.familyName);

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-panel p-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:translate-y-[-2px] hover:border-border-medium hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      <div className="mb-md flex items-center gap-md">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ember/15 font-sans text-sm font-semibold text-ember">
          {initials}
        </div>
        <div>
          <h3 className="font-serif text-base font-semibold text-text-primary">
            {member.familyName}
          </h3>
          <span
            className={`inline-block rounded-[6px] px-2 py-0.5 font-sans text-xs ${
              member.role === 'coordinator'
                ? 'bg-ember/15 text-ember border border-ember/20'
                : 'bg-surface-raised text-text-secondary border border-border-subtle'
            }`}
          >
            {member.role}
          </span>
        </div>
      </div>

      {member.children.length > 0 && (
        <div className="flex flex-wrap gap-xs">
          {member.children.map((child, i) => (
            <span
              key={i}
              className="rounded-[6px] border border-border-subtle bg-surface-raised px-2 py-0.5 font-sans text-xs text-text-secondary"
            >
              {child.firstName}
              {child.ageInYears !== null && ` (${child.ageInYears})`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Settings Tab ───

function SettingsTab({
  hearth,
  isCoordinator,
  editName,
  editDescription,
  saving,
  onNameChange,
  onDescriptionChange,
  onSave,
}: {
  hearth: { id: string; name: string; description: string | null; location: string | null };
  isCoordinator: boolean;
  editName: string;
  editDescription: string;
  saving: boolean;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col gap-xl">
      {/* Name & Description */}
      <div className="rounded-lg border border-border-subtle bg-surface-panel p-xl shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
        <h2 className="mb-lg font-serif text-xl font-semibold text-text-primary">
          Hearth Details
        </h2>

        <div className="mb-lg">
          <label className="mb-xs block font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
            Name
          </label>
          {isCoordinator ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => onNameChange(e.target.value)}
              className="w-full rounded-[10px] border border-border-subtle bg-surface-raised px-md py-sm font-serif text-base text-text-primary outline-none transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] focus:border-ember"
            />
          ) : (
            <p className="font-serif text-base text-text-primary">{hearth.name}</p>
          )}
        </div>

        <div className="mb-lg">
          <label className="mb-xs block font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
            Description
          </label>
          {isCoordinator ? (
            <textarea
              value={editDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={3}
              className="w-full rounded-[10px] border border-border-subtle bg-surface-raised px-md py-sm font-serif text-base text-text-primary outline-none transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] focus:border-ember"
            />
          ) : (
            <p className="font-serif text-base text-text-secondary">
              {hearth.description || 'No description'}
            </p>
          )}
        </div>

        {isCoordinator && (
          <button
            onClick={onSave}
            disabled={saving}
            className="rounded-[10px] bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:brightness-110 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* Consent */}
      <div className="rounded-lg border border-border-subtle bg-surface-panel p-xl shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
        <h2 className="mb-lg font-serif text-xl font-semibold text-text-primary">
          Consent Settings
        </h2>
        <p className="font-serif text-sm text-text-muted">
          Consent toggles for cross-observation and evidence sharing will be managed here.
        </p>
      </div>

      {/* Leave */}
      <div className="rounded-lg border border-border-subtle bg-surface-panel p-xl shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
        <h2 className="mb-md font-serif text-xl font-semibold text-text-primary">
          Danger Zone
        </h2>
        <button className="rounded-[10px] bg-red-900/20 px-md py-sm font-sans text-sm font-semibold text-red-400 border border-red-900/30 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-red-900/30">
          Leave this Hearth
        </button>
      </div>
    </div>
  );
}
