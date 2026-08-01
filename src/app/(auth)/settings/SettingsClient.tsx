'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ChildCard from '@/components/settings/ChildCard';
import PedagogySelector from '@/components/settings/PedagogySelector';
import { PedagogyProfilePanel } from '@/components/settings/PedagogyProfilePanel';
import { PedagogyLearnMore } from '@/components/settings/PedagogyLearnMore';
import { PedagogyWizard, type PedagogyWizardResult } from '@/components/pedagogy/PedagogyWizard';
import ReportingFields from '@/components/settings/ReportingFields';
import { getJurisdiction } from '@/config/jurisdictions';
import NotificationPreferences from '@/components/settings/NotificationPreferences';
import { FeedbackButton } from '@/components/feedback/FeedbackModal';
import EmptyState from '@/components/ui/EmptyState';
import {
  House,
  UsersThree,
  Compass,
  ShieldCheck,
  Bell,
  Key,
  ShieldStar,
  Diamond,
  FlowerLotus,
  ArrowLeft,
  List,
  Check,
} from '@/components/icons';
import type { ComponentType } from 'react';
import { PEDAGOGIES, type Pedagogy } from '@/types';
import { track } from '@/lib/analytics/posthog';

function AccountSecurityPanel() {
  const [showDelete, setShowDelete] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (confirmation !== 'DELETE MY ACCOUNT') return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation }),
      });
      if (res.ok) {
        window.location.href = '/sign-in';
      } else {
        const data = await res.json();
        setError(data.error ?? 'Deletion failed');
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-md">
      <div>
        <p className="mb-xs font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">Security</p>
        <h2 className="mb-md font-serif text-xl font-semibold text-text-primary">Account & Security</h2>
      </div>
      <div className="rounded-[10px] border border-border-subtle bg-surface-panel p-lg">
        <p className="font-sans text-sm text-text-secondary">
          Account and security settings are managed through your Clerk account. Password, two-factor authentication, and connected accounts are all available there.
        </p>
      </div>

      {/* Data export */}
      <div className="rounded-[10px] border border-border-subtle bg-surface-panel p-lg">
        <h3 className="font-sans text-sm font-semibold text-text-primary">Export Your Data</h3>
        <p className="mt-xs font-sans text-sm text-text-secondary">
          Download all your family&rsquo;s learning entries, observations, planner history, and badge awards as a JSON file.
        </p>
        <button
          onClick={() => window.open('/api/account/export', '_blank')}
          className="mt-md rounded-[6px] border border-border-subtle bg-surface-raised px-md py-sm font-sans text-sm font-semibold text-text-primary transition-all hover:border-border-medium hover:text-ember"
        >
          Download export
        </button>
      </div>

      {/* Danger zone */}
      <div className="mt-lg rounded-[10px] border border-red-900/30 bg-red-900/10 p-lg">
        <h3 className="font-sans text-sm font-semibold text-red-400">Danger Zone</h3>
        <p className="mt-sm font-sans text-sm text-text-secondary">
          Deleting your account permanently removes all family data, learning entries, portfolio evidence, badge awards, and planner history. This cannot be undone.
        </p>
        {!showDelete ? (
          <button
            onClick={() => setShowDelete(true)}
            className="mt-md rounded-[6px] border border-red-900/30 bg-red-900/20 px-md py-sm font-sans text-sm font-semibold text-red-400 transition-all hover:bg-red-900/30"
          >
            Delete account
          </button>
        ) : (
          <div className="mt-md flex flex-col gap-sm">
            <p className="font-sans text-xs text-red-400">
              Type <strong>DELETE MY ACCOUNT</strong> to confirm:
            </p>
            <input
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
              className="w-full rounded-[6px] border border-red-900/30 bg-surface-raised px-md py-sm font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-red-400 focus:outline-none"
            />
            {error && <p className="font-sans text-xs text-red-400">{error}</p>}
            <div className="flex gap-sm">
              <button
                onClick={handleDelete}
                disabled={confirmation !== 'DELETE MY ACCOUNT' || deleting}
                className="rounded-[6px] bg-red-600 px-md py-sm font-sans text-sm font-semibold text-white transition-all hover:bg-red-500 disabled:opacity-40"
              >
                {deleting ? 'Deleting...' : 'Permanently delete'}
              </button>
              <button
                onClick={() => { setShowDelete(false); setConfirmation(''); setError(null); }}
                className="rounded-[6px] border border-border-subtle px-md py-sm font-sans text-sm text-text-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface FamilyMember {
  id: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string | null;
  invitedAt: string | null;
}

function FamilyAccessPanel() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadMembers() {
    try {
      const res = await fetch('/api/family/members');
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadMembers(); }, []);

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setError(null);
    setInviteLink(null);
    try {
      const res = await fetch('/api/family/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      if (res.ok) {
        const data = await res.json();
        const link = `${window.location.origin}/invite?token=${data.token}`;
        setInviteLink(link);
        setInviteEmail('');
        loadMembers();
      } else {
        const data = await res.json();
        setError(data.error ?? 'Failed to send invite');
      }
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(memberId: string) {
    const res = await fetch('/api/family/members', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    }
  }

  async function copyLink() {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink);
    }
  }

  return (
    <div className="flex flex-col gap-md">
      <div>
        <p className="mb-xs font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">Sharing</p>
        <h2 className="mb-md font-serif text-xl font-semibold text-text-primary">Family Access</h2>
        <p className="font-sans text-sm text-text-secondary">
          Invite another parent or tutor to view or contribute to your family&rsquo;s learning story.
        </p>
      </div>

      {/* Invite form */}
      <div className="rounded-[10px] border border-border-subtle bg-surface-panel p-md">
        <p className="mb-sm font-sans text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
          Invite a co-facilitator
        </p>
        <div className="flex flex-col gap-sm sm:flex-row sm:items-end">
          <div className="flex-1">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              placeholder="Email address"
              className="w-full rounded-[6px] border border-border-subtle bg-surface-raised px-md py-sm font-sans text-sm text-text-primary placeholder:text-text-muted focus:border-border-medium focus:outline-none"
            />
          </div>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
            className="rounded-[6px] border border-border-subtle bg-surface-raised px-md py-sm font-sans text-sm text-text-primary focus:border-border-medium focus:outline-none"
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            onClick={handleInvite}
            disabled={!inviteEmail.trim() || inviting}
            className="rounded-[6px] bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse transition-all hover:bg-ember-hover disabled:opacity-40"
          >
            {inviting ? 'Inviting...' : 'Invite'}
          </button>
        </div>
        {error && (
          <p className="mt-sm font-sans text-xs text-red-400">{error}</p>
        )}
        {inviteLink && (
          <div className="mt-sm rounded-[6px] border border-border-subtle bg-surface-raised p-sm">
            <p className="mb-xs font-sans text-xs text-text-muted">Share this link with them:</p>
            <div className="flex items-center gap-sm">
              <code className="flex-1 truncate font-mono text-xs text-text-secondary">{inviteLink}</code>
              <button
                onClick={copyLink}
                className="shrink-0 rounded-[6px] border border-border-subtle px-sm py-xs font-sans text-xs text-text-secondary hover:text-text-primary"
              >
                Copy
              </button>
            </div>
          </div>
        )}
        <p className="mt-sm font-sans text-xs text-text-muted">
          Editors can log entries, add to the planner, and run modules. Viewers can see the dashboard and portfolio.
        </p>
      </div>

      {/* Members list */}
      {loading ? (
        <p className="font-sans text-sm text-text-muted">Loading...</p>
      ) : members.length === 0 ? (
        <EmptyState
          icon={Key}
          heading="No co-facilitators yet"
          body="Invite someone above to share access to your family's Hearth."
        />
      ) : (
        <div className="flex flex-col gap-sm">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-[10px] border border-border-subtle bg-surface-panel px-md py-sm"
            >
              <div className="flex flex-col">
                <span className="font-sans text-sm font-medium text-text-primary">{member.email}</span>
                <span className="font-sans text-xs text-text-muted">
                  {member.role === 'editor' ? 'Editor' : 'Viewer'}
                  {member.status === 'invited' && ' — Pending invite'}
                  {member.status === 'active' && member.joinedAt && ` — Joined ${new Date(member.joinedAt).toLocaleDateString()}`}
                </span>
              </div>
              <button
                onClick={() => handleRemove(member.id)}
                className="rounded-[6px] border border-red-900/30 bg-red-900/20 px-sm py-xs font-sans text-xs text-red-400 transition-all hover:bg-red-900/30"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface Child {
  id: string;
  name: string;
  colourToken: string | null;
  dateOfBirth: string | null;
}

interface SettingsData {
  familyName: string;
  pedagogyPreference: string;
  values: string[];
  practices: string[];
  registrationNumber: string;
  nextReportDate: string;
  state: string | null;
  notificationPrefs: Record<string, unknown>;
}

interface SettingsClientProps {
  initialSettings: SettingsData;
  initialChildren: Child[];
}

type Tab = 'profile' | 'children' | 'pedagogy' | 'reporting' | 'notifications' | 'access' | 'account' | 'billing';

type TabIcon = ComponentType<{ size?: number; weight?: 'regular' | 'fill' }>;

const TABS: { id: Tab; label: string; Icon: TabIcon }[] = [
  { id: 'profile',       label: 'Family Profile',     Icon: House },
  { id: 'children',      label: 'Our Learners',       Icon: UsersThree },
  { id: 'pedagogy',      label: 'Learning Approach',  Icon: Compass },
  { id: 'reporting',     label: 'Reporting',          Icon: ShieldCheck },
  { id: 'notifications', label: 'Notifications',      Icon: Bell },
  { id: 'access',        label: 'Family Access',      Icon: Key },
  { id: 'account',       label: 'Account & Security', Icon: ShieldStar },
  { id: 'billing',       label: 'Subscription',       Icon: Diamond },
];

const VALID_TABS = new Set<Tab>(TABS.map((t) => t.id));
function isValidTab(value: string | null): value is Tab {
  return value !== null && VALID_TABS.has(value as Tab);
}

export default function SettingsClient({
  initialSettings,
  initialChildren,
}: SettingsClientProps) {
  // Deep-link: the mobile header Settings menu links to /settings?tab=<id>.
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<Tab>(() =>
    isValidTab(tabParam) ? tabParam : 'profile',
  );
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync tab when the ?tab= deep-link changes
    if (isValidTab(tabParam)) setActiveTab(tabParam);
  }, [tabParam]);
  const [settings, setSettings] = useState(initialSettings);
  const [children, setChildren] = useState<Child[]>(initialChildren);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildColour, setNewChildColour] = useState('rose');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  async function handleWizardComplete(result: PedagogyWizardResult) {
    const philosophy: Pedagogy = result.philosophy ?? 'eclectic';
    await saveSettings({
      pedagogyPreference: philosophy,
      values: result.values,
      practices: result.practices,
    });
    track('pedagogy_set', {
      philosophy,
      value_count: result.values.length,
      practice_count: result.practices.length,
      source: 'settings_wizard',
    });
    setWizardOpen(false);
  }

  const currentPhilosophy: Pedagogy | null = (PEDAGOGIES as readonly string[]).includes(
    settings.pedagogyPreference,
  )
    ? (settings.pedagogyPreference as Pedagogy)
    : null;

  async function saveSettings(patch: Partial<SettingsData>) {
    setSaving(true);
    setSaved(false);
    try {
      const next = { ...settings, ...patch };
      setSettings(next);

      const { familyName, ...settingsFields } = next;

      await Promise.all([
        fetch('/api/family', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ familyName }),
        }),
        fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pedagogyPreference: settingsFields.pedagogyPreference,
            pedagogyValues: settingsFields.values,
            pedagogyPractices: settingsFields.practices,
            registrationNumber: settingsFields.registrationNumber || undefined,
            nextReportDate: settingsFields.nextReportDate || undefined,
            state: settingsFields.state,
            notificationPrefs: settingsFields.notificationPrefs,
          }),
        }),
      ]);

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddChild() {
    if (!newChildName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/learners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newChildName.trim(), colourToken: newChildColour }),
      });
      if (res.ok) {
        const child = await res.json();
        setChildren((prev) => [...prev, child]);
        setNewChildName('');
        setNewChildColour('rose');
        setAddingChild(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateChild(id: string, data: { name: string; colourToken: string }) {
    const res = await fetch(`/api/learners/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setChildren((prev) => prev.map((c) => (c.id === id ? updated : c)));
    }
  }

  async function handleDeleteChild(id: string) {
    const res = await fetch(`/api/learners/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setChildren((prev) => prev.filter((c) => c.id !== id));
    }
  }

  const CHILD_COLOURS = [
    { token: 'rose', bg: 'bg-child-rose' },
    { token: 'blue', bg: 'bg-child-blue' },
    { token: 'sage', bg: 'bg-child-sage' },
    { token: 'amber', bg: 'bg-amber-status' },
  ];

  return (
    <div className="mx-auto max-w-[1100px] px-md py-xl">
      <div className="mb-xl flex items-center justify-between gap-md">
        <h1 className="font-serif text-2xl font-semibold text-text-primary">Settings</h1>
        <FeedbackButton />
      </div>

      {/* Tab bar — mobile only */}
      <div className="mb-xl flex overflow-x-auto overscroll-x-contain scrollbar-none border-b border-border-subtle pb-[1px] lg:hidden">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-md pb-sm font-sans text-sm font-semibold transition-colors duration-[var(--motion-quick)] ${
              activeTab === tab.id
                ? 'border-b-2 border-ember text-ember'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mobile sidebar toggle button */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="md:hidden mb-md flex items-center gap-sm font-sans text-sm font-medium text-text-secondary border border-border-subtle rounded-md px-md py-sm transition-all duration-[var(--motion-quick)] ease-[var(--ease-default)] hover:border-border-medium hover:text-text-primary"
      >
        {sidebarOpen
          ? <span className="inline-flex items-center gap-xs"><ArrowLeft size={14} aria-hidden="true" /> Hide menu</span>
          : <span className="inline-flex items-center gap-xs"><List size={14} aria-hidden="true" /> Settings menu</span>}
      </button>

      <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-xl lg:items-start">
        {/* Sidebar nav — hidden on mobile unless open, always visible on md+ */}
        <nav className={`md:block ${sidebarOpen ? 'block' : 'hidden'} flex flex-col gap-xs sticky top-[80px]`}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSidebarOpen(false);
              }}
              className={`flex items-center gap-sm rounded-md px-md py-sm text-left font-sans text-[0.875rem] font-medium transition-all duration-[var(--motion-quick)] ease-[var(--ease-default)] border ${
                activeTab === tab.id
                  ? 'border-border-medium bg-surface-raised text-ember shadow-card'
                  : 'border-transparent text-text-secondary hover:border-border-subtle hover:bg-ember-glow hover:text-text-primary'
              }`}
            >
              <tab.Icon size={18} aria-hidden="true" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content panel */}
        <div>

      {/* ─── Family Profile ─── */}
      {activeTab === 'profile' && (
        <div className="flex flex-col gap-md">
          <div>
            <p className="mb-xs font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">Identity</p>
            <h2 className="mb-md font-serif text-xl font-semibold text-text-primary">Family Profile</h2>
          </div>
          <div>
            <label className="mb-xs block font-sans text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
              Family Name
            </label>
            <input
              type="text"
              value={settings.familyName}
              onChange={(e) => setSettings((s) => ({ ...s, familyName: e.target.value }))}
              className="w-full rounded-[6px] border border-border-subtle bg-surface-raised px-md py-sm font-serif text-base text-text-primary placeholder:text-text-muted focus:border-border-medium focus:outline-none"
              placeholder="e.g. The Smiths"
            />
          </div>
          <button
            onClick={() => saveSettings({})}
            disabled={saving}
            className="self-start rounded-[6px] bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse transition-all hover:bg-ember-hover disabled:opacity-40"
          >
            {saving
              ? 'Saving…'
              : saved
                ? <span className="inline-flex items-center gap-xs">Saved <Check size={14} aria-hidden="true" /></span>
                : 'Save changes'}
          </button>
        </div>
      )}

      {/* ─── Children ─── */}
      {activeTab === 'children' && (
        <div className="flex flex-col gap-sm">
          <div className="mb-sm">
            <p className="mb-xs font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">Learners</p>
            <h2 className="font-serif text-xl font-semibold text-text-primary">Our Learners</h2>
          </div>
          {children.length === 0 && !addingChild && (
            <div className="rounded-[10px] border border-border-subtle bg-surface-panel px-md py-xl text-center">
              <p className="font-serif text-base text-text-secondary">No children added yet.</p>
            </div>
          )}

          {children.map((child) => (
            <ChildCard
              key={child.id}
              child={child}
              onUpdate={handleUpdateChild}
              onDelete={handleDeleteChild}
            />
          ))}

          {addingChild ? (
            <div className="rounded-[10px] border border-border-medium bg-surface-raised p-md">
              <div className="flex flex-col gap-md">
                <input
                  type="text"
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddChild()}
                  placeholder="Child's name"
                  autoFocus
                  className="w-full rounded-[6px] border border-border-subtle bg-surface-panel px-md py-sm font-serif text-base text-text-primary placeholder:text-text-muted focus:border-border-medium focus:outline-none"
                />
                <div>
                  <p className="mb-sm font-sans text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
                    Colour
                  </p>
                  <div className="flex gap-sm">
                    {CHILD_COLOURS.map((c) => (
                      <button
                        key={c.token}
                        onClick={() => setNewChildColour(c.token)}
                        aria-label={`Colour ${c.token}`}
                        className={`h-8 w-8 rounded-full transition-all duration-[var(--motion-quick)] ${c.bg} ${
                          newChildColour === c.token ? 'ring-2 ring-offset-2 ring-offset-surface-raised ring-ember' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-sm">
                  <button
                    onClick={handleAddChild}
                    disabled={!newChildName.trim() || saving}
                    className="flex-1 rounded-[6px] bg-ember py-sm font-sans text-sm font-semibold text-text-inverse transition-all hover:bg-ember-hover disabled:opacity-40"
                  >
                    {saving ? 'Adding...' : 'Add child'}
                  </button>
                  <button
                    onClick={() => { setAddingChild(false); setNewChildName(''); }}
                    className="rounded-[6px] border border-border-subtle px-md py-sm font-sans text-sm text-text-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingChild(true)}
              className="flex items-center gap-sm rounded-[10px] border border-dashed border-border-medium px-md py-sm font-sans text-sm text-text-muted transition-colors hover:border-ember hover:text-ember"
            >
              <span className="text-lg">+</span>
              Add a child
            </button>
          )}
        </div>
      )}

      {/* ─── Pedagogy ─── */}
      {activeTab === 'pedagogy' && (
        <div className="flex flex-col gap-lg">
          <div className="flex items-start justify-between gap-md">
            <div>
              <p className="mb-xs font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">Philosophy</p>
              <h2 className="mb-md font-serif text-xl font-semibold text-text-primary">Learning Approach</h2>
            </div>
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="flex-shrink-0 rounded-[6px] border border-border-subtle px-md py-xs font-sans text-xs font-semibold text-text-secondary hover:border-ember hover:text-ember transition-colors duration-[var(--motion-quick)]"
            >
              Re-run wizard
            </button>
          </div>
          <p className="font-sans text-sm text-text-secondary">
            Your pedagogy preference shapes how Hearth frames your family&rsquo;s learning insights.
            Content is always philosophy-neutral — this is for your lens only.
          </p>
          <PedagogySelector
            selected={settings.pedagogyPreference}
            onChange={(value) => {
              setSettings((s) => ({ ...s, pedagogyPreference: value }));
              saveSettings({ pedagogyPreference: value });
              if ((PEDAGOGIES as readonly string[]).includes(value)) {
                track('pedagogy_set', {
                  philosophy: value,
                  value_count: settings.values.length,
                  practice_count: settings.practices.length,
                  source: 'settings_inline',
                });
              }
            }}
          />
          <p className="font-sans text-xs text-text-muted mt-sm">
            Your philosophy shapes how Hearth interprets your learning logs.{' '}
            <a href="/settings?tab=pedagogy" className="text-ember underline underline-offset-2 hover:text-ember-hover transition-colors duration-[var(--motion-quick)]">
              Update any time
            </a>
          </p>
          {/* Learning values & practices */}
          <div className="mt-md">
            <PedagogyProfilePanel
              philosophy={settings.pedagogyPreference}
              selectedValues={settings.values}
              selectedPractices={settings.practices}
              onValuesChange={(values) => {
                setSettings((s) => ({ ...s, values }));
                saveSettings({ values });
              }}
              onPracticesChange={(practices) => {
                setSettings((s) => ({ ...s, practices }));
                saveSettings({ practices });
              }}
            />
          </div>
          <PedagogyLearnMore pedagogyKey={settings.pedagogyPreference} />
          {saved && (
            <p className="inline-flex items-center gap-xs font-sans text-xs text-sage">Saved <Check size={12} aria-hidden="true" /></p>
          )}
        </div>
      )}

      {/* ─── Reporting ─── */}
      {activeTab === 'reporting' && (
        <div className="flex flex-col gap-lg">
          <div>
            {(() => {
              const config = getJurisdiction(settings.state);
              return (
                <>
                  <p className="mb-xs font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">
                    {config.abbreviation} {config.regulatoryBodyShort}
                  </p>
                  <h2 className="mb-md font-serif text-xl font-semibold text-text-primary">Reporting</h2>
                </>
              );
            })()}
          </div>
          <ReportingFields
            registrationNumber={settings.registrationNumber}
            nextReportDate={settings.nextReportDate}
            state={settings.state ?? ''}
            onChange={(field, value) => setSettings((s) => ({ ...s, [field]: value }))}
          />
          <button
            onClick={() => saveSettings({})}
            disabled={saving}
            className="self-start rounded-[6px] bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse transition-all hover:bg-ember-hover disabled:opacity-40"
          >
            {saving
              ? 'Saving…'
              : saved
                ? <span className="inline-flex items-center gap-xs">Saved <Check size={14} aria-hidden="true" /></span>
                : 'Save changes'}
          </button>
        </div>
      )}

      {/* ─── Notifications ─── */}
      {activeTab === 'notifications' && (
        <div className="flex flex-col gap-lg">
          <div>
            <p className="mb-xs font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">Preferences</p>
            <h2 className="mb-md font-serif text-xl font-semibold text-text-primary">Notifications</h2>
          </div>
          <NotificationPreferences
            prefs={settings.notificationPrefs as { dailyReminder?: boolean; weeklyDigest?: boolean; complianceAlerts?: boolean }}
            onChange={(prefs) => {
              setSettings((s) => ({ ...s, notificationPrefs: prefs as Record<string, unknown> }));
              saveSettings({ notificationPrefs: prefs as Record<string, unknown> });
            }}
          />
          {saved && (
            <p className="inline-flex items-center gap-xs font-sans text-xs text-sage">Saved <Check size={12} aria-hidden="true" /></p>
          )}
        </div>
      )}

      {/* ─── Family Access ─── */}
      {activeTab === 'access' && (
        <FamilyAccessPanel />
      )}

      {/* ─── Account & Security ─── */}
      {activeTab === 'account' && (
        <AccountSecurityPanel />
      )}

      {/* ─── Billing ─── */}
      {activeTab === 'billing' && (
        <div className="flex flex-col gap-md">
          <div>
            <p className="mb-xs font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">Membership</p>
            <h2 className="mb-md font-serif text-xl font-semibold text-text-primary">Subscription</h2>
          </div>
          <div className="rounded-[10px] border border-border-subtle bg-surface-panel p-lg text-center">
            <span className="inline-flex text-ember" aria-hidden="true">
              <FlowerLotus size={32} />
            </span>
            <h2 className="mt-md font-serif text-xl font-semibold text-text-primary">
              Founding Member
            </h2>
            <p className="mt-xs font-sans text-sm text-text-secondary">
              Full access included. Thank you for being here from the start.
            </p>
          </div>
          <p className="font-sans text-xs text-text-muted text-center">
            Billing management will be available when Hearth opens to wider membership.
          </p>
        </div>
      )}
        </div>{/* end content panel */}
      </div>{/* end grid */}

      {wizardOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-surface-body">
          <PedagogyWizard
            initial={{
              philosophy: currentPhilosophy,
              values: settings.values,
              practices: settings.practices,
            }}
            onComplete={handleWizardComplete}
            onClose={() => setWizardOpen(false)}
            saving={saving}
            completeLabel="Save Approach"
          />
        </div>
      )}
    </div>
  );
}
