'use client';

import { format } from 'date-fns';
import { evidenceSrc } from '@/lib/evidence';
import {
  ANNOTATED_SAMPLES_COPY,
  BAND_LABEL,
  SLOT_LABEL,
  type AnnotatedSampleGroup,
} from '@/lib/report/annotated-samples';

/**
 * Annotated work samples (W5.1, D-LP-7: the hero output).
 *
 * One card per sample, grouped per learning area: the photo, the parent's own
 * words, then each confirmed objective's plain-language line, its band and the
 * authored band sentence. Every sentence is parent-owned or authored; nothing
 * here is model text. Read-only — samples never fill the six required slots.
 *
 * Serif for what the parent reads (words, objective lines); sans for labels.
 * No ember: nothing on this surface is an action. Static, so reduced-motion
 * safe by construction.
 */

/** Photos shown per card; the rest stay in the Portfolio. */
const MAX_PHOTOS = 3;

function dateLabel(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : format(d, 'd MMM yyyy');
}

export default function AnnotatedSamples({
  groups,
  learnerName,
  domainPill,
}: {
  /** `null` while loading. */
  groups: AnnotatedSampleGroup[] | null;
  learnerName: string;
  /** Subject key → pill classes, from the report page's domain map. */
  domainPill?: Record<string, string>;
}) {
  if (groups === null) return null;
  const total = groups.reduce((n, g) => n + g.samples.length, 0);

  return (
    <section className="mt-lg" aria-labelledby="annotated-samples-heading">
      <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-xs">
        {ANNOTATED_SAMPLES_COPY.overline}
      </p>
      <h2 id="annotated-samples-heading" className="font-serif text-lg font-semibold text-text-primary mb-xs">
        {ANNOTATED_SAMPLES_COPY.heading}
      </h2>
      <p className="font-serif text-sm text-text-secondary leading-relaxed mb-md">
        {total > 0 ? ANNOTATED_SAMPLES_COPY.intro(learnerName) : ANNOTATED_SAMPLES_COPY.empty(learnerName)}
      </p>

      <div className="space-y-lg">
        {groups.map((group) => (
          <div key={group.area}>
            <h3 className="mb-sm flex items-center gap-sm">
              <span
                className={`rounded-full px-sm py-[2px] font-sans text-xs font-semibold ${
                  domainPill?.[group.area] ?? 'bg-surface-hover text-text-secondary'
                }`}
              >
                {group.label}
              </span>
              <span className="font-sans text-xs text-text-muted">
                {group.samples.length} {group.samples.length === 1 ? 'sample' : 'samples'}
              </span>
            </h3>

            <ul className="grid grid-cols-1 lg:grid-cols-2 gap-md">
              {group.samples.map((sample) => (
                <li
                  key={sample.entryId}
                  className="min-w-0 rounded-lg border border-border-subtle bg-surface-panel p-md"
                >
                  <div className="flex items-baseline justify-between gap-sm mb-sm">
                    <p className="min-w-0 truncate font-serif text-sm font-semibold text-text-primary">
                      {sample.title}
                    </p>
                    <span className="shrink-0 font-sans text-xs text-text-muted">{dateLabel(sample.dateOccurred)}</span>
                  </div>

                  <div className="flex gap-sm mb-md overflow-x-auto scrollbar-none">
                    {sample.photos.slice(0, MAX_PHOTOS).map((p, i) => (
                      <div
                        key={`${p.ref}-${i}`}
                        className="h-[96px] w-[128px] shrink-0 overflow-hidden rounded-md border border-border-subtle bg-surface-raised"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={evidenceSrc(p.ref)}
                          alt={p.caption ?? `Photo from ${sample.title || 'this moment'}`}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>

                  <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-text-muted mb-xs">
                    {ANNOTATED_SAMPLES_COPY.yourWords}
                  </p>
                  {sample.parentWords ? (
                    <p className="font-serif text-sm text-text-primary leading-relaxed whitespace-pre-line break-words">
                      {sample.parentWords}
                    </p>
                  ) : (
                    <p className="font-serif text-sm italic text-text-muted">{ANNOTATED_SAMPLES_COPY.noWords}</p>
                  )}

                  {sample.noticed && (
                    <>
                      <p className="mt-sm font-sans text-xs font-semibold uppercase tracking-[0.08em] text-text-muted mb-xs">
                        {ANNOTATED_SAMPLES_COPY.noticed}
                      </p>
                      <p className="font-serif text-sm text-text-primary leading-relaxed break-words">{sample.noticed}</p>
                    </>
                  )}

                  <ul className="mt-md space-y-sm border-t border-border-subtle pt-md">
                    {sample.dlos.map((d) => (
                      <li key={d.dloId}>
                        <p className="font-serif text-sm font-semibold text-text-primary">{d.line}</p>
                        <p className="mt-[2px] flex flex-wrap items-center gap-xs font-sans text-xs text-text-muted">
                          <span className="rounded-full bg-surface-hover px-sm py-[2px] font-semibold text-text-secondary">
                            {BAND_LABEL[d.tier]}
                          </span>
                          <span>{d.threadName}</span>
                        </p>
                        <p className="mt-xs font-serif text-sm italic text-text-secondary">{d.bandSentence}</p>
                      </li>
                    ))}
                  </ul>

                  {sample.requiredSlot && SLOT_LABEL[sample.requiredSlot] && (
                    <p className="mt-sm font-sans text-xs text-text-muted">
                      {ANNOTATED_SAMPLES_COPY.requiredSlot(SLOT_LABEL[sample.requiredSlot])}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
