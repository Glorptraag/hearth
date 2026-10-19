import { Camera, ChatCircle, LinkSimple, X } from '@/components/icons';
import type { DraftEvidenceItem } from '@/lib/logger/draft';
import { noticeCopy } from './noticeCopy';

export type EvidenceKind = 'photo' | 'quote' | 'link';

interface EvidenceRowProps {
  evidence: DraftEvidenceItem[];
  online: boolean;
  onAdd: (kind: EvidenceKind) => void;
  onRemove: (index: number) => void;
}

const TOOLS: ReadonlyArray<{ kind: EvidenceKind; Icon: typeof Camera; label: string }> = [
  { kind: 'photo', Icon: Camera, label: noticeCopy.addPhoto },
  { kind: 'quote', Icon: ChatCircle, label: noticeCopy.addWords },
  { kind: 'link', Icon: LinkSimple, label: noticeCopy.addLink },
];

const KIND_LABEL: Record<DraftEvidenceItem['type'], string> = {
  photo: noticeCopy.addPhoto,
  quote: noticeCopy.addWords,
  link: noticeCopy.addLink,
  note: 'Note',
};

function itemSummary(item: DraftEvidenceItem): string {
  if (item.type === 'photo') return item.caption || noticeCopy.addPhoto;
  if (item.type === 'link') return item.name || item.url || noticeCopy.addLink;
  return item.content.slice(0, 60);
}

/**
 * "Add" — Photo · Their words · Link, plus the list of what has been added.
 * Photo is disabled offline (the upload needs a connection). Old 'note' items
 * from a restored draft still list and can be removed.
 */
export function EvidenceRow({ evidence, online, onAdd, onRemove }: EvidenceRowProps) {
  return (
    <section aria-labelledby="notice-add">
      <h2 id="notice-add" className="heading mb-sm font-serif text-base font-semibold text-text-primary">
        {noticeCopy.add}
      </h2>
      <div className="grid grid-cols-3 gap-sm">
        {TOOLS.map(({ kind, Icon, label }) => {
          const disabled = kind === 'photo' && !online;
          return (
            <button
              key={kind}
              type="button"
              onClick={() => onAdd(kind)}
              disabled={disabled}
              title={disabled ? noticeCopy.photosNeedConnection : undefined}
              className="hearth-press flex min-h-[44px] flex-col items-center gap-xs rounded-md border border-dashed border-border-medium p-md font-sans text-xs text-text-secondary hover:border-border-active hover:text-text-primary transition-[border-color,color] duration-[var(--motion-quick)] ease-[var(--ease-default)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border-medium disabled:hover:text-text-secondary"
            >
              <span className="inline-flex" aria-hidden="true">
                <Icon size={22} />
              </span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {evidence.length > 0 && (
        <ul className="mt-md space-y-sm">
          {evidence.map((item, i) => (
            <li
              key={`${item.type}-${i}`}
              className="flex items-center gap-sm rounded-md border border-border-subtle bg-surface-raised p-sm"
            >
              <span className="rounded-sm bg-surface-hover px-xs py-[2px] font-sans text-xs font-medium text-text-muted">
                {KIND_LABEL[item.type]}
              </span>
              <span className="flex-1 truncate font-serif text-sm text-text-secondary">{itemSummary(item)}</span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label={noticeCopy.remove(KIND_LABEL[item.type].toLowerCase())}
                className="hit-target flex min-h-[32px] min-w-[32px] items-center justify-center text-text-muted hover:text-text-primary transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)]"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
