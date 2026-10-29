import { Camera, ChatCircle, LinkSimple, X } from '@/components/icons';
import type { DraftEvidenceItem } from '@/lib/logger/draft';
import { noticeCopy } from './noticeCopy';

export type EvidenceKind = 'photo' | 'quote' | 'link';

interface EvidenceRowProps {
  evidence: DraftEvidenceItem[];
  online: boolean;
  /** Photo-first: the primary action. Opens the camera / photo picker. */
  onAddPhoto: () => void;
  /** A photo is being prepared and uploaded. */
  photoBusy?: boolean;
  /** The secondary tools (their words, a link) open the evidence sheet. */
  onAdd: (kind: Exclude<EvidenceKind, 'photo'>) => void;
  onRemove: (index: number) => void;
}

const SECONDARY_TOOLS: ReadonlyArray<{ kind: Exclude<EvidenceKind, 'photo'>; Icon: typeof Camera; label: string }> = [
  { kind: 'quote', Icon: ChatCircle, label: noticeCopy.addWords },
  { kind: 'link', Icon: LinkSimple, label: noticeCopy.addLink },
];

const KIND_LABEL: Record<DraftEvidenceItem['type'], string> = {
  photo: noticeCopy.photoLabel,
  quote: noticeCopy.addWords,
  link: noticeCopy.addLink,
  note: 'Note',
};

function itemSummary(item: DraftEvidenceItem): string {
  if (item.type === 'photo') return item.caption || noticeCopy.photoLabel;
  if (item.type === 'link') return item.name || item.url || noticeCopy.addLink;
  return item.content.slice(0, 60);
}

/**
 * "Add" — photo first (W3.1). The camera is the primary action: one tap opens
 * the camera or photo library, and a photo on its own satisfies the save gate
 * (`saveBlock`, unchanged). Their words and a link sit underneath as secondary
 * tools, followed by what has been added. Photo is disabled offline (the upload
 * needs a connection). Old 'note' items from a restored draft still list and
 * can be removed.
 */
export function EvidenceRow({ evidence, online, onAddPhoto, photoBusy = false, onAdd, onRemove }: EvidenceRowProps) {
  const photoDisabled = !online || photoBusy;
  return (
    <section aria-labelledby="notice-add">
      <h2 id="notice-add" className="heading mb-sm font-serif text-base font-semibold text-text-primary">
        {noticeCopy.add}
      </h2>

      <button
        type="button"
        onClick={onAddPhoto}
        disabled={photoDisabled}
        aria-labelledby="notice-add-photo-label"
        aria-describedby="notice-add-photo-hint"
        aria-busy={photoBusy || undefined}
        title={!online ? noticeCopy.photosNeedConnection : undefined}
        className="hearth-press flex min-h-[64px] w-full items-center gap-md rounded-md border border-border-medium bg-surface-raised px-md py-sm text-left hover:border-border-active disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border-medium"
      >
        <span
          aria-hidden="true"
          className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-ember text-text-inverse"
        >
          <Camera size={22} weight="fill" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span id="notice-add-photo-label" className="font-sans text-sm font-semibold text-text-primary">
            {photoBusy ? noticeCopy.addingPhoto : noticeCopy.addPhoto}
          </span>
          <span id="notice-add-photo-hint" className="font-sans text-xs text-text-muted">
            {online ? noticeCopy.addPhotoHint : noticeCopy.photosNeedConnection}
          </span>
        </span>
      </button>

      <div className="mt-sm flex flex-wrap items-center gap-sm">
        <span className="font-sans text-xs text-text-muted">{noticeCopy.addMore}</span>
        {SECONDARY_TOOLS.map(({ kind, Icon, label }) => (
          <button
            key={kind}
            type="button"
            onClick={() => onAdd(kind)}
            className="hearth-press inline-flex min-h-[44px] items-center gap-xs rounded-md border border-dashed border-border-medium px-md font-sans text-xs text-text-secondary hover:border-border-active hover:text-text-primary"
          >
            <Icon size={16} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
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
