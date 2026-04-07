'use client';

import { useReducer, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { studioReducer, getSelectedDoc, getNewSelectionAfterAdd, INITIAL_STATE } from '@/lib/content-studio/reducer';
import type { Selection, StudioState, StudioAction, CapabilityThreadOption } from '@/lib/content-studio/types';
import { Sidebar } from './_components/Sidebar';
import { PackEditor } from './_components/editors/PackEditor';
import { ModuleEditor } from './_components/editors/ModuleEditor';
import { ApproachEditor } from './_components/editors/ApproachEditor';
import { ActivityEditor } from './_components/editors/ActivityEditor';
import { BadgeEditor } from './_components/editors/BadgeEditor';
import { PromptDialog } from './_components/PromptDialog';
import { ConfirmDialog } from './_components/ConfirmDialog';

interface DraftListItem {
  id: string;
  title: string;
  draftType: string;
  status: string;
  updatedAt: Date | null;
}

interface Props {
  capabilityThreads: CapabilityThreadOption[];
  existingDrafts: DraftListItem[];
}

export default function ContentStudioClient({ capabilityThreads, existingDrafts }: Props) {
  const [state, dispatch] = useReducer(studioReducer, INITIAL_STATE);
  const [sel, setSel] = useState<Selection | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftList, setDraftList] = useState<DraftListItem[]>(existingDrafts);
  const [jsonView, setJsonView] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'dirty' | 'idle'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Prompt dialog state
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptTitle, setPromptTitle] = useState('');
  const promptResolve = useRef<((val: string | null) => void) | null>(null);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const confirmResolve = useRef<((val: boolean) => void) | null>(null);

  const doc = useMemo(() => getSelectedDoc(state, sel), [state, sel]);

  // ── Prompt helper ──
  const showPrompt = useCallback((title: string): Promise<string | null> => {
    setPromptTitle(title);
    setPromptOpen(true);
    return new Promise((resolve) => {
      promptResolve.current = resolve;
    });
  }, []);

  const handlePromptSubmit = useCallback((value: string) => {
    promptResolve.current?.(value);
    promptResolve.current = null;
    setPromptOpen(false);
  }, []);

  const handlePromptCancel = useCallback(() => {
    promptResolve.current?.(null);
    promptResolve.current = null;
    setPromptOpen(false);
  }, []);

  // ── Confirm helper ──
  const showConfirm = useCallback((title: string, message: string): Promise<boolean> => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmOpen(true);
    return new Promise((resolve) => {
      confirmResolve.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    confirmResolve.current?.(true);
    confirmResolve.current = null;
    setConfirmOpen(false);
  }, []);

  const handleConfirmCancel = useCallback(() => {
    confirmResolve.current?.(false);
    confirmResolve.current = null;
    setConfirmOpen(false);
  }, []);

  // ── Dispatch wrapper that auto-selects new items ──
  const dispatchAndSelect = useCallback(
    (action: StudioAction) => {
      dispatch(action);
      // Need to compute selection based on post-dispatch state
      // Since dispatch is sync with useReducer, the next state is
      // computed by running the reducer ourselves for selection
      const nextState = studioReducer(state, action);
      const newSel = getNewSelectionAfterAdd(action, nextState);
      if (newSel) setSel(newSel);
    },
    [state],
  );

  // ── Auto-save ──
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!draftId) return;
    if (saveStatus === 'idle') {
      setSaveStatus('dirty');
      return;
    }

    setSaveStatus('dirty');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const res = await fetch(`/api/admin/content/drafts/${draftId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draftData: stateRef.current }),
        });
        if (res.ok) {
          const data = await res.json();
          setSaveStatus('saved');
          setLastSaved(new Date(data.updatedAt));
        } else {
          setSaveStatus('dirty');
        }
      } catch {
        setSaveStatus('dirty');
      }
    }, 1500);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, draftId]);

  // ── Load draft ──
  const loadDraft = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/content/drafts/${id}`);
    if (!res.ok) return;
    const draft = await res.json();
    dispatch({ type: 'LOAD', payload: draft.draftData || INITIAL_STATE });
    setDraftId(id);
    setSel(null);
    setSaveStatus('saved');
    setLastSaved(draft.updatedAt ? new Date(draft.updatedAt) : null);
  }, []);

  // ── Create new draft ──
  const createDraft = useCallback(async (title: string) => {
    const res = await fetch('/api/admin/content/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) return;
    const draft = await res.json();
    dispatch({ type: 'LOAD', payload: INITIAL_STATE });
    setDraftId(draft.id);
    setSel(null);
    setSaveStatus('saved');
    setDraftList((prev) => [{ id: draft.id, title: draft.title, draftType: draft.draftType, status: draft.status, updatedAt: draft.updatedAt }, ...prev]);
  }, []);

  // ── Delete draft ──
  const deleteDraft = useCallback(async () => {
    if (!draftId) return;
    const ok = await showConfirm('Delete Draft', 'Permanently delete this entire draft? This cannot be undone.');
    if (!ok) return;
    await fetch(`/api/admin/content/drafts/${draftId}`, { method: 'DELETE' });
    setDraftList((prev) => prev.filter((d) => d.id !== draftId));
    dispatch({ type: 'LOAD', payload: INITIAL_STATE });
    setDraftId(null);
    setSel(null);
    setSaveStatus('idle');
  }, [draftId, showConfirm]);

  // ── Delete selected document ──
  const deleteSelected = useCallback(async () => {
    if (!sel) return;
    const ok = await showConfirm('Delete Document', 'Delete this document and all its children?');
    if (!ok) return;
    dispatch({ type: 'DELETE_SELECTED', sel });
    setSel(null);
  }, [sel, showConfirm]);

  // ── Computed doc ID ──
  const docId = useMemo(() => {
    if (!sel || !doc) return '';
    const slugify = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled';
    const compId = (...parts: (string | undefined)[]) => parts.filter(Boolean).join('.');

    if (sel.scope === 'pack') {
      const ps = state.packs[sel.pi]?.title ? slugify(state.packs[sel.pi].title) : '';
      if (sel.type === 'pack') return compId('pack', ps);
      if (sel.type === 'module') return compId('module', ps, slugify((doc as { title: string }).title));
      if (sel.type === 'approach') {
        const modSlug = slugify(state.packs[sel.pi].modules[sel.mi].title);
        return compId('approach', ps, modSlug, slugify((doc as { title: string }).title));
      }
      if (sel.type === 'activity') {
        const appSlug = slugify(state.packs[sel.pi].modules[sel.mi].approaches[sel.ai].title);
        return compId('activity', ps, appSlug, slugify((doc as { title: string }).title));
      }
      if (sel.type === 'badge') return compId('badge', ps, slugify((doc as { title: string }).title));
    }
    if (sel.scope === 'standalone-module') {
      const ms = slugify(state.standaloneModules[sel.mi]?.title || '');
      if (sel.type === 'module') return compId('module', 'standalone', ms);
      if (sel.type === 'approach') return compId('approach', 'standalone', ms, slugify((doc as { title: string }).title));
      if (sel.type === 'activity') {
        const appSlug = slugify(state.standaloneModules[sel.mi].approaches[sel.ai].title);
        return compId('activity', 'standalone', appSlug, slugify((doc as { title: string }).title));
      }
    }
    if (sel.scope === 'standalone-activity') {
      return compId('activity', 'standalone', slugify((doc as { title: string }).title));
    }
    return '';
  }, [sel, doc, state]);

  // ── Field setter helper ──
  const setField = useCallback(
    (path: (string | number)[], value: unknown) => {
      dispatch({ type: 'SET_FIELD', path, value });
    },
    [],
  );

  const toggleArrayItem = useCallback(
    (path: (string | number)[], value: string) => {
      dispatch({ type: 'TOGGLE_ARRAY_ITEM', path, value });
    },
    [],
  );

  // Build the field path prefix from current selection
  const fieldPrefix = useMemo((): (string | number)[] => {
    if (!sel) return [];
    if (sel.scope === 'pack') {
      if (sel.type === 'pack') return ['packs', sel.pi];
      if (sel.type === 'module') return ['packs', sel.pi, 'modules', sel.mi];
      if (sel.type === 'approach') return ['packs', sel.pi, 'modules', sel.mi, 'approaches', sel.ai];
      if (sel.type === 'activity') return ['packs', sel.pi, 'modules', sel.mi, 'approaches', sel.ai, 'activities', sel.acti];
      if (sel.type === 'badge') return ['packs', sel.pi, 'badges', sel.bi];
    }
    if (sel.scope === 'standalone-module') {
      if (sel.type === 'module') return ['standaloneModules', sel.mi];
      if (sel.type === 'approach') return ['standaloneModules', sel.mi, 'approaches', sel.ai];
      if (sel.type === 'activity') return ['standaloneModules', sel.mi, 'approaches', sel.ai, 'activities', sel.acti];
    }
    if (sel.scope === 'standalone-activity') {
      return ['standaloneActivities', sel.acti];
    }
    return [];
  }, [sel]);

  return (
    <div className="flex h-screen font-sans bg-surface-body text-text-primary text-sm overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        state={state}
        sel={sel}
        setSel={setSel}
        dispatch={dispatchAndSelect}
        showPrompt={showPrompt}
        draftId={draftId}
        draftList={draftList}
        onLoadDraft={loadDraft}
        onCreateDraft={createDraft}
        onDeleteDraft={deleteDraft}
        saveStatus={saveStatus}
        lastSaved={lastSaved}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="flex items-center justify-between px-xl py-3.5 border-b border-border-subtle bg-surface-panel gap-md shrink-0">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            {!doc && <span className="text-text-primary font-medium">Select a document to edit</span>}
            {doc && sel?.type && (
              <span className="text-text-primary font-medium capitalize">{sel.type}</span>
            )}
          </div>
          <div className="flex gap-2 items-center">
            {doc && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[0.7rem] font-semibold uppercase tracking-[0.05em] ${
                (doc as { status: string }).status === 'published'
                  ? 'bg-sage/15 text-sage'
                  : (doc as { status: string }).status === 'review'
                    ? 'bg-blue-400/15 text-blue-400'
                    : 'bg-text-muted/15 text-text-muted'
              }`}>
                ● {(doc as { status: string }).status}
              </span>
            )}
            {doc && (
              <button
                type="button"
                onClick={() => setJsonView(!jsonView)}
                className="px-3 py-1.5 text-xs font-sans text-text-muted hover:text-text-primary transition-colors"
              >
                {jsonView ? '📝 Form' : '{ } JSON'}
              </button>
            )}
            {doc && (
              <button
                type="button"
                onClick={deleteSelected}
                className="px-3 py-1.5 text-xs font-sans text-red-400 hover:text-red-300 border border-red-900/30 rounded-[8px] transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Editor area */}
        <div className="flex-1 overflow-y-auto px-xl py-xl">
          {!doc && !draftId && (
            <div className="flex flex-col items-center justify-center h-full text-center p-xl">
              <div className="text-5xl mb-md">🏔️</div>
              <h2 className="font-serif text-xl font-semibold mb-sm">Content Studio</h2>
              <p className="text-sm text-text-secondary max-w-sm mb-lg leading-relaxed">
                Create or load a draft to begin. The studio produces Sanity-ready JSON for Pack, Module, Approach, Activity, and Badge documents.
              </p>
              <button
                type="button"
                onClick={async () => {
                  const title = await showPrompt('Draft name');
                  if (title) createDraft(title);
                }}
                className="px-6 py-3 bg-ember text-text-inverse font-sans text-sm font-semibold rounded-[10px] hover:bg-ember-hover transition-all duration-200"
              >
                + New Draft
              </button>
            </div>
          )}

          {!doc && draftId && (
            <div className="flex flex-col items-center justify-center h-full text-center p-xl">
              <div className="text-5xl mb-md">📄</div>
              <h2 className="font-serif text-xl font-semibold mb-sm">Draft loaded</h2>
              <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
                Select a document from the sidebar, or create a new pack, module, or activity.
              </p>
            </div>
          )}

          {doc && jsonView && (
            <div className="bg-surface-panel border border-border-subtle rounded-lg p-xl max-w-4xl">
              <h2 className="font-serif text-base font-semibold mb-3">{'{ }'} Sanity Document JSON</h2>
              <pre className="bg-surface-body border border-border-subtle rounded-[8px] p-md font-mono text-[0.7rem] text-text-secondary leading-relaxed overflow-auto max-h-[70vh] whitespace-pre-wrap">
                {JSON.stringify(doc, null, 2)}
              </pre>
            </div>
          )}

          {doc && !jsonView && (
            <div className="max-w-4xl">
              {/* Computed Sanity _id */}
              <div className="mb-lg px-3.5 py-2.5 bg-surface-panel border border-border-subtle rounded-[8px] flex items-center gap-3">
                <span className="text-[0.65rem] font-semibold text-text-muted uppercase tracking-[0.05em] font-sans">
                  Sanity _id
                </span>
                <code className="font-mono text-xs text-ember flex-1">{docId}</code>
                <span className="text-[0.65rem] text-text-muted font-sans">auto-computed</span>
              </div>

              {sel?.type === 'pack' && (
                <PackEditor
                  state={state}
                  sel={sel}
                  fieldPrefix={fieldPrefix}
                  setField={setField}
                  toggleArrayItem={toggleArrayItem}
                  dispatch={dispatchAndSelect}
                  showPrompt={showPrompt}
                  setSel={setSel}
                />
              )}
              {sel?.type === 'module' && (
                <ModuleEditor
                  state={state}
                  sel={sel}
                  fieldPrefix={fieldPrefix}
                  setField={setField}
                  toggleArrayItem={toggleArrayItem}
                  dispatch={dispatchAndSelect}
                  showPrompt={showPrompt}
                  setSel={setSel}
                  capabilityThreads={capabilityThreads}
                />
              )}
              {sel?.type === 'approach' && (
                <ApproachEditor
                  state={state}
                  sel={sel}
                  fieldPrefix={fieldPrefix}
                  setField={setField}
                  dispatch={dispatchAndSelect}
                  showPrompt={showPrompt}
                  setSel={setSel}
                />
              )}
              {sel?.type === 'activity' && (
                <ActivityEditor
                  fieldPrefix={fieldPrefix}
                  setField={setField}
                  toggleArrayItem={toggleArrayItem}
                  doc={doc}
                  capabilityThreads={capabilityThreads}
                />
              )}
              {sel?.type === 'badge' && (
                <BadgeEditor
                  fieldPrefix={fieldPrefix}
                  setField={setField}
                  toggleArrayItem={toggleArrayItem}
                  doc={doc}
                  capabilityThreads={capabilityThreads}
                />
              )}
            </div>
          )}
        </div>
      </main>

      <PromptDialog
        open={promptOpen}
        title={promptTitle}
        placeholder="Enter a title..."
        onSubmit={handlePromptSubmit}
        onCancel={handlePromptCancel}
      />
      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel="Delete"
        danger
        onConfirm={handleConfirm}
        onCancel={handleConfirmCancel}
      />
    </div>
  );
}
