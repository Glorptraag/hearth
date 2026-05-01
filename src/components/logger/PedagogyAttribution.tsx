'use client';

import { useState } from 'react';

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
        className="font-sans text-xs text-text-secondary hover:text-text-primary transition-all duration-200 ease-[var(--ease-default)]"
        aria-expanded={expanded}
      >
        {expanded
          ? `Grounded in ${frameworkTitle} \u2039`
          : `Grounded in ${frameworkTitle} \u203a`}
      </button>

      {expanded && (
        <div className="mt-md space-y-sm">
          {sources.map((source) => (
            <SourceCard key={source.id} source={source} />
          ))}
        </div>
      )}
    </div>
  );
}

function SourceCard({ source }: { source: PedagogyAttributionSource }) {
  if (source.layer === 'source_excerpt') {
    const text = (source.metadata.quotationText ?? source.metadata.text) as string | undefined;
    const attribution = source.metadata.sourceAttribution as string | undefined;

    return (
      <div className="bg-surface-panel rounded-lg p-lg border border-border-subtle mb-sm">
        {text && (
          <p className="font-serif text-sm text-text-secondary italic leading-relaxed">
            &ldquo;{text}&rdquo;
          </p>
        )}
        {attribution && (
          <p className="font-sans text-xs text-text-muted mt-xs">{attribution}</p>
        )}
      </div>
    );
  }

  if (source.layer === 'practice_pattern') {
    const triggerTitle = source.metadata.triggerTitle as string | undefined;

    return (
      <div className="bg-surface-panel rounded-lg p-lg border border-border-subtle mb-sm">
        {triggerTitle && (
          <p className="font-serif text-sm text-text-secondary font-semibold">{triggerTitle}</p>
        )}
      </div>
    );
  }

  return null;
}
