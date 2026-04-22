'use client';

import { useState, useCallback } from 'react';
import type { StudioState, StudioAction, Selection, AssetDraft, AssetKind, AssetLicense, AgeBand } from '@/lib/content-studio/types';
import { ASSET_KINDS, ASSET_LICENSES, AGE_BANDS, CONTENT_STATUSES } from '@/lib/content-studio/types';
import { createEmptyAsset } from '@/lib/content-studio/factories';
import { Panel } from './primitives/Panel';
import { FormField, Input, TextArea, Select } from './primitives/FormField';
import { TagInput } from './primitives/TagInput';
import type { SanityAssetOption, SanityCommonsTextOption } from '../ContentStudioClient';

const kindLabels: Record<string, string> = {
  template: 'Template',
  worksheet: 'Worksheet',
  reference: 'Reference',
  card_set: 'Card Set',
  handout: 'Handout',
  audio: 'Audio',
  manipulative: 'Manipulative',
};

const licenseLabels: Record<string, string> = {
  hearth_proprietary: 'Hearth Proprietary',
  cc_by: 'CC BY',
  cc_by_sa: 'CC BY-SA',
  public_domain: 'Public Domain',
  commissioned: 'Commissioned',
  fair_use_reference: 'Fair Use Reference',
};

interface Props {
  state: StudioState;
  dispatch: (action: StudioAction) => void;
  sel: Selection | null;
  setSel: (sel: Selection | null) => void;
  setField: (path: (string | number)[], value: unknown) => void;
  sanityAssets: SanityAssetOption[];
  sanityCommonsTexts: SanityCommonsTextOption[];
}

export function AssetLibraryTab({ state, dispatch, sel, setSel, setField, sanityAssets }: Props) {
  const [filterKind, setFilterKind] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [search, setSearch] = useState('');

  const assets = state.assets ?? [];

  const filtered = assets.filter((a) => {
    if (filterKind && a.kind !== filterKind) return false;
    if (filterStatus && a.status !== filterStatus) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selectedIndex = sel?.scope === 'asset' ? sel.index : null;
  const selectedAsset = selectedIndex != null ? assets[selectedIndex] : null;

  const handleAdd = useCallback(() => {
    const asset = createEmptyAsset('New Asset');
    dispatch({ type: 'ADD_ASSET', asset });
    setSel({ scope: 'asset', index: assets.length, type: 'asset' });
  }, [dispatch, setSel, assets.length]);

  const handleSelect = useCallback((index: number) => {
    setSel({ scope: 'asset', index, type: 'asset' });
  }, [setSel]);

  const handleDelete = useCallback(() => {
    if (selectedIndex == null) return;
    dispatch({ type: 'DELETE_ASSET', index: selectedIndex });
    setSel(null);
  }, [dispatch, setSel, selectedIndex]);

  const f = (field: string) => ['assets', selectedIndex!, field];

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || selectedIndex == null) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify({
      title: selectedAsset?.title || file.name,
      kind: selectedAsset?.kind || 'template',
      license: selectedAsset?.license || 'hearth_proprietary',
    }));

    try {
      const res = await fetch('/api/admin/content/assets', { method: 'POST', body: formData });
      if (res.ok) {
        const doc = await res.json();
        setField(f('file'), { assetId: doc._id, filename: file.name });
      }
    } catch {
      // Upload failed — user can retry
    }
  }, [selectedIndex, selectedAsset, setField]);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Asset list */}
      <div className="w-80 border-r border-border-subtle bg-surface-panel flex flex-col shrink-0">
        <div className="p-md border-b border-border-subtle space-y-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets..."
            className="w-full px-3 py-2 bg-surface-raised border border-border-subtle rounded-[8px] text-text-primary font-sans text-xs outline-none focus:border-ember placeholder:text-text-muted/60"
          />
          <div className="flex gap-2">
            <select
              value={filterKind}
              onChange={(e) => setFilterKind(e.target.value)}
              className="flex-1 px-2 py-1.5 bg-surface-raised border border-border-subtle rounded-[6px] text-text-primary font-sans text-[0.7rem] outline-none"
            >
              <option value="">All kinds</option>
              {ASSET_KINDS.map((k) => <option key={k} value={k}>{kindLabels[k]}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 px-2 py-1.5 bg-surface-raised border border-border-subtle rounded-[6px] text-text-primary font-sans text-[0.7rem] outline-none"
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.map((asset, i) => {
            const realIndex = assets.indexOf(asset);
            return (
              <button
                key={asset._key}
                type="button"
                onClick={() => handleSelect(realIndex)}
                className={`w-full text-left px-md py-sm border-b border-border-subtle transition-colors ${
                  selectedIndex === realIndex
                    ? 'bg-ember/10 border-l-2 border-l-ember'
                    : 'hover:bg-surface-hover'
                }`}
              >
                <div className="font-sans text-xs font-medium text-text-primary truncate">{asset.title || 'Untitled'}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-sans text-[0.65rem] text-text-muted capitalize">{kindLabels[asset.kind] || asset.kind}</span>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${asset.status === 'published' ? 'bg-sage' : 'bg-text-muted/40'}`} />
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-md text-center text-text-muted font-sans text-xs">No assets found</div>
          )}
        </div>

        <div className="p-md border-t border-border-subtle">
          <button
            type="button"
            onClick={handleAdd}
            className="w-full px-4 py-2.5 bg-ember text-text-inverse font-sans text-xs font-semibold rounded-[8px] hover:bg-ember-hover transition-colors"
          >
            + New Asset
          </button>
        </div>
      </div>

      {/* Asset editor */}
      <div className="flex-1 overflow-y-auto px-xl py-xl">
        {!selectedAsset && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-md">📎</div>
            <h2 className="font-serif text-lg font-semibold mb-sm">Asset Library</h2>
            <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
              Manage printable templates, worksheets, reference imagery, and media files.
              Select an asset or create a new one.
            </p>
          </div>
        )}

        {selectedAsset && selectedIndex != null && (
          <div className="max-w-3xl">
            <div className="mb-lg px-3.5 py-2.5 bg-surface-panel border border-border-subtle rounded-[8px] flex items-center gap-3">
              <span className="text-[0.65rem] font-semibold text-text-muted uppercase tracking-[0.05em] font-sans">Sanity _id</span>
              <code className="font-mono text-xs text-ember flex-1">
                asset.{selectedAsset.kind}.{selectedAsset.title ? selectedAsset.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : 'untitled'}
              </code>
            </div>

            <Panel title="Asset Identity" emoji="📄">
              <FormField label="Title" required>
                <Input value={selectedAsset.title} onChange={(v) => setField(f('title'), v)} placeholder="e.g., Story Arc Three-Box Map" />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Kind" required>
                  <Select
                    value={selectedAsset.kind}
                    onChange={(v) => setField(f('kind'), v)}
                    options={ASSET_KINDS.map((k) => ({ value: k, label: kindLabels[k] }))}
                  />
                </FormField>
                <FormField label="Age Band">
                  <Select
                    value={selectedAsset.ageBand}
                    onChange={(v) => setField(f('ageBand'), v)}
                    options={AGE_BANDS.map((b) => ({ value: b, label: b === 'all' ? 'All ages' : `Ages ${b}` }))}
                  />
                </FormField>
              </div>
              <FormField label="Description">
                <TextArea value={selectedAsset.description} onChange={(v) => setField(f('description'), v)} rows={3} />
              </FormField>
              <FormField label="Print Guidance" hint='e.g. "Print A4 portrait, B&W friendly"'>
                <TextArea value={selectedAsset.printGuidance} onChange={(v) => setField(f('printGuidance'), v)} rows={2} />
              </FormField>
              <FormField label="Page Count">
                <Input value={selectedAsset.pageCount} onChange={(v) => setField(f('pageCount'), v)} type="number" />
              </FormField>
            </Panel>

            <Panel title="File Upload" emoji="📁">
              <FormField label="File" hint="PDF, PNG, JPG, MP3, etc.">
                {selectedAsset.file ? (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 bg-surface-raised border border-border-subtle rounded-[8px]">
                    <span className="font-sans text-xs text-sage">Uploaded</span>
                    <span className="font-mono text-xs text-text-muted truncate">{selectedAsset.file.filename}</span>
                  </div>
                ) : (
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="w-full px-3.5 py-2.5 bg-surface-raised border border-border-subtle rounded-[8px] text-text-primary font-sans text-sm file:mr-3 file:bg-ember file:text-text-inverse file:border-0 file:rounded-[6px] file:px-3 file:py-1 file:text-xs file:font-semibold file:cursor-pointer"
                  />
                )}
              </FormField>
            </Panel>

            <Panel title="License & Source" emoji="⚖️">
              <FormField label="License" required>
                <Select
                  value={selectedAsset.license}
                  onChange={(v) => setField(f('license'), v)}
                  options={ASSET_LICENSES.map((l) => ({ value: l, label: licenseLabels[l] }))}
                />
              </FormField>
              <FormField label="Source" hint="Attribution string if applicable">
                <TextArea value={selectedAsset.source} onChange={(v) => setField(f('source'), v)} rows={2} />
              </FormField>
              <FormField label="Source URL">
                <Input value={selectedAsset.sourceUrl} onChange={(v) => setField(f('sourceUrl'), v)} type="url" placeholder="https://..." />
              </FormField>
            </Panel>

            <Panel title="Discovery" emoji="🔍" defaultOpen={false}>
              <FormField label="Tags">
                <TagInput
                  values={selectedAsset.tags}
                  onChange={(v) => setField(f('tags'), v)}
                  placeholder="Type a tag and press Enter"
                />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Status">
                  <Select
                    value={selectedAsset.status}
                    onChange={(v) => setField(f('status'), v)}
                    options={CONTENT_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
                  />
                </FormField>
                <FormField label="Version">
                  <Input value={selectedAsset.version} onChange={(v) => setField(f('version'), v)} type="number" />
                </FormField>
              </div>
            </Panel>

            <div className="mt-lg flex justify-end">
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-sans text-red-400 hover:text-red-300 border border-red-900/30 rounded-[8px] transition-colors"
              >
                Delete Asset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
