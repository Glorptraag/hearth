'use client';

import type { StudioState, Selection, StudioAction } from '@/lib/content-studio/types';

interface DraftListItem {
  id: string;
  title: string;
  draftType: string;
  status: string;
  updatedAt: Date | null;
}

interface SidebarProps {
  state: StudioState;
  sel: Selection | null;
  setSel: (sel: Selection | null) => void;
  dispatch: (action: StudioAction) => void;
  showPrompt: (title: string) => Promise<string | null>;
  draftId: string | null;
  draftList: DraftListItem[];
  onLoadDraft: (id: string) => void;
  onCreateDraft: (title: string) => void;
  onDeleteDraft: () => void;
  saveStatus: 'saved' | 'saving' | 'dirty' | 'idle';
  lastSaved: Date | null;
}

function TreeItem({
  emoji,
  label,
  depth = 0,
  active,
  right,
  onClick,
}: {
  emoji: string;
  label: string;
  depth?: number;
  active: boolean;
  right?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-1.5 py-[7px] pr-3.5 cursor-pointer text-[0.8rem] transition-colors duration-150 ${
        active
          ? 'text-text-primary bg-ember/15 border-l-2 border-l-ember'
          : 'text-text-secondary border-l-2 border-l-transparent hover:bg-surface-hover'
      }`}
      style={{ paddingLeft: `${14 + depth * 18}px` }}
    >
      <span className="text-sm w-[18px] text-center shrink-0">{emoji}</span>
      <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>
      {right}
    </div>
  );
}

function AddBtn({
  label,
  depth = 0,
  onClick,
}: {
  label: string;
  depth?: number;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-1 py-1 text-[0.7rem] text-text-muted cursor-pointer hover:text-ember transition-colors duration-150"
      style={{ paddingLeft: `${14 + depth * 18 + 18}px` }}
    >
      + {label}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'published'
      ? 'bg-sage'
      : status === 'review'
        ? 'bg-blue-400'
        : 'bg-text-muted';
  return <span className={`w-2 h-2 rounded-full ${color} shrink-0 inline-block`} />;
}

export function Sidebar({
  state,
  sel,
  setSel,
  dispatch,
  showPrompt,
  draftId,
  draftList,
  onLoadDraft,
  onCreateDraft,
  onDeleteDraft,
  saveStatus,
  lastSaved,
}: SidebarProps) {
  const { packs, standaloneModules, standaloneActivities } = state;

  async function addPack() {
    const t = await showPrompt('Pack title');
    if (t) dispatch({ type: 'ADD_PACK', title: t });
  }
  async function addStandaloneModule() {
    const t = await showPrompt('Module title');
    if (t) dispatch({ type: 'ADD_STANDALONE_MODULE', title: t });
  }
  async function addStandaloneActivity() {
    const t = await showPrompt('Activity title');
    if (t) dispatch({ type: 'ADD_STANDALONE_ACTIVITY', title: t });
  }
  async function addModule(pi: number) {
    const t = await showPrompt('Module title');
    if (t) dispatch({ type: 'ADD_MODULE', pi, title: t });
  }
  async function addApproach(scope: 'pack' | 'standalone-module', pi: number | undefined, mi: number) {
    const t = await showPrompt('Approach title');
    if (t) dispatch({ type: 'ADD_APPROACH', scope, pi, mi, title: t });
  }
  async function addActivity(scope: 'pack' | 'standalone-module', pi: number | undefined, mi: number, ai: number) {
    const t = await showPrompt('Activity title');
    if (t) dispatch({ type: 'ADD_ACTIVITY', scope, pi, mi, ai, title: t });
  }
  async function addBadge(pi: number) {
    const t = await showPrompt('Badge title');
    if (t) dispatch({ type: 'ADD_BADGE', pi, title: t });
  }

  const hasContent = packs.length > 0 || standaloneModules.length > 0 || standaloneActivities.length > 0;

  return (
    <aside className="w-[280px] min-w-[280px] bg-surface-panel border-r border-border-subtle flex flex-col">
      {/* Header */}
      <div className="px-md py-3.5 border-b border-border-subtle">
        <h1 className="font-serif text-lg font-semibold">🏔️ Content Studio</h1>
        <div className="text-[0.65rem] text-text-muted uppercase tracking-[0.05em] font-sans">
          JSON Writer · Admin
        </div>
      </div>

      {/* Draft selector */}
      <div className="px-md py-3 border-b border-border-subtle">
        {draftId ? (
          <div className="flex items-center gap-2">
            <select
              value={draftId}
              onChange={(e) => onLoadDraft(e.target.value)}
              className="flex-1 px-2 py-1.5 bg-surface-raised border border-border-subtle rounded-md text-xs text-text-primary font-sans outline-none"
            >
              {draftList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={async () => {
                const t = await showPrompt('New draft name');
                if (t) onCreateDraft(t);
              }}
              className="px-2 py-1.5 bg-ember text-text-inverse text-xs font-sans font-semibold rounded-md hover:bg-ember-hover transition-colors"
            >
              +
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {draftList.length > 0 && (
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) onLoadDraft(e.target.value);
                }}
                className="w-full px-2 py-1.5 bg-surface-raised border border-border-subtle rounded-md text-xs text-text-secondary font-sans outline-none"
              >
                <option value="">Load existing draft...</option>
                {draftList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={async () => {
                const t = await showPrompt('Draft name');
                if (t) onCreateDraft(t);
              }}
              className="w-full px-3 py-2 bg-ember text-text-inverse text-xs font-sans font-semibold rounded-md hover:bg-ember-hover transition-colors text-center"
            >
              + New Draft
            </button>
          </div>
        )}
      </div>

      {/* Create new content buttons */}
      {draftId && (
        <div className="px-md py-2 border-b border-border-subtle flex gap-1.5">
          <button
            type="button"
            onClick={addPack}
            className="flex-1 px-2 py-1.5 bg-surface-raised border border-border-subtle rounded-md text-[0.65rem] text-text-secondary font-sans hover:border-border-medium transition-colors"
          >
            📦 Pack
          </button>
          <button
            type="button"
            onClick={addStandaloneModule}
            className="flex-1 px-2 py-1.5 bg-surface-raised border border-border-subtle rounded-md text-[0.65rem] text-text-secondary font-sans hover:border-border-medium transition-colors"
          >
            📖 Module
          </button>
          <button
            type="button"
            onClick={addStandaloneActivity}
            className="flex-1 px-2 py-1.5 bg-surface-raised border border-border-subtle rounded-md text-[0.65rem] text-text-secondary font-sans hover:border-border-medium transition-colors"
          >
            📝 Activity
          </button>
        </div>
      )}

      {/* Tree nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {/* Packs */}
        {packs.length > 0 && (
          <>
            <div className="px-3.5 py-1 text-[0.6rem] text-text-muted uppercase tracking-[0.08em] font-semibold font-sans">
              Packs
            </div>
            {packs.map((p, pi) => (
              <div key={p._key}>
                <TreeItem
                  emoji="📦"
                  label={p.title}
                  active={sel?.scope === 'pack' && sel.pi === pi && sel.type === 'pack'}
                  onClick={() => setSel({ scope: 'pack', pi, type: 'pack' })}
                  right={<StatusDot status={p.status} />}
                />
                {p.modules.map((m, mi) => (
                  <div key={m._key}>
                    <TreeItem
                      emoji="📖"
                      label={m.title}
                      depth={1}
                      active={sel?.scope === 'pack' && sel.pi === pi && 'mi' in sel && sel.mi === mi && sel.type === 'module'}
                      onClick={() => setSel({ scope: 'pack', pi, mi, type: 'module' })}
                      right={<StatusDot status={m.status} />}
                    />
                    {m.approaches.map((app, ai) => (
                      <div key={app._key}>
                        <TreeItem
                          emoji="🔀"
                          label={app.title}
                          depth={2}
                          active={sel?.scope === 'pack' && sel.pi === pi && 'mi' in sel && sel.mi === mi && 'ai' in sel && sel.ai === ai && sel.type === 'approach'}
                          onClick={() => setSel({ scope: 'pack', pi, mi, ai, type: 'approach' })}
                          right={
                            <>
                              <span className="text-[0.65rem] text-text-muted">{app.activities.length}</span>
                              <StatusDot status={app.status} />
                            </>
                          }
                        />
                        {app.activities.map((act, acti) => (
                          <TreeItem
                            key={act._key}
                            emoji="📝"
                            label={act.title}
                            depth={3}
                            active={sel?.scope === 'pack' && sel.pi === pi && 'mi' in sel && sel.mi === mi && 'ai' in sel && sel.ai === ai && 'acti' in sel && sel.acti === acti && sel.type === 'activity'}
                            onClick={() => setSel({ scope: 'pack', pi, mi, ai, acti, type: 'activity' })}
                            right={<StatusDot status={act.status} />}
                          />
                        ))}
                        <AddBtn label="activity" depth={3} onClick={() => addActivity('pack', pi, mi, ai)} />
                      </div>
                    ))}
                    <AddBtn label="approach" depth={2} onClick={() => addApproach('pack', pi, mi)} />
                  </div>
                ))}
                <AddBtn label="module" depth={1} onClick={() => addModule(pi)} />
                {p.badges.map((b, bi) => (
                  <TreeItem
                    key={b._key}
                    emoji="🏅"
                    label={b.title}
                    depth={1}
                    active={sel?.scope === 'pack' && sel.pi === pi && 'bi' in sel && sel.bi === bi && sel.type === 'badge'}
                    onClick={() => setSel({ scope: 'pack', pi, bi, type: 'badge' })}
                    right={<StatusDot status={b.status} />}
                  />
                ))}
                <AddBtn label="badge" depth={1} onClick={() => addBadge(pi)} />
                <div className="h-px bg-border-subtle mx-3.5 my-2" />
              </div>
            ))}
          </>
        )}

        {/* Standalone modules */}
        {standaloneModules.length > 0 && (
          <>
            <div className="px-3.5 py-1 mt-1 text-[0.6rem] text-text-muted uppercase tracking-[0.08em] font-semibold font-sans">
              Standalone Modules
            </div>
            {standaloneModules.map((m, mi) => (
              <div key={m._key}>
                <TreeItem
                  emoji="📖"
                  label={m.title}
                  active={sel?.scope === 'standalone-module' && sel.mi === mi && sel.type === 'module'}
                  onClick={() => setSel({ scope: 'standalone-module', mi, type: 'module' })}
                  right={<StatusDot status={m.status} />}
                />
                {m.approaches.map((app, ai) => (
                  <div key={app._key}>
                    <TreeItem
                      emoji="🔀"
                      label={app.title}
                      depth={1}
                      active={sel?.scope === 'standalone-module' && sel.mi === mi && 'ai' in sel && sel.ai === ai && sel.type === 'approach'}
                      onClick={() => setSel({ scope: 'standalone-module', mi, ai, type: 'approach' })}
                      right={<StatusDot status={app.status} />}
                    />
                    {app.activities.map((act, acti) => (
                      <TreeItem
                        key={act._key}
                        emoji="📝"
                        label={act.title}
                        depth={2}
                        active={sel?.scope === 'standalone-module' && sel.mi === mi && 'ai' in sel && sel.ai === ai && 'acti' in sel && sel.acti === acti && sel.type === 'activity'}
                        onClick={() => setSel({ scope: 'standalone-module', mi, ai, acti, type: 'activity' })}
                        right={<StatusDot status={act.status} />}
                      />
                    ))}
                    <AddBtn label="activity" depth={2} onClick={() => addActivity('standalone-module', undefined, mi, ai)} />
                  </div>
                ))}
                <AddBtn label="approach" depth={1} onClick={() => addApproach('standalone-module', undefined, mi)} />
              </div>
            ))}
          </>
        )}

        {/* Standalone activities */}
        {standaloneActivities.length > 0 && (
          <>
            <div className="px-3.5 py-1 mt-1 text-[0.6rem] text-text-muted uppercase tracking-[0.08em] font-semibold font-sans">
              Standalone Activities
            </div>
            {standaloneActivities.map((a, acti) => (
              <TreeItem
                key={a._key}
                emoji="📝"
                label={a.title}
                active={sel?.scope === 'standalone-activity' && sel.acti === acti}
                onClick={() => setSel({ scope: 'standalone-activity', acti, type: 'activity' })}
                right={<StatusDot status={a.status} />}
              />
            ))}
          </>
        )}

        {!hasContent && draftId && (
          <div className="px-3.5 py-8 text-center text-text-muted text-xs font-sans">
            No content yet. Create a pack, module, or activity above.
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-md py-3 border-t border-border-subtle">
        <div className="flex items-center justify-between text-[0.65rem] text-text-muted font-sans mb-2">
          <span>
            {saveStatus === 'saving' && '⏳ Saving...'}
            {saveStatus === 'saved' && lastSaved && `✓ Saved ${lastSaved.toLocaleTimeString()}`}
            {saveStatus === 'dirty' && '● Unsaved changes'}
            {saveStatus === 'idle' && 'No draft loaded'}
          </span>
          {draftId && (
            <button
              type="button"
              onClick={onDeleteDraft}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              Delete draft
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
