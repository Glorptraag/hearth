'use client';

import { useState, useEffect, useRef } from 'react';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import RecommendationChip from './RecommendationChip';
import { Sun, SunHorizon } from '@/components/icons';
import { track, hashForAnalytics } from '@/lib/analytics/posthog';

interface Learner {
  id: string;
  name: string;
  colourToken: string | null;
}

interface Recommendation {
  title: string;
  subject?: string;
  reason?: string;
  moduleId?: string;
}

interface CatalogItem {
  title: string;
  moduleId: string;
  subjects: string[];
}

interface BottomSheetProps {
  isOpen: boolean;
  targetDate: string | null;
  targetSession?: string;
  learners: Learner[];
  recommendations: Recommendation[];
  onClose: () => void;
  onAdd: (entry: { date: string; title: string; learnerIds: string[]; session: string }) => Promise<void>;
}

const COLOUR_CHIP: Record<string, string> = {
  rose: 'bg-child-rose/20 text-child-rose border-child-rose/30',
  blue: 'bg-child-blue/20 text-child-blue border-child-blue/30',
  sage: 'bg-child-sage/20 text-child-sage border-child-sage/30',
  violet: 'bg-child-violet/20 text-child-violet border-child-violet/30',
  amber: 'bg-amber-status/20 text-amber-status border-amber-status/30',
};

type SheetTab = 'recommendations' | 'browse' | 'custom';

export default function BottomSheet({
  isOpen,
  targetDate,
  targetSession,
  learners,
  recommendations,
  onClose,
  onAdd,
}: BottomSheetProps) {
  const [tab, setTab] = useState<SheetTab>('recommendations');
  const [title, setTitle] = useState('');
  const [selectedLearners, setSelectedLearners] = useState<string[]>([]);
  const [session, setSession] = useState<string>('morning');
  const [saving, setSaving] = useState(false);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogLoading, setCatalogLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const trapRef = useFocusTrap(isOpen);

  useEffect(() => {
    if (isOpen) {
      // Reset form state on open; deliberate setState-on-deps-change for sheet lifecycle.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle('');
      setSelectedLearners([]);
      setSession(targetSession ?? 'morning');
      setTab(recommendations.length > 0 ? 'recommendations' : 'custom');
      setCatalogSearch('');
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, recommendations.length, targetSession]);

  useEffect(() => {
    if (tab === 'browse' && catalogItems.length === 0 && !catalogLoading) {
      // Lazy-load catalog when the user first switches to the browse tab; loading flag is gated.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCatalogLoading(true);
      fetch('/api/library')
        .then((r) => (r.ok ? r.json() : []))
        .then((data: CatalogItem[]) => setCatalogItems(data))
        .catch(() => setCatalogItems([]))
        .finally(() => setCatalogLoading(false));
    }
    if (tab === 'browse') {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [tab, catalogItems.length, catalogLoading]);

  const filteredCatalog = catalogSearch
    ? catalogItems.filter((item) =>
        item.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        item.subjects.some((s) => s.toLowerCase().includes(catalogSearch.toLowerCase()))
      )
    : catalogItems;

  function toggleLearner(id: string) {
    setSelectedLearners((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(submittedTitle: string) {
    if (!targetDate || !submittedTitle.trim()) return;
    setSaving(true);
    try {
      await onAdd({ date: targetDate, title: submittedTitle.trim(), learnerIds: selectedLearners, session });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const dateLabel = targetDate
    ? new Date(targetDate + 'T12:00:00').toLocaleDateString('en-AU', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      })
    : '';

  return (
    <>
      {/* Backdrop — above the mobile bottom nav (z-100) so the sheet is truly modal */}
      <div
        className={`fixed inset-0 z-[190] backdrop-modal transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
        className={`fixed bottom-0 left-0 right-0 z-[200] flex max-h-[85dvh] flex-col rounded-t-[16px] border-t border-border-subtle bg-surface-panel shadow-[0_-8px_32px_rgba(0,0,0,0.5)] transition-transform duration-[var(--motion-gentle)] ease-[var(--ease-default)] ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-sm pb-xs">
          <div className="h-1 w-10 rounded-full bg-border-medium" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-md pb-sm">
          <div>
            <p id="bottom-sheet-title" className="font-serif text-base font-semibold text-text-primary">Add to planner</p>
            {dateLabel && (
              <p className="font-sans text-xs text-text-muted">{dateLabel}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="font-sans text-sm text-text-muted transition-colors hover:text-text-secondary"
          >
            Cancel
          </button>
        </div>

        {/* Session toggle */}
        <div className="flex gap-xs px-md pb-sm">
          <button
            onClick={() => setSession('morning')}
            className={`inline-flex items-center gap-xs rounded-full border px-sm py-[3px] font-sans text-xs font-semibold transition-all duration-200 ${
              session === 'morning'
                ? 'border-ember/40 bg-ember-glow text-ember'
                : 'border-border-subtle bg-transparent text-text-muted'
            }`}
          >
            <Sun size={14} aria-hidden="true" /> Morning
          </button>
          <button
            onClick={() => setSession('afternoon')}
            className={`inline-flex items-center gap-xs rounded-full border px-sm py-[3px] font-sans text-xs font-semibold transition-all duration-200 ${
              session === 'afternoon'
                ? 'border-ember/40 bg-ember-glow text-ember'
                : 'border-border-subtle bg-transparent text-text-muted'
            }`}
          >
            <SunHorizon size={14} aria-hidden="true" /> Afternoon
          </button>
        </div>

        {/* Learner selector */}
        {learners.length > 0 && (
          <div className="flex gap-xs overflow-x-auto px-md pb-sm">
            {learners.map((l) => (
              <button
                key={l.id}
                onClick={() => toggleLearner(l.id)}
                className={`flex-shrink-0 rounded-full border px-sm py-[3px] font-sans text-xs font-semibold transition-all duration-200 ${
                  selectedLearners.includes(l.id)
                    ? (COLOUR_CHIP[l.colourToken ?? ''] ?? 'bg-ember-glow text-ember border-ember/30')
                    : 'border-border-subtle bg-transparent text-text-muted'
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-border-subtle px-md">
          {recommendations.length > 0 && (
            <button
              onClick={() => setTab('recommendations')}
              className={`mr-md pb-sm font-sans text-xs font-semibold transition-colors ${
                tab === 'recommendations'
                  ? 'border-b-2 border-ember text-ember'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Suggested
            </button>
          )}
          <button
            onClick={() => setTab('browse')}
            className={`mr-md pb-sm font-sans text-xs font-semibold transition-colors ${
              tab === 'browse'
                ? 'border-b-2 border-ember text-ember'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            Browse Library
          </button>
          <button
            onClick={() => setTab('custom')}
            className={`pb-sm font-sans text-xs font-semibold transition-colors ${
              tab === 'custom'
                ? 'border-b-2 border-ember text-ember'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            Custom
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-md py-md">
          {tab === 'recommendations' && recommendations.length > 0 && (
            <div className="flex flex-col gap-xs">
              {recommendations.map((r, i) => (
                <RecommendationChip
                  key={i}
                  title={r.title}
                  subject={r.subject}
                  onAdd={(title) => {
                    if (r.moduleId && r.reason) {
                      void hashForAnalytics(r.moduleId).then((hash) => {
                        track('recommendation_accepted', {
                          surface: 'planner_sheet',
                          action: 'planned',
                          reason: r.reason!,
                          module_id_hash: hash,
                          rank: i,
                        });
                      });
                    }
                    void handleSubmit(title);
                  }}
                />
              ))}
            </div>
          )}

          {tab === 'browse' && (
            <div className="flex flex-col gap-sm">
              <input
                ref={searchRef}
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Search your library..."
                className="w-full rounded-[6px] border border-border-subtle bg-surface-raised px-md py-xs font-sans text-sm text-text-primary placeholder:text-text-muted focus:border-border-medium focus:outline-none"
              />
              {catalogLoading && (
                <p className="py-md text-center font-sans text-xs text-text-muted animate-pulse">Loading library...</p>
              )}
              {!catalogLoading && filteredCatalog.length === 0 && (
                <div className="py-lg text-center">
                  <p className="font-serif text-sm text-text-secondary">
                    {catalogSearch ? 'No matches found' : 'Your library is empty'}
                  </p>
                  <p className="mt-xs font-sans text-xs text-text-muted">
                    <a href="/explore/activities" className="text-ember hover:underline">Browse activities</a> to add to your library
                  </p>
                </div>
              )}
              {filteredCatalog.map((item) => (
                <RecommendationChip
                  key={item.moduleId}
                  title={item.title}
                  subject={item.subjects[0]}
                  onAdd={handleSubmit}
                />
              ))}
            </div>
          )}

          {tab === 'custom' && (
            <div className="flex flex-col gap-md">
              <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit(title)}
                placeholder="What are you planning?"
                className="w-full rounded-[6px] border border-border-subtle bg-surface-raised px-md py-sm font-serif text-base text-text-primary placeholder:text-text-muted focus:border-border-medium focus:outline-none"
              />
              <button
                onClick={() => handleSubmit(title)}
                disabled={!title.trim() || saving}
                className="w-full rounded-[6px] bg-ember py-sm font-sans text-sm font-semibold text-text-inverse transition-all duration-200 hover:bg-ember-hover disabled:opacity-40"
              >
                {saving ? 'Adding...' : 'Add to planner'}
              </button>
            </div>
          )}
        </div>

        {/* Safe area spacer */}
        <div className="h-[env(safe-area-inset-bottom,16px)]" />
      </div>
    </>
  );
}
