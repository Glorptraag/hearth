'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { QuickCaptureItem } from './_components/types';
import { useParams, useRouter } from 'next/navigation';
import { sanityClient } from '@/lib/sanity/client';
import { MODULE_DETAIL_QUERY, OVERLAYS_BATCH_QUERY, FRAMEWORK_BY_PEDAGOGY_KEY_QUERY, PRACTICE_PATTERNS_QUERY } from '@/lib/sanity/queries';
import { toRunnerFormat, RunnerFormatError } from '@/lib/modules/to-runner-format';
import EmptyState from '@/components/ui/EmptyState';
import type { Module, Activity, PedagogyLens, ActivityOverlay, Mode } from './_components/types';
import PrepMode from './_components/PrepMode';
import FacilitateMode from './_components/FacilitateMode';
import LogMode from './_components/LogMode';
import ApproachPickMode from './_components/ApproachPicker';
import ModuleSidebar from './_components/ModuleSidebar';
import ProgressBar from './_components/ProgressBar';
import { CommonsReader } from '@/components/content/CommonsReader';
import { PrintSheet } from '@/components/content/PrintSheet';
import type { PrintableItem, PrintSelection, PrintBundleResponse } from '@/components/content/types';
import { isPrintableAssetKind, fetchPrintBundle, type AssetKind } from '@/components/content/types';

export default function ModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [runnerError, setRunnerError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('approach-pick');
  const [selectedApproachIdx, setSelectedApproachIdx] = useState(0);
  const [overlays, setOverlays] = useState<ActivityOverlay[]>([]);
  const [pedagogy, setPedagogy] = useState<string | null>(null);
  const [practicePatterns, setPracticePatterns] = useState<Array<{_id: string; triggerTitle: string; triggerContext?: string; traditionResponse?: string; antiPattern?: string; tags?: string[]}>>([]);
  const [savedChunkIdx, setSavedChunkIdx] = useState<number>(0);
  const [currentActivityIdx, setCurrentActivityIdx] = useState<number>(0);
  const [completedActivityIdxs, setCompletedActivityIdxs] = useState<number[]>([]);
  const [sessionElapsed, setSessionElapsed] = useState<number | undefined>(undefined);
  const [quickCaptures, setQuickCaptures] = useState<QuickCaptureItem[]>([]);
  const facilitateStartRef = useRef<number | null>(null);
  const [readerTextId, setReaderTextId] = useState<string | null>(null);
  const [showPrintSheet, setShowPrintSheet] = useState(false);

  const handleAddCapture = useCallback((item: QuickCaptureItem) => {
    setQuickCaptures((prev) => [...prev, item]);
  }, []);

  const handleRemoveCapture = useCallback((timestamp: number) => {
    setQuickCaptures((prev) => prev.filter((c) => c.timestamp !== timestamp));
  }, []);

  const STORAGE_KEY = `hearth_module_${id}_session`;
  const START_TIME_KEY = `hearth_module_${id}_start`;

  function persistChunk(chunkIdx: number) {
    setSavedChunkIdx(chunkIdx);
    setCurrentActivityIdx(chunkIdx);
    setCompletedActivityIdxs((prev) => {
      const next = new Set(prev);
      for (let i = 0; i < chunkIdx; i++) next.add(i);
      return Array.from(next);
    });
    try { localStorage.setItem(STORAGE_KEY, String(chunkIdx)); } catch { /* ignore */ }
  }

  function clearSession() {
    setSavedChunkIdx(0);
    setCurrentActivityIdx(0);
    setCompletedActivityIdxs([]);
    setQuickCaptures([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(START_TIME_KEY);
    } catch { /* ignore */ }
  }

  const handleModeChange = useCallback((newMode: Mode) => {
    if (newMode === 'log' && facilitateStartRef.current) {
      setSessionElapsed(Math.floor((Date.now() - facilitateStartRef.current) / 1000));
    }
    setMode(newMode);
  }, []);

  const handleActivitySelect = useCallback((idx: number) => {
    setCurrentActivityIdx(idx);
    setSavedChunkIdx(idx);
    setCompletedActivityIdxs((prev) => {
      const next = new Set(prev);
      for (let i = 0; i < idx; i++) next.add(i);
      return Array.from(next);
    });
    try { localStorage.setItem(`hearth_module_${id}_session`, String(idx)); } catch { /* ignore */ }
    setMode('facilitate');
  }, [id]);

  const fetchModule = useCallback(async () => {
    try {
      const [rawMod, libraryRes, settingsRes] = await Promise.all([
        sanityClient.fetch(MODULE_DETAIL_QUERY, { id }),
        fetch('/api/library'),
        fetch('/api/settings'),
      ]);
      let mod: Module | null = null;
      try {
        mod = toRunnerFormat(rawMod);
        setModule(mod);
      } catch (err) {
        if (err instanceof RunnerFormatError) {
          setRunnerError(err.message);
        } else {
          setRunnerError('This module could not be loaded.');
        }
        return;
      }

      if (libraryRes.ok) {
        const library: Array<{ id: string; kind: 'pack' | 'module' }> = await libraryRes.json();
        const ownBuiltMatch = library.some((l) => l.kind === 'module' && l.id === id);
        if (ownBuiltMatch) {
          setHasAccess(true);
        } else {
          const libraryPackIds = library.filter((l) => l.kind === 'pack').map((l) => l.id);
          if (libraryPackIds.length === 0) {
            setHasAccess(false);
          } else {
            const owningPacks = await sanityClient
              .fetch<Array<{ _id: string }>>(
                `*[_type == "pack" && references($moduleId)]{_id}`,
                { moduleId: id },
              )
              .catch(() => [] as Array<{ _id: string }>);
            const owningPackIds = new Set(owningPacks.map((p) => p._id));
            setHasAccess(libraryPackIds.some((pid) => owningPackIds.has(pid)));
          }
        }
      }

      let resolvedPedagogy = 'eclectic';
      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        resolvedPedagogy = settings.pedagogyPreference ?? 'eclectic';
        setPedagogy(resolvedPedagogy);
      }

      // Fetch practice patterns for the resolved pedagogy
      const framework = await sanityClient.fetch(FRAMEWORK_BY_PEDAGOGY_KEY_QUERY, { pedagogyKey: resolvedPedagogy });
      if (framework?._id) {
        const patterns = await sanityClient.fetch(PRACTICE_PATTERNS_QUERY, { frameworkId: framework._id });
        setPracticePatterns(patterns ?? []);
      }

      if ((mod?.approaches?.length ?? 0) <= 1) {
        const activityIds: string[] = mod?.approaches?.[0]?.activities?.map((a: Activity) => a._id) ?? [];
        if (activityIds.length > 0) {
          let raw: { _id: string; activity: { _ref: string }; lens: PedagogyLens }[] =
            await sanityClient.fetch(OVERLAYS_BATCH_QUERY, { activityIds, framework: resolvedPedagogy });
          if (raw.length === 0 && resolvedPedagogy !== 'eclectic') {
            raw = await sanityClient.fetch(OVERLAYS_BATCH_QUERY, { activityIds, framework: 'eclectic' });
          }
          setOverlays(raw.map((o) => ({ activityId: o.activity._ref, lens: o.lens })));
        }
        setMode('prep');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleApproachSelect = useCallback(async (idx: number) => {
    setSelectedApproachIdx(idx);
    const activityIds: string[] = module?.approaches?.[idx]?.activities?.map((a) => a._id) ?? [];
    if (activityIds.length > 0 && pedagogy) {
      let raw: { _id: string; activity: { _ref: string }; lens: PedagogyLens }[] =
        await sanityClient.fetch(OVERLAYS_BATCH_QUERY, { activityIds, framework: pedagogy });
      if (raw.length === 0 && pedagogy !== 'eclectic') {
        raw = await sanityClient.fetch(OVERLAYS_BATCH_QUERY, { activityIds, framework: 'eclectic' });
      }
      setOverlays(raw.map((o) => ({ activityId: o.activity._ref, lens: o.lens })));
    } else {
      setOverlays([]);
    }
    setMode('prep');
  }, [module, pedagogy]);

  useEffect(() => {
    fetchModule();
    try {
      const saved = localStorage.getItem(`hearth_module_${id}_session`);
      if (saved) {
        const idx = parseInt(saved, 10) || 0;
        setSavedChunkIdx(idx);
        setCurrentActivityIdx(idx);
        if (idx > 0) {
          setCompletedActivityIdxs(Array.from({ length: idx }, (_, i) => i));
        }
      }
    } catch { /* ignore */ }
  }, [fetchModule, id]);

  // ─── Material counts and helpers ───────────────────────────────────────────────

  const materialCount = (() => {
    if (!module) return 0;
    const approach = module.approaches?.[selectedApproachIdx];
    const seenIds = new Set<string>();
    for (const act of approach?.activities ?? []) {
      for (const ref of act.assets ?? []) {
        if (ref.asset) seenIds.add(ref.asset._id);
      }
      for (const ref of act.commonsTexts ?? []) {
        if (ref.text) seenIds.add(ref.text._id);
      }
    }
    return seenIds.size;
  })();

  const readerText = (() => {
    if (!readerTextId || !module) return null;
    for (const approach of module.approaches ?? []) {
      for (const act of approach.activities ?? []) {
        for (const ref of act.commonsTexts ?? []) {
          if (ref.text?._id === readerTextId) return ref.text;
        }
      }
    }
    return null;
  })();

  const printSheetGroups = (() => {
    if (!module) return [];
    const approach = module.approaches?.[selectedApproachIdx];
    const items: PrintableItem[] = [];
    const seenIds = new Set<string>();

    for (const act of approach?.activities ?? []) {
      for (const ref of act.assets ?? []) {
        if (!ref.asset || seenIds.has(ref.asset._id)) continue;
        seenIds.add(ref.asset._id);
        items.push({
          id: ref.asset._id,
          kind: 'asset',
          assetKind: ref.asset.kind as AssetKind,
          title: ref.asset.title,
          thumbnailUrl: ref.asset.thumbnailUrl ?? null,
          pageCount: ref.asset.pageCount ?? 0,
          description: ref.asset.description,
          role: ref.role as PrintableItem['role'],
          isPrintable: isPrintableAssetKind(ref.asset.kind as AssetKind),
        });
      }
      for (const ref of act.commonsTexts ?? []) {
        if (!ref.text || seenIds.has(ref.text._id)) continue;
        seenIds.add(ref.text._id);
        items.push({
          id: ref.text._id,
          kind: 'commonsText',
          commonsKind: ref.text.kind as PrintableItem['commonsKind'],
          title: ref.text.title,
          thumbnailUrl: null,
          pageCount: ref.text.estimatedReadAloudMinutes ?? 0,
          role: ref.role as PrintableItem['role'],
          isPrintable: true,
        });
      }
    }

    return [{ label: module.title, items }];
  })();

  async function handlePrintGenerate(selection: PrintSelection): Promise<PrintBundleResponse> {
    const allItems = printSheetGroups.flatMap((g) => g.items);
    const items = selection.itemIds
      .map((id) => allItems.find((i) => i.id === id))
      .filter(Boolean)
      .map((i) => ({ id: i!.id, kind: i!.kind }));

    return fetchPrintBundle(items, {
      copies: selection.copies,
      combine: selection.combine,
      coverTitle: module?.title,
    });
  }

  function handleDownloadAsset(assetId: string) {
    window.open(`/api/assets/download?id=${assetId}`, '_blank');
  }

  // ─── Loading / error / access states ──────────────────────────────────────────

  if (loading) {
    return (
      <div className="px-md py-xl">
        <div className="animate-pulse space-y-md">
          <div className="h-6 bg-surface-raised rounded w-2/3" />
          <div className="h-4 bg-surface-raised rounded w-full" />
          <div className="h-4 bg-surface-raised rounded w-4/5" />
        </div>
      </div>
    );
  }

  if (runnerError) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-md py-xl">
        <EmptyState
          emoji="🔧"
          heading="This module isn't ready to run"
          body={runnerError}
          cta={{ label: 'Browse activities', href: '/explore/activities' }}
        />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-md py-xl">
        <EmptyState
          emoji="🔧"
          heading="Module not available"
          body="This module may have been removed or is temporarily unavailable. Your learning data is safe."
          cta={{ label: 'Browse activities', href: '/explore/activities' }}
        />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="px-md py-xl max-w-2xl mx-auto text-center">
        <p className="text-4xl mb-md" aria-hidden="true">🔒</p>
        <h1 className="font-serif text-xl font-semibold text-text-primary mb-sm">
          Not in your library yet
        </h1>
        <p className="font-serif text-text-secondary mb-lg">
          This module isn&apos;t in your library. Browse the Marketplace to add packs to your collection.
        </p>
        <button
          onClick={() => router.push('/explore/marketplace')}
          className="bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm text-sm hover:bg-ember-hover transition-all duration-200"
        >
          Browse Marketplace
        </button>
      </div>
    );
  }

  // ─── Main layout ──────────────────────────────────────────────────────────────

  return (
    <div className="lg:grid lg:grid-cols-[220px_1fr]">
      <ModuleSidebar
        module={module}
        mode={mode}
        selectedApproachIdx={selectedApproachIdx}
        currentActivityIdx={currentActivityIdx}
        completedActivityIdxs={completedActivityIdxs}
        onApproachSelect={handleApproachSelect}
        onModeChange={handleModeChange}
        onActivitySelect={handleActivitySelect}
      />

      <div className="min-w-0">
        {/* Mobile mode tabs */}
        {mode !== 'approach-pick' && (
          <div className="sticky top-0 z-10 bg-surface-body/95 border-b border-border-subtle px-md py-sm flex items-center gap-lg lg:hidden">
            {(['prep', 'facilitate', 'log'] as const).map((m) => {
              const activities = module.approaches?.[selectedApproachIdx]?.activities ?? [];
              const label =
                m === 'prep'
                  ? '📋 Prep'
                  : m === 'facilitate'
                  ? `▶ Go (${currentActivityIdx + 1}/${activities.length})`
                  : '✏️ Log';
              return (
                <button
                  key={m}
                  onClick={() => handleModeChange(m)}
                  className={`font-sans text-sm font-semibold transition-colors duration-200 ${
                    mode === m ? 'text-ember' : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {label}
                </button>
              );
            })}
            {materialCount > 0 && (
              <button
                onClick={() => setShowPrintSheet(true)}
                className="ml-auto shrink-0 font-sans text-sm text-text-muted hover:text-ember transition-colors duration-200"
                aria-label={`${materialCount} materials — print`}
              >
                📄 {materialCount}
              </button>
            )}
          </div>
        )}

        {mode === 'approach-pick' && (
          <ApproachPickMode module={module} onSelect={handleApproachSelect} />
        )}
        {mode === 'prep' && (
          <PrepMode
            module={module}
            approachIdx={selectedApproachIdx}
            overlays={overlays}
            pedagogy={pedagogy}
            onPrintMaterials={materialCount > 0 ? () => setShowPrintSheet(true) : undefined}
            onStart={() => {
              clearSession();
              const now = Date.now();
              facilitateStartRef.current = now;
              try { localStorage.setItem(START_TIME_KEY, String(now)); } catch { /* ignore */ }
              setMode('facilitate');
            }}
            savedChunkIdx={savedChunkIdx}
            onResume={() => {
              if (!facilitateStartRef.current) {
                try {
                  const saved = localStorage.getItem(START_TIME_KEY);
                  facilitateStartRef.current = saved ? parseInt(saved, 10) : Date.now();
                } catch { facilitateStartRef.current = Date.now(); }
              }
              setMode('facilitate');
            }}
          />
        )}
        {mode === 'facilitate' && (
          <div>
            <div className="px-md pt-xl lg:px-xl">
              <ProgressBar
                activities={module.approaches?.[selectedApproachIdx]?.activities ?? []}
                currentIdx={currentActivityIdx}
              />
            </div>
          <FacilitateMode
            module={module}
            approachIdx={selectedApproachIdx}
            overlays={overlays}
            pedagogy={pedagogy}
            practicePatterns={practicePatterns}
            onFinish={() => {
              clearSession();
              if (facilitateStartRef.current) {
                setSessionElapsed(Math.floor((Date.now() - facilitateStartRef.current) / 1000));
              }
              setMode('log');
            }}
            onPause={() => {
              setMode('prep');
              fetch('/api/notifications/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'pause_ack',
                  moduleId: module._id,
                  moduleTitle: module.title,
                }),
              }).catch(() => {});
            }}
            initialChunkIdx={savedChunkIdx}
            onChunkChange={persistChunk}
            sessionStartTime={facilitateStartRef.current ?? Date.now()}
            quickCaptures={quickCaptures}
            onAddCapture={handleAddCapture}
            onRemoveCapture={handleRemoveCapture}
            currentActivityIdx={currentActivityIdx}
            onOpenReader={setReaderTextId}
            onDownloadAsset={handleDownloadAsset}
          />
          </div>
        )}
        {mode === 'log' && (
          <LogMode
            module={module}
            sessionElapsed={sessionElapsed}
            quickCaptures={quickCaptures}
            onRemoveCapture={handleRemoveCapture}
          />
        )}
      </div>

      {/* Commons Reader overlay */}
      {readerText && (
        <CommonsReader
          isOpen={!!readerText}
          title={readerText.title}
          kind={readerText.kind}
          tradition={readerText.tradition}
          body={readerText.body}
          shortBody={readerText.shortBody}
          readAloudVersion={readerText.readAloudVersion}
          estimatedReadAloudMinutes={readerText.estimatedReadAloudMinutes}
          source={readerText.source}
          onClose={() => setReaderTextId(null)}
          returnLabel="Back to module"
        />
      )}

      {/* Print Sheet */}
      {showPrintSheet && (
        <PrintSheet
          isOpen={showPrintSheet}
          title={`Print — ${module.title}`}
          groups={printSheetGroups}
          defaultCopies={1}
          onClose={() => setShowPrintSheet(false)}
          onGenerate={handlePrintGenerate}
        />
      )}
    </div>
  );
}
