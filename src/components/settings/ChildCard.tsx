'use client';

import { useState } from 'react';

interface ChildCardProps {
  child: {
    id: string;
    name: string;
    colourToken: string | null;
    dateOfBirth: string | null;
  };
  onUpdate: (id: string, data: { name: string; colourToken: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const COLOURS = [
  { token: 'rose', label: 'Rose', bg: 'bg-child-rose', ring: 'ring-child-rose' },
  { token: 'blue', label: 'Blue', bg: 'bg-child-blue', ring: 'ring-child-blue' },
  { token: 'sage', label: 'Sage', bg: 'bg-child-sage', ring: 'ring-child-sage' },
  { token: 'amber', label: 'Amber', bg: 'bg-amber-status', ring: 'ring-amber-status' },
] as const;

function ageFromDob(dob: string | null): string {
  if (!dob) return '';
  const birth = new Date(dob);
  const now = new Date();
  const age = now.getFullYear() - birth.getFullYear();
  return `${age} yrs`;
}

export default function ChildCard({ child, onUpdate, onDelete }: ChildCardProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(child.name);
  const [colour, setColour] = useState(child.colourToken ?? 'rose');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const currentColour = COLOURS.find((c) => c.token === (child.colourToken ?? 'rose')) ?? COLOURS[0];

  async function handleSave() {
    setSaving(true);
    try {
      await onUpdate(child.id, { name, colourToken: colour });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await onDelete(child.id);
    } finally {
      setSaving(false);
      setConfirmDelete(false);
    }
  }

  if (editing) {
    return (
      <div className="rounded-[10px] border border-border-medium bg-surface-raised p-md">
        <div className="flex flex-col gap-md">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-[6px] border border-border-subtle bg-surface-panel px-md py-sm font-serif text-base text-text-primary placeholder:text-text-muted focus:border-border-medium focus:outline-none"
            placeholder="Child's name"
            autoFocus
          />
          <div>
            <p className="mb-sm font-sans text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
              Colour
            </p>
            <div className="flex gap-sm">
              {COLOURS.map((c) => (
                <button
                  key={c.token}
                  onClick={() => setColour(c.token)}
                  className={`h-8 w-8 rounded-full transition-all duration-[var(--motion-quick)] ${c.bg} ${
                    colour === c.token ? `ring-2 ring-offset-2 ring-offset-surface-raised ${c.ring}` : ''
                  }`}
                  aria-label={c.label}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-sm">
            <button
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className="flex-1 rounded-[6px] bg-ember py-sm font-sans text-sm font-semibold text-text-inverse transition-all hover:bg-ember-hover disabled:opacity-40"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => { setEditing(false); setName(child.name); setColour(child.colourToken ?? 'rose'); }}
              className="rounded-[6px] border border-border-subtle px-md py-sm font-sans text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-md rounded-[10px] border border-border-subtle bg-surface-panel p-md transition-all duration-[var(--motion-gentle)] hover:border-border-medium">
      {/* Colour swatch */}
      <div className={`h-9 w-9 flex-shrink-0 rounded-full ${currentColour.bg} flex items-center justify-center`}>
        <span className="font-sans text-sm font-semibold text-text-inverse">
          {child.name.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1">
        <p className="font-serif text-base font-semibold text-text-primary">{child.name}</p>
        {child.dateOfBirth && (
          <p className="font-sans text-xs text-text-muted">{ageFromDob(child.dateOfBirth)}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-xs">
        <button
          onClick={() => setEditing(true)}
          className="rounded-[6px] border border-border-subtle px-sm py-xs font-sans text-xs text-text-muted transition-colors hover:border-border-medium hover:text-text-secondary"
        >
          Edit
        </button>
        {confirmDelete ? (
          <div className="flex gap-xs">
            <button
              onClick={handleDelete}
              disabled={saving}
              className="rounded-[6px] bg-red-900/20 px-sm py-xs font-sans text-xs font-semibold text-red-400 transition-colors hover:bg-red-900/30 disabled:opacity-40"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-[6px] border border-border-subtle px-sm py-xs font-sans text-xs text-text-muted"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded-[6px] px-sm py-xs font-sans text-xs text-text-muted transition-colors hover:text-red-400"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
