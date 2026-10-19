import Link from 'next/link';
import { format } from 'date-fns';
import { WifiSlash } from '@/components/icons';
import type { LearnerRecord } from '@/hooks/use-learners-fetch';
import type { ScaffoldData } from '@/hooks/use-scaffold-fetch';
import type { FeltLevel, NoticeFields, SaveBlock } from '@/lib/logger/notice';
import type { NoticeSource } from '@/lib/logger/source';
import { noticeCopy } from './noticeCopy';
import { WhoRow } from './WhoRow';
import { WhatField, type VoiceControls } from './WhatField';
import { PerChildRow } from './PerChildRow';
import { WhenRow } from './WhenRow';
import { EvidenceRow, type EvidenceKind } from './EvidenceRow';
import { SourceBanner } from './SourceBanner';
import { SaveBar } from './SaveBar';

export interface NoticeFormProps {
  fields: NoticeFields;
  learners: LearnerRecord[];
  learnersFailed: boolean;
  onReloadLearners: () => void;
  source: NoticeSource;
  scaffold: ScaffoldData | null;
  online: boolean;
  draft: {
    restored: boolean;
    dateReset: boolean;
    lastSavedAt: number | null;
    onDismiss: () => void;
    onStartFresh: () => void;
  };
  voice: VoiceControls;
  whatPlaceholder: string;
  sourceLearnerName: string | null;
  sourceThreadName: string | null;
  onToggleLearner: (id: string) => void;
  onTextChange: (text: string) => void;
  onFelt: (id: string, level: FeltLevel) => void;
  onNoticed: (id: string, text: string) => void;
  onDate: (dateOccurred: string | null) => void;
  onAddEvidence: (kind: EvidenceKind) => void;
  onRemoveEvidence: (index: number) => void;
  save: { block: SaveBlock; saving: boolean; onSave: () => void };
}

const BANNER_BUTTON =
  'hearth-press min-h-[44px] rounded-sm px-sm font-sans text-xs font-medium text-text-secondary hover:text-text-primary transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)]';

/**
 * The Notice form — every row the parent fills, in order, plus the honest
 * banners (offline, restored draft, working-from) and the Save bar. Pure
 * composition: state lives in the page's hooks, strings in noticeCopy.
 */
export function NoticeForm({
  fields,
  learners,
  learnersFailed,
  onReloadLearners,
  source,
  scaffold,
  online,
  draft,
  voice,
  whatPlaceholder,
  sourceLearnerName,
  sourceThreadName,
  onToggleLearner,
  onTextChange,
  onFelt,
  onNoticed,
  onDate,
  onAddEvidence,
  onRemoveEvidence,
  save,
}: NoticeFormProps) {
  const selectedLearners = fields.learnerIds
    .map((id) => learners.find((l) => l.id === id))
    .filter((l): l is LearnerRecord => l !== undefined);

  return (
    <div className="mx-auto w-full min-w-0 max-w-[560px] px-md pt-lg pb-lg xl:max-w-[600px]">
      <div className="space-y-xl">
        {!online && (
          <div
            role="status"
            className="flex items-start gap-sm rounded-md border border-border-subtle bg-surface-raised p-md"
          >
            <WifiSlash size={18} className="mt-[1px] shrink-0 text-text-secondary" aria-hidden="true" />
            <p className="font-sans text-sm text-text-secondary">{noticeCopy.offlineBanner}</p>
          </div>
        )}

        {draft.restored && (
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-sm rounded-md border border-border-subtle bg-surface-raised p-md"
          >
            <p className="font-sans text-sm text-text-secondary">
              {noticeCopy.draftRestored}
              {draft.dateReset ? noticeCopy.draftDateReset : ''}
            </p>
            <div className="flex items-center gap-xs">
              <button type="button" onClick={draft.onDismiss} className={BANNER_BUTTON}>
                {noticeCopy.dismiss}
              </button>
              <button type="button" onClick={draft.onStartFresh} className={BANNER_BUTTON}>
                {noticeCopy.startFresh}
              </button>
            </div>
          </div>
        )}

        <SourceBanner
          source={source}
          scaffold={scaffold}
          learnerName={sourceLearnerName}
          threadName={sourceThreadName}
        />

        <header className="flex flex-wrap items-baseline justify-between gap-sm">
          <h1 className="heading font-serif text-2xl font-semibold text-text-primary">{noticeCopy.title}</h1>
          {draft.lastSavedAt !== null && (
            <p className="font-sans text-xs text-text-muted">
              {noticeCopy.draftSaved(format(draft.lastSavedAt, 'h:mm aaa'))}
            </p>
          )}
        </header>

        <WhoRow
          learners={learners}
          selected={fields.learnerIds}
          failed={learnersFailed}
          onToggle={onToggleLearner}
          onReload={onReloadLearners}
        />

        <WhatField value={fields.text} onChange={onTextChange} placeholder={whatPlaceholder} voice={voice} />

        {selectedLearners.length > 0 && (
          <div className="space-y-md">
            {selectedLearners.map((learner) => (
              <PerChildRow
                key={learner.id}
                learner={learner}
                felt={fields.felt[learner.id]}
                noticed={fields.noticed[learner.id] ?? ''}
                onFelt={(level) => onFelt(learner.id, level)}
                onNoticed={(text) => onNoticed(learner.id, text)}
              />
            ))}
          </div>
        )}

        <WhenRow dateOccurred={fields.dateOccurred} onChange={onDate} />

        <EvidenceRow evidence={fields.evidence} online={online} onAdd={onAddEvidence} onRemove={onRemoveEvidence} />

        <p className="font-sans text-xs text-text-muted">
          {noticeCopy.catchUp}{' '}
          <Link href="/log/batch" className="underline underline-offset-2 hover:text-text-secondary">
            {noticeCopy.batchLog}
          </Link>
          {' · '}
          <Link href="/log/import" className="underline underline-offset-2 hover:text-text-secondary">
            {noticeCopy.importCsv}
          </Link>
        </p>

        <SaveBar block={save.block} saving={save.saving} onSave={save.onSave} />
      </div>
    </div>
  );
}
