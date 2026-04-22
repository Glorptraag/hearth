'use client';

import { useState, useCallback } from 'react';
import type { StudioState, StudioAction, Selection, CommonsTextDraft } from '@/lib/content-studio/types';
import { COMMONS_TEXT_KINDS, COMMONS_TEXT_LICENSES, TEXT_LENGTHS, READING_LEVELS, CONTENT_STATUSES } from '@/lib/content-studio/types';
import { createEmptyCommonsText } from '@/lib/content-studio/factories';
import { Panel } from './primitives/Panel';
import { FormField, Input, TextArea, Select } from './primitives/FormField';
import { TagInput } from './primitives/TagInput';
import type { SanityAssetOption } from '../ContentStudioClient';

const kindLabels: Record<string, string> = {
  fable: 'Fable',
  fairy_tale: 'Fairy Tale',
  folk_tale: 'Folk Tale',
  scripture: 'Scripture',
  parable: 'Parable',
  psalm: 'Psalm',
  proverb: 'Proverb',
  poem: 'Poem',
  nursery_rhyme: 'Nursery Rhyme',
  myth: 'Myth',
  primary_source: 'Primary Source',
  story: 'Story',
};

interface Props {
  state: StudioState;
  dispatch: (action: StudioAction) => void;
  sel: Selection | null;
  setSel: (sel: Selection | null) => void;
  setField: (path: (string | number)[], value: unknown) => void;
  sanityAssets: SanityAssetOption[];
}

export function CommonsTextTab({ state, dispatch, sel, setSel, setField }: Props) {
  const [filterKind, setFilterKind] = useState<string>('');
  const [filterTradition, setFilterTradition] = useState('');
  const [search, setSearch] = useState('');
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkJson, setBulkJson] = useState('');
  const [bulkError, setBulkError] = useState('');

  const texts = state.commonsTexts ?? [];

  const filtered = texts.filter((t) => {
    if (filterKind && t.kind !== filterKind) return false;
    if (filterTradition && !t.tradition.toLowerCase().includes(filterTradition.toLowerCase())) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selectedIndex = sel?.scope === 'commonsText' ? sel.index : null;
  const selectedText = selectedIndex != null ? texts[selectedIndex] : null;

  const handleAdd = useCallback(() => {
    const text = createEmptyCommonsText('New Text');
    dispatch({ type: 'ADD_COMMONS_TEXT', text });
    setSel({ scope: 'commonsText', index: texts.length, type: 'commonsText' });
  }, [dispatch, setSel, texts.length]);

  const handleSelect = useCallback((index: number) => {
    setSel({ scope: 'commonsText', index, type: 'commonsText' });
  }, [setSel]);

  const handleDelete = useCallback(() => {
    if (selectedIndex == null) return;
    dispatch({ type: 'DELETE_COMMONS_TEXT', index: selectedIndex });
    setSel(null);
  }, [dispatch, setSel, selectedIndex]);

  const handleBulkImport = useCallback(() => {
    try {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed)) {
        setBulkError('JSON must be an array');
        return;
      }
      const drafts: CommonsTextDraft[] = parsed.map((item: Record<string, unknown>) => ({
        ...createEmptyCommonsText(item.title as string || ''),
        ...item,
        _key: crypto.randomUUID().slice(0, 8),
      }));
      dispatch({ type: 'BULK_IMPORT_COMMONS_TEXTS', texts: drafts });
      setBulkImportOpen(false);
      setBulkJson('');
      setBulkError('');
    } catch (e) {
      setBulkError('Invalid JSON');
    }
  }, [bulkJson, dispatch]);

  const f = (field: string) => ['commonsTexts', selectedIndex!, field];

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Text list */}
      <div className="w-80 border-r border-border-subtle bg-surface-panel flex flex-col shrink-0">
        <div className="p-md border-b border-border-subtle space-y-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search texts..."
            className="w-full px-3 py-2 bg-surface-raised border border-border-subtle rounded-[8px] text-text-primary font-sans text-xs outline-none focus:border-ember placeholder:text-text-muted/60"
          />
          <div className="flex gap-2">
            <select
              value={filterKind}
              onChange={(e) => setFilterKind(e.target.value)}
              className="flex-1 px-2 py-1.5 bg-surface-raised border border-border-subtle rounded-[6px] text-text-primary font-sans text-[0.7rem] outline-none"
            >
              <option value="">All kinds</option>
              {COMMONS_TEXT_KINDS.map((k) => <option key={k} value={k}>{kindLabels[k]}</option>)}
            </select>
            <input
              type="text"
              value={filterTradition}
              onChange={(e) => setFilterTradition(e.target.value)}
              placeholder="Tradition..."
              className="flex-1 px-2 py-1.5 bg-surface-raised border border-border-subtle rounded-[6px] text-text-primary font-sans text-[0.7rem] outline-none placeholder:text-text-muted/60"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.map((text) => {
            const realIndex = texts.indexOf(text);
            return (
              <button
                key={text._key}
                type="button"
                onClick={() => handleSelect(realIndex)}
                className={`w-full text-left px-md py-sm border-b border-border-subtle transition-colors ${
                  selectedIndex === realIndex
                    ? 'bg-ember/10 border-l-2 border-l-ember'
                    : 'hover:bg-surface-hover'
                }`}
              >
                <div className="font-sans text-xs font-medium text-text-primary truncate">{text.title || 'Untitled'}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-sans text-[0.65rem] text-text-muted">{kindLabels[text.kind] || text.kind}</span>
                  {text.tradition && <span className="font-sans text-[0.65rem] text-text-muted/60">{text.tradition}</span>}
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-md text-center text-text-muted font-sans text-xs">No texts found</div>
          )}
        </div>

        <div className="p-md border-t border-border-subtle space-y-2">
          <button
            type="button"
            onClick={handleAdd}
            className="w-full px-4 py-2.5 bg-ember text-text-inverse font-sans text-xs font-semibold rounded-[8px] hover:bg-ember-hover transition-colors"
          >
            + New Text
          </button>
          <button
            type="button"
            onClick={() => setBulkImportOpen(!bulkImportOpen)}
            className="w-full px-4 py-2 bg-transparent border border-border-subtle text-text-secondary font-sans text-xs rounded-[8px] hover:border-border-medium transition-colors"
          >
            Import JSON
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 overflow-y-auto px-xl py-xl">
        {/* Bulk import modal */}
        {bulkImportOpen && (
          <div className="max-w-3xl mb-xl">
            <Panel title="Bulk Import" emoji="📥">
              <FormField label="JSON Array" hint="Paste an array of commonsText objects">
                <textarea
                  value={bulkJson}
                  onChange={(e) => { setBulkJson(e.target.value); setBulkError(''); }}
                  rows={12}
                  className="w-full px-3.5 py-2.5 bg-surface-raised border border-border-subtle rounded-[8px] text-text-primary font-mono text-xs outline-none resize-y focus:border-ember placeholder:text-text-muted/60"
                  placeholder='[{"title": "The Tortoise and the Hare", "kind": "fable", "tradition": "aesop", "bodyText": "...", "license": "public_domain"}]'
                />
              </FormField>
              {bulkError && <div className="text-red-400 text-xs font-sans mb-md">{bulkError}</div>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleBulkImport}
                  className="px-4 py-2 bg-ember text-text-inverse font-sans text-xs font-semibold rounded-[8px] hover:bg-ember-hover transition-colors"
                >
                  Import
                </button>
                <button
                  type="button"
                  onClick={() => { setBulkImportOpen(false); setBulkJson(''); setBulkError(''); }}
                  className="px-4 py-2 text-text-muted font-sans text-xs hover:text-text-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </Panel>
          </div>
        )}

        {!selectedText && !bulkImportOpen && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-md">📖</div>
            <h2 className="font-serif text-lg font-semibold mb-sm">Commons Text Library</h2>
            <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
              Manage canonical public-domain texts — fables, scripture, poems, myths, and more.
              Select a text or create a new one.
            </p>
          </div>
        )}

        {selectedText && selectedIndex != null && (
          <div className="max-w-3xl">
            <div className="mb-lg px-3.5 py-2.5 bg-surface-panel border border-border-subtle rounded-[8px] flex items-center gap-3">
              <span className="text-[0.65rem] font-semibold text-text-muted uppercase tracking-[0.05em] font-sans">Sanity _id</span>
              <code className="font-mono text-xs text-ember flex-1">
                commons.{selectedText.tradition || 'unknown'}.{selectedText.title ? selectedText.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : 'untitled'}
              </code>
            </div>

            <Panel title="Identity" emoji="📝">
              <FormField label="Title" required>
                <Input value={selectedText.title} onChange={(v) => setField(f('title'), v)} placeholder="e.g., The Tortoise and the Hare" />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Kind" required>
                  <Select
                    value={selectedText.kind}
                    onChange={(v) => setField(f('kind'), v)}
                    options={COMMONS_TEXT_KINDS.map((k) => ({ value: k, label: kindLabels[k] }))}
                  />
                </FormField>
                <FormField label="Tradition" required>
                  <Input value={selectedText.tradition} onChange={(v) => setField(f('tradition'), v)} placeholder="e.g., aesop, grimm, bible_kjv" />
                </FormField>
              </div>
            </Panel>

            <Panel title="Text Content" emoji="📜">
              <FormField label="Body" required hint="The canonical text">
                <TextArea
                  value={selectedText.bodyText}
                  onChange={(v) => setField(f('bodyText'), v)}
                  rows={12}
                  serif
                  placeholder="Once upon a time..."
                />
              </FormField>
              <FormField label="Short Body" hint="Optional condensed version for younger ages">
                <TextArea
                  value={selectedText.shortBodyText}
                  onChange={(v) => setField(f('shortBodyText'), v)}
                  rows={6}
                  serif
                />
              </FormField>
              <FormField label="Read Aloud Version" hint="Optimised for parent reading — pacing notes, gloss for archaic words">
                <TextArea
                  value={selectedText.readAloudVersionText}
                  onChange={(v) => setField(f('readAloudVersionText'), v)}
                  rows={8}
                  serif
                />
              </FormField>
            </Panel>

            <Panel title="Metadata" emoji="📊">
              <div className="grid grid-cols-3 gap-3">
                <FormField label="Read Aloud (mins)">
                  <Input value={selectedText.estimatedReadAloudMinutes} onChange={(v) => setField(f('estimatedReadAloudMinutes'), v)} type="number" />
                </FormField>
                <FormField label="Length">
                  <Select
                    value={selectedText.length}
                    onChange={(v) => setField(f('length'), v)}
                    options={[{ value: '', label: 'Select...' }, ...TEXT_LENGTHS.map((l) => ({ value: l, label: l.charAt(0).toUpperCase() + l.slice(1) }))]}
                  />
                </FormField>
                <FormField label="Reading Level">
                  <Select
                    value={selectedText.readingLevel}
                    onChange={(v) => setField(f('readingLevel'), v)}
                    options={[{ value: '', label: 'Select...' }, ...READING_LEVELS.map((l) => ({ value: l, label: `Ages ${l}` }))]}
                  />
                </FormField>
              </div>
              <FormField label="Themes" hint="Press Enter to add">
                <TagInput
                  values={selectedText.themes}
                  onChange={(v) => setField(f('themes'), v)}
                  placeholder="e.g., courage, perseverance"
                />
              </FormField>
              <FormField label="Moral or Lesson">
                <TextArea value={selectedText.moralOrLesson} onChange={(v) => setField(f('moralOrLesson'), v)} rows={2} />
              </FormField>
            </Panel>

            <Panel title="Source & License" emoji="⚖️">
              <FormField label="License" required>
                <Select
                  value={selectedText.license}
                  onChange={(v) => setField(f('license'), v)}
                  options={COMMONS_TEXT_LICENSES.map((l) => ({ value: l, label: l === 'public_domain' ? 'Public Domain' : l === 'cc_by' ? 'CC BY' : 'CC BY-SA' }))}
                />
              </FormField>
              <FormField label="Source" hint='e.g. "Aesop, retold by Joseph Jacobs, 1894"'>
                <TextArea value={selectedText.source} onChange={(v) => setField(f('source'), v)} rows={2} />
              </FormField>
              <FormField label="Source URL">
                <Input value={selectedText.sourceUrl} onChange={(v) => setField(f('sourceUrl'), v)} type="url" placeholder="https://..." />
              </FormField>
            </Panel>

            <Panel title="Discovery" emoji="🔍" defaultOpen={false}>
              <FormField label="Tags">
                <TagInput
                  values={selectedText.tags}
                  onChange={(v) => setField(f('tags'), v)}
                  placeholder="Type a tag and press Enter"
                />
              </FormField>
              <FormField label="Status">
                <Select
                  value={selectedText.status}
                  onChange={(v) => setField(f('status'), v)}
                  options={CONTENT_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
                />
              </FormField>
            </Panel>

            <div className="mt-lg flex justify-end">
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-sans text-red-400 hover:text-red-300 border border-red-900/30 rounded-[8px] transition-colors"
              >
                Delete Text
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
