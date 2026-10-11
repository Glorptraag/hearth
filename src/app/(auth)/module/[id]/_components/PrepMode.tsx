'use client';

import { useState } from 'react';
import type { Module, ActivityOverlay, Activity } from './types';
import { SETTING_ICON, ENERGY_ICON, PEDAGOGY_LABELS } from './constants';
import { ASSET_KIND_ICON, COMMONS_KIND_ICON, type AssetKind } from '@/components/content/types';
import { Check, Printer, Asterisk, ArrowRight } from '@/components/icons';
import { PackIndicators } from '@/components/ui/PackIndicators';
import type { Indicators } from '@/lib/sanity/pack-indicators';

export default function PrepMode({
  module,
  approachIdx,
  onStart,
  savedChunkIdx,
  onResume,
  overlays,
  pedagogy,
  indicators,
  packState,
  onPrintMaterials,
}: {
  module: Module;
  approachIdx: number;
  onStart: () => void;
  savedChunkIdx?: number;
  onResume?: () => void;
  overlays?: ActivityOverlay[];
  pedagogy?: string | null;
  indicators?: Indicators;
  packState?: { printablesDownloaded: boolean; kitOwned: boolean };
  onPrintMaterials?: () => void;
}) {
  const approach = module.approaches?.[approachIdx];
  const activities = approach?.activities ?? [];
  const firstActivityMaterials = activities[0]?.materials ?? [];
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggleCheck = (key: string) =>
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="px-md py-xl max-w-2xl mx-auto pb-32">
      {/* Header */}
      <div className="mb-xl">
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-ember mb-sm">
          Prep
        </p>
        <h1 className="font-serif text-2xl font-semibold text-text-primary leading-snug mb-sm">
          {module.title}
        </h1>
        <p className="font-serif text-base italic text-text-secondary leading-relaxed">
          {module.targetUnderstanding}
        </p>
        {indicators && (
          <PackIndicators
            context="detail"
            printables={indicators.printables}
            materials={indicators.materials}
            state={packState}
            className="mt-lg"
          />
        )}
      </div>

      {/* Understanding indicators */}
      {module.understandingIndicators && (
        <div className="mb-xl bg-surface-panel rounded-lg border border-border-subtle p-lg shadow-card">
          <h2 className="font-sans text-sm font-semibold text-text-secondary uppercase tracking-widest mb-md">
            What to Look For
          </h2>
          <div className="space-y-sm">
            {module.understandingIndicators.emerging && (
              <div className="flex items-start gap-sm">
                <span className="shrink-0 rounded-full px-sm py-[2px] font-sans text-[10px] font-semibold bg-amber-status/15 text-amber-status mt-[2px]">
                  Emerging
                </span>
                <p className="font-serif text-sm text-text-secondary leading-relaxed">
                  {module.understandingIndicators.emerging}
                </p>
              </div>
            )}
            {module.understandingIndicators.developing && (
              <div className="flex items-start gap-sm">
                <span className="shrink-0 rounded-full px-sm py-[2px] font-sans text-[10px] font-semibold bg-domain-science/15 text-domain-science mt-[2px]">
                  Developing
                </span>
                <p className="font-serif text-sm text-text-secondary leading-relaxed">
                  {module.understandingIndicators.developing}
                </p>
              </div>
            )}
            {module.understandingIndicators.demonstrating && (
              <div className="flex items-start gap-sm">
                <span className="shrink-0 rounded-full px-sm py-[2px] font-sans text-[10px] font-semibold bg-sage/15 text-sage mt-[2px]">
                  Demonstrating
                </span>
                <p className="font-serif text-sm text-text-secondary leading-relaxed">
                  {module.understandingIndicators.demonstrating}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Session overview */}
      {activities.length > 0 && (
        <div className="mb-xl bg-surface-panel rounded-lg border border-border-subtle p-lg shadow-card">
          <h2 className="font-sans text-sm font-semibold text-text-secondary uppercase tracking-widest mb-md">
            Session Flow
          </h2>
          <div className="space-y-sm">
            {activities.map((act, i) => (
              <div key={act._id} className="flex items-start gap-sm">
                <span className="font-sans text-xs font-semibold text-ember mt-1 w-5 shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <span className="font-serif text-sm font-semibold text-text-primary">
                    {act.title}
                  </span>
                  {act.duration && (
                    <span className="font-sans text-xs text-text-muted ml-sm">
                      {act.duration.min}–{act.duration.max} min
                    </span>
                  )}
                  <div className="flex gap-xs mt-xs">
                    {act.setting && (() => {
                      const SettingIcon = SETTING_ICON[act.setting];
                      return (
                        <span className="inline-flex items-center gap-xs font-sans text-xs text-text-muted">
                          {SettingIcon && <SettingIcon size={14} aria-hidden="true" />}
                          {act.setting}
                        </span>
                      );
                    })()}
                    {act.energyLevel && (() => {
                      const EnergyIcon = ENERGY_ICON[act.energyLevel];
                      return (
                        <span className="inline-flex items-center gap-xs font-sans text-xs text-text-muted">
                          ·
                          {EnergyIcon && <EnergyIcon size={14} aria-hidden="true" />}
                          {act.energyLevel}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Materials checklist */}
      {firstActivityMaterials.length > 0 && (
        <div className="mb-xl bg-surface-panel rounded-lg border border-border-subtle p-lg shadow-card">
          <h2 className="font-sans text-sm font-semibold text-text-secondary uppercase tracking-widest mb-md">
            Gather First — Materials for Activity 1
          </h2>
          <div className="space-y-sm">
            {firstActivityMaterials.map((mat, i) => {
              const key = `mat-${i}`;
              return (
                <button
                  key={key}
                  onClick={() => toggleCheck(key)}
                  className="flex items-center gap-sm w-full text-left group"
                >
                  <span
                    className={`w-5 h-5 rounded border shrink-0 flex items-center justify-center transition duration-[var(--motion-quick)] ${
                      checked[key]
                        ? 'bg-ember border-ember text-text-inverse'
                        : 'border-border-medium bg-transparent'
                    }`}
                  >
                    {checked[key] && <Check size={12} aria-hidden="true" />}
                  </span>
                  <span
                    className={`font-serif text-sm transition-colors duration-[var(--motion-quick)] ${
                      checked[key] ? 'text-text-muted line-through' : 'text-text-primary'
                    }`}
                  >
                    {mat.name}
                    {!mat.required && (
                      <span className="font-sans text-xs text-text-muted ml-xs">(optional)</span>
                    )}
                    {mat.alternative && (
                      <span className="font-sans text-xs text-text-muted ml-xs">
                        · alt: {mat.alternative}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Hearth Provides — assets and commons texts across this module */}
      {(() => {
        const allAssets: { activity: Activity; ref: NonNullable<Activity['assets']>[0] }[] = [];
        const allTexts: { activity: Activity; ref: NonNullable<Activity['commonsTexts']>[0] }[] = [];
        const seenAssetIds = new Set<string>();
        const seenTextIds = new Set<string>();

        for (const act of activities) {
          for (const ref of act.assets ?? []) {
            if (ref.asset && !seenAssetIds.has(ref.asset._id)) {
              seenAssetIds.add(ref.asset._id);
              allAssets.push({ activity: act, ref });
            }
          }
          for (const ref of act.commonsTexts ?? []) {
            if (ref.text && !seenTextIds.has(ref.text._id)) {
              seenTextIds.add(ref.text._id);
              allTexts.push({ activity: act, ref });
            }
          }
        }

        if (allAssets.length === 0 && allTexts.length === 0) return null;

        const printableCount = allAssets.filter((a) => a.ref.asset.kind !== 'audio').length;

        return (
          <div className="mb-xl bg-surface-panel rounded-lg border border-border-subtle p-lg shadow-card">
            <h2 className="font-sans text-sm font-semibold text-text-secondary uppercase tracking-widest mb-md">
              Hearth Provides
            </h2>
            <div className="space-y-xs">
              {allAssets.map(({ activity, ref }) => {
                const KindIcon = ASSET_KIND_ICON[ref.asset.kind as AssetKind] ?? ASSET_KIND_ICON.template;
                return (
                  <div key={ref.asset._id} className="flex items-center gap-sm py-xs">
                    <span className="shrink-0 inline-flex text-text-secondary" aria-hidden="true">
                      <KindIcon size={16} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-sm text-text-primary truncate">{ref.asset.title}</p>
                      <p className="font-sans text-[0.68rem] text-text-muted">
                        {ref.asset.kind?.replace(/_/g, ' ')}{ref.asset.pageCount ? ` · ${ref.asset.pageCount} pg` : ''} · {activity.title}
                      </p>
                    </div>
                    {ref.role !== 'core' && (
                      <span className="font-sans text-[10px] text-text-muted bg-surface-raised rounded-full px-1.5 py-[1px] border border-border-subtle">
                        {ref.role === 'optional' ? 'Optional' : 'Extension'}
                      </span>
                    )}
                  </div>
                );
              })}
              {allTexts.map(({ activity, ref }) => (
                <div key={ref.text._id} className="flex items-center gap-sm py-xs">
                  <span className="shrink-0 inline-flex text-text-secondary" aria-hidden="true">
                    <COMMONS_KIND_ICON size={16} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-sm text-text-primary truncate">{ref.text.title}</p>
                    <p className="font-sans text-[0.68rem] text-text-muted">
                      {ref.text.kind?.replace(/_/g, ' ')}{ref.text.estimatedReadAloudMinutes ? ` · ${ref.text.estimatedReadAloudMinutes} min` : ''} · {activity.title}
                    </p>
                  </div>
                  {ref.role !== 'core' && (
                    <span className="font-sans text-[10px] text-text-muted bg-surface-raised rounded-full px-1.5 py-[1px] border border-border-subtle">
                      {ref.role === 'optional' ? 'Optional' : 'Extension'}
                    </span>
                  )}
                </div>
              ))}
            </div>
            {onPrintMaterials && printableCount > 0 && (
              <button
                onClick={onPrintMaterials}
                className="mt-md inline-flex w-full items-center justify-center gap-xs bg-transparent border border-border-subtle text-text-secondary font-sans font-semibold rounded-md px-md py-sm text-sm hover:border-border-medium hover:text-text-primary transition duration-[var(--motion-quick)]"
              >
                <Printer size={16} aria-hidden="true" />
                Print materials for this module
              </button>
            )}
          </div>
        );
      })()}

      {/* Why This Matters */}
      <div className="mb-xl bg-surface-panel rounded-lg border border-border-subtle p-lg shadow-card">
        <h2 className="font-sans text-sm font-semibold text-text-secondary uppercase tracking-widest mb-md">
          Why This Matters
        </h2>
        <p className="font-serif text-base text-text-primary leading-relaxed mb-md">
          {module.targetUnderstanding}
        </p>
        {module.capabilityThreads && module.capabilityThreads.length > 0 && (
          <div className="flex flex-wrap gap-xs">
            {module.capabilityThreads.map((thread) => (
              <span
                key={thread._id}
                className="font-sans text-[11px] text-text-muted bg-surface-raised rounded-full px-sm py-xs border border-border-subtle"
              >
                {thread.title}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Your Lens — pedagogy overlay perspectives */}
      {(() => {
        if (!overlays || overlays.length === 0) return null;
        const lensItems: { activityTitle: string; perspective: string; watchFor?: string }[] = [];
        activities.forEach((act) => {
          const ov = overlays.find((o) => o.activityId === act._id);
          if (ov?.lens.perspective) {
            lensItems.push({ activityTitle: act.title, perspective: ov.lens.perspective, watchFor: ov.lens.watchFor });
          }
        });
        if (lensItems.length === 0) return null;
        const label = pedagogy ? (PEDAGOGY_LABELS[pedagogy] ?? 'Your Lens') : 'Your Lens';
        return (
          <div className="mb-xl rounded-lg border border-border-medium bg-ember-glow p-lg">
            <h2 className="inline-flex items-center gap-xs font-sans text-sm font-semibold text-ember uppercase tracking-widest mb-md">
              <Asterisk size={14} aria-hidden="true" /> {label}
            </h2>
            <div className="space-y-md">
              {lensItems.map((item, i) => (
                <div key={i}>
                  <p className="font-sans text-[11px] text-text-muted mb-xs">{item.activityTitle}</p>
                  <p className="font-serif text-sm text-text-secondary leading-relaxed">
                    {item.perspective}
                  </p>
                  {item.watchFor && (
                    <p className="font-serif text-xs text-text-muted leading-relaxed mt-xs italic">
                      Watch for: {item.watchFor}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Key Phrases */}
      {(() => {
        const sayBlocks: { activityTitle: string; text: string }[] = [];
        activities.forEach((act) => {
          if (act.instructions) {
            (act.instructions as { _type?: string; style?: string; children?: { text?: string }[] }[]).forEach((block) => {
              if (block.style === 'sayBlock' && block.children) {
                const text = block.children.map((c) => c.text ?? '').join('');
                if (text) sayBlocks.push({ activityTitle: act.title, text });
              }
            });
          }
        });
        return sayBlocks.length > 0 ? (
          <div className="mb-xl bg-surface-panel rounded-lg border border-border-subtle p-lg shadow-card">
            <h2 className="font-sans text-sm font-semibold text-text-secondary uppercase tracking-widest mb-md">
              Key Phrases — Read through these now so they feel natural
            </h2>
            <div className="space-y-md">
              {sayBlocks.map((sb, i) => (
                <div key={i} className="border-l-[3px] border-ember pl-md">
                  <p className="font-sans text-[11px] text-text-muted mb-xs">{sb.activityTitle}</p>
                  <p className="font-serif text-sm text-text-primary leading-relaxed">{sb.text}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null;
      })()}

      {/* Watch For — aggregated */}
      {(() => {
        const prompts: { activityTitle: string; prompt: string }[] = [];
        activities.forEach((act) => {
          act.observationPrompts?.forEach((prompt) => {
            prompts.push({ activityTitle: act.title, prompt });
          });
        });
        return prompts.length > 0 ? (
          <div className="mb-xl bg-surface-panel rounded-lg border border-border-subtle p-lg shadow-card">
            <h2 className="font-sans text-sm font-semibold text-sage uppercase tracking-widest mb-md">
              What to Watch For
            </h2>
            <div className="space-y-sm">
              {prompts.map((p, i) => (
                <div key={i} className="flex items-start gap-sm">
                  <span className="shrink-0 font-sans text-[11px] text-text-muted bg-surface-raised rounded-full px-sm py-xs border border-border-subtle mt-[2px]">
                    {p.activityTitle}
                  </span>
                  <p className="font-serif text-sm text-text-secondary leading-relaxed italic">
                    {p.prompt}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null;
      })()}

      {/* Resume banner */}
      {savedChunkIdx !== undefined && savedChunkIdx > 0 && onResume && (
        <div className="mb-md rounded-lg border border-ember/30 bg-ember-glow p-md flex items-center justify-between">
          <div>
            <p className="font-sans text-xs font-semibold text-ember mb-[2px]">Session in progress</p>
            <p className="font-serif text-sm text-text-secondary">
              Activity {savedChunkIdx + 1} of {module.approaches?.[approachIdx]?.activities?.length ?? 1}
            </p>
          </div>
          <button
            onClick={onResume}
            className="hearth-link-arrow font-sans text-sm font-semibold text-ember hover:text-ember-hover transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)]"
          >
            Resume <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Start button */}
      <button
        onClick={onStart}
        className="hearth-press w-full bg-ember text-text-inverse font-sans font-semibold rounded-md px-md py-sm text-sm hover:bg-ember-hover shadow-ember"
      >
        {savedChunkIdx !== undefined && savedChunkIdx > 0 ? 'Restart from Beginning' : 'Start Session'}
      </button>
    </div>
  );
}
