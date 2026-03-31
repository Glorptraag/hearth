'use client';

import { useState } from 'react';
import ChildCard from '@/components/settings/ChildCard';
import PedagogySelector from '@/components/settings/PedagogySelector';
import HEUFields from '@/components/settings/HEUFields';
import NotificationPreferences from '@/components/settings/NotificationPreferences';

interface Child {
  id: string;
  name: string;
  colourToken: string | null;
  dateOfBirth: string | null;
}

interface SettingsData {
  familyName: string;
  pedagogyPreference: string;
  heuRegistrationNumber: string;
  heuNextReportDate: string;
  state: string;
  notificationPrefs: Record<string, unknown>;
}

interface SettingsClientProps {
  initialSettings: SettingsData;
  initialChildren: Child[];
}

type Tab = 'profile' | 'children' | 'pedagogy' | 'heu' | 'notifications' | 'access' | 'account' | 'billing';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'profile', label: 'Family Profile', emoji: '🏡' },
  { id: 'children', label: 'Our Learners', emoji: '👧' },
  { id: 'pedagogy', label: 'Learning Approach', emoji: '🌿' },
  { id: 'heu', label: 'Compliance', emoji: '📋' },
  { id: 'notifications', label: 'Notifications', emoji: '🔔' },
  { id: 'access', label: 'Family Access', emoji: '🔑' },
  { id: 'account', label: 'Account & Security', emoji: '🛡️' },
  { id: 'billing', label: 'Subscription', emoji: '💎' },
];

export default function SettingsClient({
  initialSettings,
  initialChildren,
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [settings, setSettings] = useState(initialSettings);
  const [children, setChildren] = useState<Child[]>(initialChildren);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildColour, setNewChildColour] = useState('rose');

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
            heuRegistrationNumber: settingsFields.heuRegistrationNumber || undefined,
            heuNextReportDate: settingsFields.heuNextReportDate || undefined,
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
    { token: 'amber', bg: 'bg-amber-400' },
  ];

  return (
    <div className="mx-auto max-w-[1100px] px-md py-xl">
      <h1 className="mb-xl font-serif text-2xl font-semibold text-text-primary">Settings</h1>

      {/* Tab bar — mobile only */}
      <div className="mb-xl flex overflow-x-auto border-b border-border-subtle pb-[1px] lg:hidden">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-md pb-sm font-sans text-sm font-semibold transition-colors duration-200 ${
              activeTab === tab.id
                ? 'border-b-2 border-ember text-ember'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-xl lg:items-start">
        {/* Sidebar nav — desktop only */}
        <nav className="hidden lg:flex flex-col gap-xs sticky top-[80px]">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-sm rounded-md px-md py-sm text-left font-sans text-[0.875rem] font-medium transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] border ${
                activeTab === tab.id
                  ? 'border-border-medium bg-surface-raised text-ember shadow-[var(--shadow-soft)]'
                  : 'border-transparent text-text-secondary hover:border-border-subtle hover:bg-ember-glow hover:text-text-primary'
              }`}
            >
              <span>{tab.emoji}</span>
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
            {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save changes'}
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
                        className={`h-7 w-7 rounded-full transition-all duration-200 ${c.bg} ${
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
          <div>
            <p className="mb-xs font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">Philosophy</p>
            <h2 className="mb-md font-serif text-xl font-semibold text-text-primary">Learning Approach</h2>
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
            }}
          />
          {saved && (
            <p className="font-sans text-xs text-sage">Saved ✓</p>
          )}
        </div>
      )}

      {/* ─── HEU Compliance ─── */}
      {activeTab === 'heu' && (
        <div className="flex flex-col gap-lg">
          <div>
            <p className="mb-xs font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">Queensland HEU</p>
            <h2 className="mb-md font-serif text-xl font-semibold text-text-primary">Compliance & Reporting</h2>
          </div>
          <HEUFields
            registrationNumber={settings.heuRegistrationNumber}
            nextReportDate={settings.heuNextReportDate}
            state={settings.state}
            onChange={(field, value) => setSettings((s) => ({ ...s, [field]: value }))}
          />
          <button
            onClick={() => saveSettings({})}
            disabled={saving}
            className="self-start rounded-[6px] bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse transition-all hover:bg-ember-hover disabled:opacity-40"
          >
            {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save changes'}
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
            <p className="font-sans text-xs text-sage">Saved ✓</p>
          )}
        </div>
      )}

      {/* ─── Family Access ─── */}
      {activeTab === 'access' && (
        <div className="flex flex-col gap-md">
          <div>
            <p className="mb-xs font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">Sharing</p>
            <h2 className="mb-md font-serif text-xl font-semibold text-text-primary">Family Access</h2>
          </div>
          <div className="rounded-[10px] border border-border-subtle bg-surface-panel p-lg text-center">
            <span className="text-3xl">🔑</span>
            <p className="mt-md font-serif text-base text-text-secondary">
              Invite co-facilitators and manage family access. Coming soon.
            </p>
          </div>
        </div>
      )}

      {/* ─── Account & Security ─── */}
      {activeTab === 'account' && (
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
        </div>
      )}

      {/* ─── Billing ─── */}
      {activeTab === 'billing' && (
        <div className="flex flex-col gap-md">
          <div>
            <p className="mb-xs font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">Membership</p>
            <h2 className="mb-md font-serif text-xl font-semibold text-text-primary">Subscription</h2>
          </div>
          <div className="rounded-[10px] border border-border-subtle bg-surface-panel p-lg text-center">
            <span className="text-3xl">🌿</span>
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
    </div>
  );
}
