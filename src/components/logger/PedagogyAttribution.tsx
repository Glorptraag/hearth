'use client';

import { useState, type ReactNode } from 'react';
import { CaretDown, CaretUp } from '@/components/icons';
import { frameworkLabel } from '@/lib/pedagogy/framework-labels';

export interface PedagogyAttributionSource {
  id: string;
  layer: string;
  pedagogyKey: string;
  metadata: Record<string, unknown>;
}

interface PedagogyAttributionProps {
  sources?: PedagogyAttributionSource[];
  frameworkTitle?: string;
}

export function PedagogyAttribution({ sources, frameworkTitle = 'Charlotte Mason' }: PedagogyAttributionProps) {
  const [expanded, setExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="bg-surface-panel rounded-lg p-lg border border-border-subtle shadow-card mt-md">
      <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-sm">
        Pedagogy grounding
      </p>
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="inline-flex items-center gap-xs font-sans text-xs text-text-secondary hover:text-text-primary transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)]"
        aria-expanded={expanded}
      >
        Grounded in {frameworkTitle}
        {expanded ? <CaretUp size={12} aria-hidden="true" /> : <CaretDown size={12} aria-hidden="true" />}
      </button>

      {expanded && (
        <div className="mt-md space-y-sm">
          {sources.map((source) => (
            <SourceCard key={source.id} source={source} frameworkTitle={frameworkTitle} />
          ))}
        </div>
      )}
    </div>
  );
}

const CAPTION_CLASS = 'font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted';

/**
 * Shared card shell for every PKB layer. Carries the caption + the
 * eclectic-readiness framework label (only shown when the source's own
 * tradition differs from the family's primary `frameworkTitle`).
 */
function CardShell({
  caption,
  source,
  frameworkTitle,
  children,
}: {
  caption: string;
  source: PedagogyAttributionSource;
  frameworkTitle: string;
  children?: ReactNode;
}) {
  const sourceLabel = frameworkLabel(source.pedagogyKey);
  const showFrameworkLabel = sourceLabel !== frameworkTitle;

  return (
    <div className="bg-surface-panel rounded-lg p-lg border border-border-subtle mb-sm">
      <div className="flex items-start justify-between gap-sm mb-xs">
        <p className={CAPTION_CLASS}>{caption}</p>
        {showFrameworkLabel && (
          <p className="font-sans text-xs text-text-muted shrink-0">{sourceLabel}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function humaniseLayer(layer: string): string {
  return layer.replace(/_/g, ' ');
}

function GenericFallbackCard({
  source,
  frameworkTitle,
}: {
  source: PedagogyAttributionSource;
  frameworkTitle: string;
}) {
  return <CardShell caption={humaniseLayer(source.layer)} source={source} frameworkTitle={frameworkTitle} />;
}

function SourceCard({ source, frameworkTitle }: { source: PedagogyAttributionSource; frameworkTitle: string }) {
  if (source.layer === 'source_excerpt') {
    const text = (source.metadata.quotationText ?? source.metadata.text) as string | undefined;
    const attribution = source.metadata.sourceAttribution as string | undefined;
    const isParaphrase = source.metadata.isParaphrase === true;

    if (!text) {
      return <GenericFallbackCard source={source} frameworkTitle={frameworkTitle} />;
    }

    // A paraphrase is Hearth's words with attribution — never shown in quote
    // marks, which would claim the author said exactly this.
    return (
      <CardShell caption={isParaphrase ? 'From the tradition (paraphrased)' : 'From the source'} source={source} frameworkTitle={frameworkTitle}>
        <p className="font-serif text-sm text-text-secondary italic leading-relaxed">
          {isParaphrase ? text : <>&ldquo;{text}&rdquo;</>}
        </p>
        {attribution && (
          <p className="font-sans text-xs text-text-muted mt-xs">{attribution}</p>
        )}
      </CardShell>
    );
  }

  if (source.layer === 'practice_pattern') {
    const triggerTitle = source.metadata.triggerTitle as string | undefined;
    const triggerContext = source.metadata.triggerContext as string | undefined;

    if (!triggerTitle) {
      return <GenericFallbackCard source={source} frameworkTitle={frameworkTitle} />;
    }

    return (
      <CardShell caption="How this tradition reads it" source={source} frameworkTitle={frameworkTitle}>
        <p className="font-serif text-sm text-text-secondary font-semibold">{triggerTitle}</p>
        {triggerContext && (
          <p className="font-sans text-xs text-text-muted mt-xs">{triggerContext}</p>
        )}
      </CardShell>
    );
  }

  if (source.layer === 'worked_example') {
    const scenarioPreview = source.metadata.scenarioPreview as string | undefined;
    const activityType = source.metadata.activityType as string | undefined;

    if (!scenarioPreview) {
      return <GenericFallbackCard source={source} frameworkTitle={frameworkTitle} />;
    }

    return (
      <CardShell caption="Worked example" source={source} frameworkTitle={frameworkTitle}>
        <p className="font-serif text-sm text-text-secondary italic leading-relaxed">{scenarioPreview}</p>
        {activityType && (
          <span className="mt-xs inline-flex rounded-full border border-border-subtle px-sm py-[2px] font-sans text-[0.6875rem] uppercase tracking-wide text-text-muted">
            {activityType}
          </span>
        )}
      </CardShell>
    );
  }

  if (source.layer === 'observational_marker') {
    const markerName = source.metadata.markerName as string | undefined;
    const whatItIndicates = source.metadata.whatItIndicates as string | undefined;
    const markersToLookFor = source.metadata.markersToLookFor as string[] | undefined;

    if (!markerName) {
      return <GenericFallbackCard source={source} frameworkTitle={frameworkTitle} />;
    }

    return (
      <CardShell caption="What to watch for" source={source} frameworkTitle={frameworkTitle}>
        <p className="font-serif text-sm text-text-secondary font-semibold">{markerName}</p>
        {whatItIndicates && (
          <p className="font-sans text-xs text-text-muted mt-xs">{whatItIndicates}</p>
        )}
        {markersToLookFor && markersToLookFor.length > 0 && (
          <div className="mt-xs space-y-[2px]">
            {markersToLookFor.slice(0, 2).map((marker) => (
              <p key={marker} className="font-sans text-xs text-text-muted">
                Look for: {marker}
              </p>
            ))}
          </div>
        )}
      </CardShell>
    );
  }

  if (source.layer === 'contraindication') {
    const warnedAgainst = source.metadata.warnedAgainst as string | undefined;

    if (!warnedAgainst) {
      return <GenericFallbackCard source={source} frameworkTitle={frameworkTitle} />;
    }

    return (
      <CardShell caption="A caution from this tradition" source={source} frameworkTitle={frameworkTitle}>
        <p className="font-serif text-sm text-text-secondary font-semibold">{warnedAgainst}</p>
      </CardShell>
    );
  }

  if (source.layer === 'facilitation_vocabulary') {
    const verbSample = source.metadata.verbSample as string[] | undefined;

    if (!verbSample || verbSample.length === 0) {
      return <GenericFallbackCard source={source} frameworkTitle={frameworkTitle} />;
    }

    return (
      <CardShell caption="Facilitation language" source={source} frameworkTitle={frameworkTitle}>
        <p className="font-serif text-sm text-text-secondary">{verbSample.join(' · ')}</p>
      </CardShell>
    );
  }

  return <GenericFallbackCard source={source} frameworkTitle={frameworkTitle} />;
}
