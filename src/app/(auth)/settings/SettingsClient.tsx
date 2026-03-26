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

type Tab = 'profile' | 'children' | 'pedagogy' | 'heu' | 'notifications' | 'billing';

const TABS: { id: Tab; label: string }[] = [
  { id: 'profile', label: 'Family Profile' },
  { id: 'children', label: 'Children' },
  { id: 'pedagogy', label: 'Pedagogy' },
  { id: 'heu', label: 'HEU Compliance' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'billing', label: 'Billing' },
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
    <div className="mx-auto max-w-2xl px-md py-xl">
      <h1 className="mb-xl font-serif text-2xl font-semibold text-text-primary">Settings</h1>

      {/* Tab bar */}
      <div className="mb-xl flex overflow-x-auto border-b border-border-subtle pb-[1px]">
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

      {/* ─── Family Profile ─── */}
      {activeTab === 'profile' && (
        <div className="flex flex-col gap-md">
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

      {/* ─── Billing ─── */}
      {activeTab === 'billing' && (
        <div className="flex flex-col gap-md">
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
    </div>
  );
}
