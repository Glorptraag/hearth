'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Module, ActivityOverlay, QuickCaptureItem } from './types';
import { SETTING_ICON, ENERGY_ICON, PEDAGOGY_LABELS } from './constants';
import { ASSET_KIND_ICON, COMMONS_KIND_ICON, type AssetKind } from '@/components/content/types';
import { Timer, Lightbulb, Eye, Asterisk, Camera, X, CaretDown } from '@/components/icons';
import { HearthPortableText } from './PortableTextRenderer';
import SessionTimer from './SessionTimer';
import QuickCapture from './QuickCapture';

type PracticePattern = {
  _id: string;
  triggerTitle: string;
  triggerContext?: string;
  traditionResponse?: string;
  antiPattern?: string;
  tags?: string[];
};

export default function FacilitateMode({
  module,
  approachIdx,
  overlays,
  pedagogy,
  onFinish,
  onEndAndLog,
  onPause,
  initialChunkIdx = 0,
  onChunkChange,
  sessionStartTime,
  quickCaptures,
  onAddCapture,
  onRemoveCapture,
  currentActivityIdx: externalActivityIdx,
  onOpenReader,
  onDownloadAsset,
}: {
  module: Module;
  approachIdx: number;
  overlays: ActivityOverlay[];
  pedagogy: string | null;
  practicePatterns?: PracticePattern[];
  onFinish: () => void;
  onEndAndLog?: () => void;
  onPause?: () => void;
  initialChunkIdx?: number;
  onChunkChange?: (idx: number) => void;
  sessionStartTime: number;
  quickCaptures?: QuickCaptureItem[];
  onAddCapture?: (item: QuickCaptureItem) => void;
  onRemoveCapture?: (timestamp: number) => void;
  currentActivityIdx?: number;
  onOpenReader?: (textId: string) => void;
  onDownloadAsset?: (assetId: string) => void;
}) {
  const activities = module.approaches?.[approachIdx]?.activities ?? [];
  const [localCurrentIdx, setLocalCurrentIdx] = useState(initialChunkIdx);
  const [guidanceOpen, setGuidanceOpen] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);

  const [mobileCapture, setMobileCapture] = useState(false);
  const currentIdx = externalActivityIdx ?? localCurrentIdx;
  const current = activities[currentIdx];
  const currentOverlay = overlays.find((o) => o.activityId === current?._id) ?? null;
  const isLast = currentIdx === activities.length - 1;

  if (!current) return null;

  return (
    <div className="xl:grid xl:grid-cols-[1fr_280px]">
      {/* Main facilitate content */}
      <div className="px-md py-xl max-w-2xl mx-auto pb-32">
        {/* Progress dots + timer */}
        <div className="flex items-center justify-between mb-xl">
          <div className="flex items-center gap-xs">
            {activities.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-200 ${
                  i === currentIdx
                    ? 'w-6 bg-ember'
                    : i < currentIdx
                    ? 'w-2 bg-ember/40'
                    : 'w-2 bg-border-subtle'
                }`}
              />
            ))}
            <span className="font-sans text-xs text-text-muted ml-sm">
              {currentIdx + 1} of {activities.length}
            </span>
          </div>
          <SessionTimer suggestedMax={current?.duration?.max} startTime={sessionStartTime} />
        </div>

        {/* Activity header */}
        <div className="mb-lg">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-ember mb-xs">
            {module.approaches?.[approachIdx]?.title}
          </p>
          <h2 className="font-serif text-xl font-semibold text-text-primary mb-xs">
            {current.title}
          </h2>
          <div className="flex gap-sm flex-wrap">
            {current.duration && (
              <span className="inline-flex items-center gap-xs font-sans text-xs text-text-muted bg-surface-raised rounded-full px-sm py-xs border border-border-subtle">
                <Timer size={14} aria-hidden="true" />
                {current.duration.min}–{current.duration.max} min
              </span>
            )}
            {current.setting && (() => {
              const SettingIcon = SETTING_ICON[current.setting];
              return (
                <span className="inline-flex items-center gap-xs font-sans text-xs text-text-muted bg-surface-raised rounded-full px-sm py-xs border border-border-subtle">
                  {SettingIcon && <SettingIcon size={14} aria-hidden="true" />}
                  {current.setting}
                </span>
              );
            })()}
            {current.energyLevel && (() => {
              const EnergyIcon = ENERGY_ICON[current.energyLevel];
              return (
                <span className="inline-flex items-center gap-xs font-sans text-xs text-text-muted bg-surface-raised rounded-full px-sm py-xs border border-border-subtle">
                  {EnergyIcon && <EnergyIcon size={14} aria-hidden="true" />}
                  {current.energyLevel}
                </span>
              );
            })()}
          </div>
        </div>

        {/* Instructions */}
        {current.instructions && current.instructions.length > 0 && (
          <div className="mb-lg bg-surface-panel rounded-lg border border-border-subtle p-lg shadow-card">
            <HearthPortableText value={current.instructions as Parameters<typeof HearthPortableText>[0]['value']} />
          </div>
        )}

        {/* Why This Works — collapsible pedagogy context */}
        {currentOverlay && (currentOverlay.lens.perspective || currentOverlay.lens.facilitatorTips) && (
          <details className="mb-lg">
            <summary className="inline-flex items-center gap-xs font-sans text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-colors duration-200 select-none">
              <Lightbulb size={16} aria-hidden="true" />
              Why This Works
            </summary>
            <div className="mt-sm bg-surface-raised rounded-lg border border-border-subtle p-lg space-y-md">
              {currentOverlay.lens.perspective && (
                <p className="font-serif text-sm text-text-secondary leading-relaxed">
                  {currentOverlay.lens.perspective}
                </p>
              )}
              {currentOverlay.lens.facilitatorTips && (
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-xs">
                    Tips
                  </p>
                  <p className="font-serif text-sm text-text-secondary leading-relaxed">
                    {currentOverlay.lens.facilitatorTips}
                  </p>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Materials reminder */}
        {current.materials && current.materials.length > 0 && (
          <div className="mb-lg">
            <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-sm">
              Materials
            </p>
            <div className="flex flex-wrap gap-xs">
              {current.materials.map((mat, i) => (
                <span
                  key={i}
                  className="font-sans text-xs text-text-secondary bg-surface-raised rounded-full px-sm py-xs border border-border-subtle"
                >
                  {mat.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Hearth materials — inline embeds for current activity (audio filtered out) */}
        {(((current.assets?.filter((ref) => ref.asset && ref.asset.kind !== 'audio').length ?? 0) > 0) || (current.commonsTexts && current.commonsTexts.length > 0)) && (
          <div className="mb-lg">
            <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-sm">
              Hearth Materials
            </p>
            <div className="space-y-sm">
              {current.assets?.filter((ref) => ref.asset && ref.asset.kind !== 'audio').map((ref) => {
                if (!ref.asset) return null;
                const KindIcon = ASSET_KIND_ICON[ref.asset.kind as AssetKind] ?? ASSET_KIND_ICON.template;
                return (
                  <div
                    key={ref._key}
                    className="flex items-center gap-md p-sm rounded-[10px] border border-border-subtle bg-surface-raised"
                  >
                    {ref.asset.thumbnailUrl ? (
                      <div className="relative shrink-0 w-12 h-12 rounded-[6px] bg-surface-panel border border-border-subtle overflow-hidden">
                        <Image src={ref.asset.thumbnailUrl} alt="" fill sizes="48px" className="object-cover" />
                      </div>
                    ) : (
                      <div className="shrink-0 w-12 h-12 rounded-[6px] bg-surface-panel border border-border-subtle flex items-center justify-center text-text-secondary">
                        <KindIcon size={22} aria-hidden="true" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-sm text-text-primary truncate">{ref.asset.title}</p>
                      <p className="font-sans text-[0.68rem] text-text-muted">
                        {ref.asset.kind?.replace(/_/g, ' ')}{ref.asset.pageCount ? ` · ${ref.asset.pageCount} pg` : ''}
                        {ref.asset.printGuidance ? ` · ${ref.asset.printGuidance}` : ''}
                      </p>
                    </div>
                    {onDownloadAsset && (
                      <button
                        onClick={() => onDownloadAsset(ref.asset._id)}
                        className="shrink-0 font-sans text-[0.75rem] font-medium text-ember hover:text-ember/80 transition-colors duration-200"
                      >
                        Download
                      </button>
                    )}
                  </div>
                );
              })}
              {current.commonsTexts?.map((ref) => {
                if (!ref.text) return null;
                return (
                  <div
                    key={ref._key}
                    className="flex items-center gap-md p-sm rounded-[10px] border border-border-subtle bg-surface-raised"
                  >
                    <div className="shrink-0 w-12 h-12 rounded-[6px] bg-surface-panel border border-border-subtle flex items-center justify-center text-text-secondary">
                      <COMMONS_KIND_ICON size={22} aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-sm text-text-primary truncate">{ref.text.title}</p>
                      <p className="font-sans text-[0.68rem] text-text-muted">
                        {ref.text.kind?.replace(/_/g, ' ')}{ref.text.estimatedReadAloudMinutes ? ` · ${ref.text.estimatedReadAloudMinutes} min` : ''}
                        {ref.presentationMode ? ` · ${ref.presentationMode.replace(/_/g, ' ')}` : ''}
                      </p>
                    </div>
                    {onOpenReader ? (
                      <button
                        onClick={() => onOpenReader(ref.text._id)}
                        className="shrink-0 font-sans text-[0.75rem] font-medium text-ember hover:text-ember/80 transition-colors duration-200"
                      >
                        Open reader →
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Observation prompts — mobile/tablet always-visible, shown in right panel on xl */}
        {current.observationPrompts && current.observationPrompts.length > 0 && (
          <div className="mb-lg xl:hidden">
            <div className="border-l-[3px] border-sage pl-md space-y-sm">
              <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-sage">
                Watch For
              </p>
              {current.observationPrompts.map((prompt, i) => (
                <p key={i} className="inline-flex items-start gap-xs font-serif text-sm text-text-secondary leading-relaxed italic">
                  <Eye size={14} className="mt-1 shrink-0" aria-hidden="true" />
                  {prompt}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Pedagogy lens — mobile/tablet only collapsible, shown in right panel on xl */}
        {currentOverlay && (
          <div className="mb-lg xl:hidden">
            <button
              onClick={() => setOverlayOpen((v) => !v)}
              className="flex items-center gap-xs font-sans text-sm text-text-secondary hover:text-text-primary transition-colors duration-200 mb-sm"
            >
              <CaretDown size={12} className={`transition-transform duration-200 ${overlayOpen ? '' : '-rotate-90'}`} aria-hidden="true" />
              <span className="text-ember" aria-hidden="true"><Asterisk size={12} /></span>
              <span>{pedagogy ? (PEDAGOGY_LABELS[pedagogy] ?? 'Your Lens') : 'Pedagogy Lens'}</span>
            </button>
            {overlayOpen && (
              <div className="rounded-lg border border-border-medium bg-ember-glow p-lg space-y-md">
                {currentOverlay.lens.perspective && (
                  <div>
                    <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-xs">
                      Perspective
                    </p>
                    <p className="font-serif text-sm leading-relaxed text-text-secondary">
                      {currentOverlay.lens.perspective}
                    </p>
                  </div>
                )}
                {currentOverlay.lens.facilitatorTips && (
                  <div>
                    <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-xs">
                      Tips for You
                    </p>
                    <p className="font-serif text-sm leading-relaxed text-text-secondary">
                      {currentOverlay.lens.facilitatorTips}
                    </p>
                  </div>
                )}
                {currentOverlay.lens.languageFrame && (
                  <div>
                    <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-xs">
                      Language
                    </p>
                    <p className="font-serif text-sm leading-relaxed text-text-secondary">
                      {currentOverlay.lens.languageFrame}
                    </p>
                  </div>
                )}
                {currentOverlay.lens.watchFor && (
                  <div>
                    <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-xs">
                      Watch For
                    </p>
                    <p className="font-serif text-sm leading-relaxed text-text-secondary">
                      {currentOverlay.lens.watchFor}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Facilitator guidance — mobile/tablet only collapsible, shown in right panel on xl */}
        {current.facilitatorGuidance && (
          <div className="mb-lg xl:hidden">
            <button
              onClick={() => setGuidanceOpen((v) => !v)}
              className="flex items-center gap-xs font-sans text-sm text-text-secondary hover:text-text-primary transition-colors duration-200 mb-sm"
            >
              <span>{guidanceOpen ? '▾' : '▸'}</span>
              <span>Facilitator Guidance</span>
            </button>
            {guidanceOpen && (
              <div className="bg-surface-raised rounded-lg border border-border-subtle p-lg space-y-md">
                {current.facilitatorGuidance.before && (
                  <div>
                    <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-xs">
                      Before
                    </p>
                    <p className="font-serif text-sm text-text-secondary leading-relaxed">
                      {current.facilitatorGuidance.before}
                    </p>
                  </div>
                )}
                {current.facilitatorGuidance.during && (
                  <div>
                    <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-xs">
                      During
                    </p>
                    <p className="font-serif text-sm text-text-secondary leading-relaxed">
                      {current.facilitatorGuidance.during}
                    </p>
                  </div>
                )}
                {current.facilitatorGuidance.challenges && (
                  <div>
                    <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-xs">
                      If Not Landing
                    </p>
                    <div className="space-y-sm">
                      {(() => {
                        const lines = current.facilitatorGuidance.challenges.split('\n').filter((l) => l.trim());
                        if (lines.length <= 1) {
                          return (
                            <p className="font-serif text-sm text-text-secondary leading-relaxed">
                              {current.facilitatorGuidance.challenges}
                            </p>
                          );
                        }
                        return lines.map((line, i) => {
                          const end = line.indexOf('. ');
                          const trigger = end > 0 ? line.slice(0, end + 1) : line;
                          const suggestion = end > 0 ? line.slice(end + 2) : '';
                          return (
                            <div key={i} className="bg-surface-panel rounded-md border border-border-subtle p-sm">
                              <p className="font-sans text-xs font-semibold text-text-primary mb-xs">{trigger}</p>
                              {suggestion && (
                                <p className="font-serif text-sm text-text-secondary leading-relaxed">{suggestion}</p>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="fixed bottom-20 left-0 right-0 lg:left-[220px] px-md pb-md bg-gradient-to-t from-surface-body via-surface-body/95 to-transparent pt-lg">
          <div className="flex gap-sm">
            {onPause && (
              <button
                onClick={onPause}
                className="shrink-0 rounded-md border border-border-subtle bg-surface-panel px-md py-sm font-sans text-sm font-semibold text-text-secondary transition-all duration-200 hover:border-border-medium hover:text-text-primary"
              >
                ⏸ Pause
              </button>
            )}
            {isLast ? (
              // Last activity: "Finish & Log" is itself the end-and-log exit.
              <button
                onClick={onFinish}
                className="flex-1 bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm text-sm hover:bg-ember-hover transition-all duration-200 shadow-ember"
              >
                Finish & Log →
              </button>
            ) : (
              <>
                {/* Persistent mid-session exit — "life happens", one-and-done logging.
                    Ghost/secondary so "Next Activity" stays the single primary CTA. */}
                {onEndAndLog && (
                  <button
                    onClick={onEndAndLog}
                    className="shrink-0 rounded-md border border-border-subtle bg-transparent px-md py-sm font-sans text-sm font-semibold text-text-secondary transition-all duration-200 hover:border-border-medium hover:text-text-primary"
                  >
                    End &amp; Log
                  </button>
                )}
                <button
                  onClick={() => {
                    const next = currentIdx + 1;
                    setLocalCurrentIdx(next);
                    setGuidanceOpen(false);
                    setOverlayOpen(false);
                    onChunkChange?.(next);
                  }}
                  className="flex-1 bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm text-sm hover:bg-ember-hover transition-all duration-200 shadow-ember"
                >
                  Next Activity →
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right guidance panel — desktop only */}
      <aside className="hidden xl:block bg-surface-panel border-l border-border-subtle sticky top-0 h-dvh overflow-y-auto p-lg space-y-xl">
        {/* Quick Capture */}
        {onAddCapture && (
          <div>
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted mb-md pb-sm border-b border-border-subtle">
              Quick Capture {quickCaptures && quickCaptures.length > 0 && (
                <span className="ml-sm bg-ember text-text-inverse rounded-full px-sm py-[1px] text-[10px] font-semibold">
                  {quickCaptures.length}
                </span>
              )}
            </p>
            <QuickCapture
              captures={quickCaptures ?? []}
              currentActivityIdx={externalActivityIdx ?? currentIdx}
              currentActivityTitle={current.title}
              currentActivityId={current._id}
              onAddCapture={onAddCapture}
              onRemoveCapture={onRemoveCapture ?? (() => {})}
            />
          </div>
        )}

        {/* Observation prompts */}
        {current.observationPrompts && current.observationPrompts.length > 0 && (
          <div>
            <p className="inline-flex items-center gap-xs font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-sage mb-md pb-sm border-b border-border-subtle">
              <Eye size={12} aria-hidden="true" /> Watch For
            </p>
            <div className="space-y-sm">
              {current.observationPrompts.map((prompt, i) => (
                <div
                  key={i}
                  className="bg-surface-raised rounded-md px-md py-sm border border-border-subtle"
                >
                  <p className="font-serif text-sm text-text-secondary italic">{prompt}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pedagogy lens — always visible */}
        {currentOverlay && (
          <div>
            <p className="inline-flex items-center gap-xs font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-ember mb-md pb-sm border-b border-border-subtle">
              <Asterisk size={12} aria-hidden="true" /> {pedagogy ? (PEDAGOGY_LABELS[pedagogy] ?? 'Your Lens') : 'Pedagogy Lens'}
            </p>
            <div className="rounded-lg border border-border-medium bg-ember-glow p-lg space-y-md">
              {currentOverlay.lens.perspective && (
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-xs">
                    Perspective
                  </p>
                  <p className="font-serif text-sm leading-relaxed text-text-secondary">
                    {currentOverlay.lens.perspective}
                  </p>
                </div>
              )}
              {currentOverlay.lens.facilitatorTips && (
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-xs">
                    Tips for You
                  </p>
                  <p className="font-serif text-sm leading-relaxed text-text-secondary">
                    {currentOverlay.lens.facilitatorTips}
                  </p>
                </div>
              )}
              {currentOverlay.lens.languageFrame && (
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-xs">
                    Language
                  </p>
                  <p className="font-serif text-sm leading-relaxed text-text-secondary">
                    {currentOverlay.lens.languageFrame}
                  </p>
                </div>
              )}
              {currentOverlay.lens.watchFor && (
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-xs">
                    Watch For
                  </p>
                  <p className="font-serif text-sm leading-relaxed text-text-secondary">
                    {currentOverlay.lens.watchFor}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Facilitator guidance — always visible */}
        {current.facilitatorGuidance && (
          <div>
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted mb-md pb-sm border-b border-border-subtle">
              Facilitator Guidance
            </p>
            <div className="bg-surface-raised rounded-lg border border-border-subtle p-lg space-y-md">
              {current.facilitatorGuidance.before && (
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-xs">
                    Before
                  </p>
                  <p className="font-serif text-sm text-text-secondary leading-relaxed">
                    {current.facilitatorGuidance.before}
                  </p>
                </div>
              )}
              {current.facilitatorGuidance.during && (
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-xs">
                    During
                  </p>
                  <p className="font-serif text-sm text-text-secondary leading-relaxed">
                    {current.facilitatorGuidance.during}
                  </p>
                </div>
              )}
              {current.facilitatorGuidance.challenges && (
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-xs">
                    If Challenges Arise
                  </p>
                  <p className="font-serif text-sm text-text-secondary leading-relaxed">
                    {current.facilitatorGuidance.challenges}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* If Not Landing — pivot suggestions */}
        {current.facilitatorGuidance?.challenges && (
          <div>
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted mb-md pb-sm border-b border-border-subtle">
              If Not Landing
            </p>
            <div className="space-y-sm">
              {(() => {
                const lines = current.facilitatorGuidance.challenges.split('\n').filter((l) => l.trim());
                if (lines.length <= 1) {
                  return (
                    <div className="bg-surface-raised rounded-md border border-border-subtle p-md">
                      <p className="font-serif text-sm text-text-secondary leading-relaxed">
                        {current.facilitatorGuidance.challenges}
                      </p>
                    </div>
                  );
                }
                return lines.map((line, i) => {
                  const firstSentenceEnd = line.indexOf('. ');
                  const trigger = firstSentenceEnd > 0 ? line.slice(0, firstSentenceEnd + 1) : line;
                  const suggestion = firstSentenceEnd > 0 ? line.slice(firstSentenceEnd + 2) : '';
                  return (
                    <div key={i} className="bg-surface-raised rounded-md border border-border-subtle p-md">
                      <p className="font-sans text-xs font-semibold text-text-primary mb-xs">{trigger}</p>
                      {suggestion && (
                        <p className="font-serif text-sm text-text-secondary leading-relaxed">{suggestion}</p>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* Fallback when no overlay or guidance */}
        {!currentOverlay && !current.facilitatorGuidance && !current.observationPrompts?.length && !onAddCapture && (
          <div className="text-center py-xl">
            <p className="font-serif text-sm text-text-muted italic">No guidance available for this activity.</p>
          </div>
        )}
      </aside>

      {/* Mobile floating capture button + panel */}
      {onAddCapture && (
        <div className="fixed bottom-32 right-4 xl:hidden z-20">
          {mobileCapture && (
            <div className="absolute bottom-14 right-0 w-72 mb-sm">
              <QuickCapture
                captures={quickCaptures ?? []}
                currentActivityIdx={externalActivityIdx ?? currentIdx}
                currentActivityTitle={current.title}
                onAddCapture={(item) => {
                  onAddCapture(item);
                  setMobileCapture(false);
                }}
                onRemoveCapture={onRemoveCapture ?? (() => {})}
              />
            </div>
          )}
          <button
            onClick={() => setMobileCapture((v) => !v)}
            className="w-12 h-12 rounded-full bg-ember text-text-inverse shadow-ember flex items-center justify-center text-lg font-semibold transition-all duration-200 hover:bg-ember-hover relative"
            aria-label="Quick capture"
          >
            {mobileCapture ? <X size={22} aria-hidden="true" /> : <Camera size={22} aria-hidden="true" />}
            {!mobileCapture && quickCaptures && quickCaptures.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-surface-raised text-ember text-[10px] font-semibold rounded-full w-5 h-5 flex items-center justify-center border border-border-subtle">
                {quickCaptures.length}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
