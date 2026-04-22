'use client';

import type { Activity, ActivityAsset, ActivityCommonsText } from './types';

const KIND_EMOJI: Record<string, string> = {
  template: '📄',
  worksheet: '📝',
  reference: '📋',
  card_set: '🃏',
  handout: '📑',
  audio: '🔊',
  manipulative: '✂️',
};

const KIND_LABEL: Record<string, string> = {
  template: 'Template',
  worksheet: 'Worksheet',
  reference: 'Reference',
  card_set: 'Card Set',
  handout: 'Handout',
  audio: 'Audio',
  manipulative: 'Manipulative',
};

const PRESENTATION_LABEL: Record<string, string> = {
  read_aloud: 'Read aloud',
  child_reads: 'Child reads',
  reference_only: 'Reference',
  memorisation: 'Memorisation',
};

interface DeduplicatedAsset {
  asset: ActivityAsset['asset'];
  role: ActivityAsset['role'];
  activityTitles: string[];
  notes?: string;
}

interface DeduplicatedText {
  text: ActivityCommonsText['text'];
  role: ActivityCommonsText['role'];
  presentationMode: ActivityCommonsText['presentationMode'];
  activityTitles: string[];
  notes?: string;
}

function deduplicateAssets(activities: Activity[]): DeduplicatedAsset[] {
  const seen = new Map<string, DeduplicatedAsset>();
  for (const act of activities) {
    for (const ref of act.assets ?? []) {
      if (!ref.asset) continue;
      const existing = seen.get(ref.asset._id);
      if (existing) {
        existing.activityTitles.push(act.title);
      } else {
        seen.set(ref.asset._id, {
          asset: ref.asset,
          role: ref.role,
          activityTitles: [act.title],
          notes: ref.notes,
        });
      }
    }
  }
  // Sort: core first, then by kind, then by title
  return Array.from(seen.values()).sort((a, b) => {
    if (a.role === 'core' && b.role !== 'core') return -1;
    if (a.role !== 'core' && b.role === 'core') return 1;
    return a.asset.title.localeCompare(b.asset.title);
  });
}

function deduplicateTexts(activities: Activity[]): DeduplicatedText[] {
  const seen = new Map<string, DeduplicatedText>();
  for (const act of activities) {
    for (const ref of act.commonsTexts ?? []) {
      if (!ref.text) continue;
      const existing = seen.get(ref.text._id);
      if (existing) {
        existing.activityTitles.push(act.title);
      } else {
        seen.set(ref.text._id, {
          text: ref.text,
          role: ref.role,
          presentationMode: ref.presentationMode,
          activityTitles: [act.title],
          notes: ref.notes,
        });
      }
    }
  }
  return Array.from(seen.values()).sort((a, b) => {
    if (a.role === 'core' && b.role !== 'core') return -1;
    if (a.role !== 'core' && b.role === 'core') return 1;
    return a.text.title.localeCompare(b.text.title);
  });
}

export default function PrepResources({ activities }: { activities: Activity[] }) {
  const assets = deduplicateAssets(activities);
  const texts = deduplicateTexts(activities);

  if (assets.length === 0 && texts.length === 0) return null;

  return (
    <div className="mb-xl bg-surface-panel rounded-lg border border-border-subtle p-lg shadow-soft">
      <h2 className="font-sans text-sm font-semibold text-text-secondary uppercase tracking-widest mb-md">
        Printables &amp; Resources
      </h2>

      {/* Assets — downloadable/printable files */}
      {assets.length > 0 && (
        <div className="space-y-sm mb-md">
          {assets.map((item) => {
            const hasFile = !!item.asset.fileUrl;
            return (
              <div
                key={item.asset._id}
                className={`flex items-start gap-sm rounded-md border p-sm transition-all duration-200 ${
                  hasFile
                    ? 'border-border-subtle bg-surface-raised hover:border-border-medium'
                    : 'border-border-subtle/50 bg-surface-panel opacity-60'
                }`}
              >
                {/* Thumbnail or kind icon */}
                <div className="shrink-0 w-10 h-10 rounded flex items-center justify-center bg-surface-body text-lg">
                  {item.asset.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.asset.thumbnailUrl}
                      alt=""
                      className="w-10 h-10 rounded object-cover"
                    />
                  ) : (
                    <span aria-hidden="true">
                      {KIND_EMOJI[item.asset.kind] ?? '📎'}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-xs">
                    <span className="font-serif text-sm font-semibold text-text-primary truncate">
                      {item.asset.title}
                    </span>
                    {item.role === 'optional' && (
                      <span className="font-sans text-[10px] text-text-muted">(optional)</span>
                    )}
                    {item.role === 'extension' && (
                      <span className="font-sans text-[10px] text-text-muted">(extension)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-xs mt-[2px]">
                    <span className="font-sans text-[11px] text-text-muted">
                      {KIND_LABEL[item.asset.kind] ?? item.asset.kind}
                    </span>
                    {item.asset.pageCount && (
                      <span className="font-sans text-[11px] text-text-muted">
                        · {item.asset.pageCount} {item.asset.pageCount === 1 ? 'page' : 'pages'}
                      </span>
                    )}
                  </div>
                  {item.asset.printGuidance && hasFile && (
                    <p className="font-serif text-xs text-text-muted mt-xs leading-relaxed italic">
                      {item.asset.printGuidance}
                    </p>
                  )}
                  {item.activityTitles.length > 1 && (
                    <p className="font-sans text-[10px] text-text-muted mt-xs">
                      Used in: {item.activityTitles.join(', ')}
                    </p>
                  )}
                </div>

                {/* Action */}
                <div className="shrink-0">
                  {hasFile ? (
                    <a
                      href={item.asset.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="font-sans text-xs font-semibold text-ember hover:text-ember-hover transition-colors duration-200 whitespace-nowrap"
                    >
                      Download ↓
                    </a>
                  ) : (
                    <span className="font-sans text-xs text-text-muted whitespace-nowrap">
                      Coming soon
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Commons Texts — reading material */}
      {texts.length > 0 && (
        <div className="space-y-sm">
          {assets.length > 0 && (
            <p className="font-sans text-[11px] font-semibold text-text-muted uppercase tracking-widest mt-sm mb-xs">
              Reading Material
            </p>
          )}
          {texts.map((item) => (
            <div
              key={item.text._id}
              className="flex items-start gap-sm rounded-md border border-border-subtle bg-surface-raised p-sm"
            >
              <div className="shrink-0 w-10 h-10 rounded flex items-center justify-center bg-surface-body text-lg">
                <span aria-hidden="true">📖</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-xs">
                  <span className="font-serif text-sm font-semibold text-text-primary truncate">
                    {item.text.title}
                  </span>
                  {item.role === 'optional' && (
                    <span className="font-sans text-[10px] text-text-muted">(optional)</span>
                  )}
                </div>
                <div className="flex items-center gap-xs mt-[2px]">
                  <span className="font-sans text-[11px] text-text-muted capitalize">
                    {item.text.tradition}
                  </span>
                  {item.text.estimatedReadAloudMinutes && (
                    <span className="font-sans text-[11px] text-text-muted">
                      · ~{item.text.estimatedReadAloudMinutes} min
                    </span>
                  )}
                  <span className="font-sans text-[11px] text-ember">
                    · {PRESENTATION_LABEL[item.presentationMode] ?? item.presentationMode}
                  </span>
                </div>
                {item.activityTitles.length > 1 && (
                  <p className="font-sans text-[10px] text-text-muted mt-xs">
                    Used in: {item.activityTitles.join(', ')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
