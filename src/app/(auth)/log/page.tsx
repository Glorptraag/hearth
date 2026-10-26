'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePedagogy } from '@/hooks/use-pedagogy';
import { useToast } from '@/hooks/use-toast';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useLearnersFetch } from '@/hooks/use-learners-fetch';
import { useScaffoldFetch, type ScaffoldData } from '@/hooks/use-scaffold-fetch';
import { useNoticeForm } from '@/hooks/use-notice-form';
import { useLoggerDraft } from '@/hooks/use-logger-draft';
import { useAudioTranscription } from '@/hooks/use-audio-transcription';
import { useNoticeSave } from '@/hooks/use-notice-save';
import { usePhotoCapture } from '@/hooks/use-photo-capture';
import { usePhotoReadConsent } from '@/hooks/use-photo-read-consent';
import { parseNoticeSource } from '@/lib/logger/source';
import { saveBlock } from '@/lib/logger/notice';
import type { LoggerDraft } from '@/lib/logger/draft';
import { getThreadName } from '@/lib/capability-threads';
import { frameworkLabel } from '@/lib/pedagogy/framework-labels';
import { track } from '@/lib/analytics/posthog';
import ReflectionModal from '@/components/hearth/ReflectionModal';
import { AttachToModuleModal } from '@/components/log/AttachToModuleModal';
import { ConfirmSurface } from '@/components/logger/confirm/ConfirmSurface';
import { PhotoReadDisclosure } from '@/components/logger/PhotoReadDisclosure';
import { SkeletonLoader } from './_components/LoggerSkeleton';
import { NoticeForm } from './_components/NoticeForm';
import { EvidenceModal } from './_components/EvidenceModal';
import { noticeCopy } from './_components/noticeCopy';

type EvidenceKind = 'quote' | 'link';

/**
 * The Logger — Notice, then Confirm.
 *
 * Notice: who · what happened (typed or dictated) · when · how it felt · what
 * each child said or noticed · evidence. Save creates the entry and the server
 * reads it (one Haiku call) for proposed evidence.
 * Confirm: the post-save surface shows those proposals as tappable chips; a
 * tap confirms. No insights rail, no completeness ring — the chips are the
 * insight. See docs/hearth-logger-spec-v2.md.
 *
 * This file is a composition root: state lives in the hooks, every string in
 * noticeCopy / confirmCopy, every derivation in src/lib/logger.
 */
export default function LogPage() {
  const searchParams = useSearchParams();
  const source = useMemo(() => parseNoticeSource(searchParams), [searchParams]);
  const { vocab, pedagogy } = usePedagogy();
  const { toast } = useToast();
  const online = useOnlineStatus();
  const { learners, isLoading, failed, reload } = useLearnersFetch();
  const { fields, dispatch, composeStartedAt } = useNoticeForm();

  // ─── Draft autosave + restore (localStorage primary, Postgres mirror) ───
  const onRestore = useCallback(
    (draft: LoggerDraft) =>
      dispatch({
        type: 'restore',
        fields: {
          learnerIds: draft.learnerIds,
          text: draft.text,
          dateOccurred: draft.dateOccurred,
          felt: draft.felt,
          noticed: draft.noticed,
          evidence: draft.evidence,
        },
      }),
    [dispatch],
  );
  const draft = useLoggerDraft({ state: fields, onRestore });

  // ─── Working from: a Hearth session pre-fills words + children ───
  const scaffold = useScaffoldFetch({
    scaffoldSessionId: source.kind === 'hearth_session' ? source.sessionId : null,
    onLoad: useCallback(
      (data: ScaffoldData) =>
        dispatch({
          type: 'init-from-source',
          learnerIds: data.attendingLearnerIds,
          text: data.session.sharedRecord ?? data.session.description ?? '',
        }),
      [dispatch],
    ),
  });

  // Preselect the check-in child, or the only child. `init-from-source` is a
  // no-op once the form holds anything (a restored draft always wins).
  useEffect(() => {
    if (isLoading || learners.length === 0) return;
    const checkInId = source.kind === 'check_in' ? source.learnerId : null;
    if (checkInId && learners.some((l) => l.id === checkInId)) {
      dispatch({ type: 'init-from-source', learnerIds: [checkInId] });
    } else if (learners.length === 1) {
      dispatch({ type: 'init-from-source', learnerIds: [learners[0].id] });
    }
  }, [isLoading, learners, source, dispatch]);

  // ─── Voice (record → Deepgram → append) ───
  const voice = useAudioTranscription({
    onTranscript: (text) => dispatch({ type: 'append-text', text }),
    onUnsupported: () => toast(noticeCopy.voiceErrors.unsupported, 'error'),
    onError: (kind) => toast(noticeCopy.voiceErrors[kind], 'error'),
  });

  // ─── Save → Confirm ───
  const resetForm = useCallback(() => dispatch({ type: 'reset' }), [dispatch]);
  const { state, isSaving, save, retryEnrichment, badgeReady, logAnother } = useNoticeSave({
    source,
    learners,
    clearDraft: draft.clearDraft,
    resetForm,
    toast,
    analytics: {
      resumedFromDraft: draft.draftRestored,
      draftSavedAt: draft.draftSavedAt,
      composeStartedAt,
    },
  });

  // ─── Photo first (W3.1) + the first-photo disclosure (W3.2) ───
  const photoConsent = usePhotoReadConsent();
  const [disclosureOpen, setDisclosureOpen] = useState(false);
  const photo = usePhotoCapture({
    onAdded: useCallback(
      (item, takenAt) => {
        dispatch({ type: 'add-evidence', item });
        dispatch({ type: 'photo-date', takenAt, now: new Date() });
      },
      [dispatch],
    ),
    onError: useCallback((message: string) => toast(message, 'error'), [toast]),
  });
  // The sheet shows once, before the first photo, while the family hasn't
  // answered. A failed consent read never blocks capture.
  const handleAddPhoto = () => {
    if (photoConsent.loaded && !photoConsent.failed && photoConsent.optIn === null) {
      setDisclosureOpen(true);
      return;
    }
    photo.openPicker();
  };
  // Called inside the answer button's click, so the picker opens in the same
  // gesture (iOS refuses a file input opened after an await).
  const handleDisclosureAnswer = (optIn: boolean) => {
    setDisclosureOpen(false);
    photo.openPicker();
    void photoConsent.setOptIn(optIn);
  };
  const handleDisclosureDismiss = () => setDisclosureOpen(false);

  const [evidenceKind, setEvidenceKind] = useState<EvidenceKind | null>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachedTitle, setAttachedTitle] = useState<string | null>(null);
  const [reflectionDismissed, setReflectionDismissed] = useState(false);

  // A Hearth-session save also asks for the shared reflection, over the surface.
  const savedEntryId = state && state.kind !== 'queued' ? state.entryId : null;
  const showReflection = Boolean(savedEntryId) && source.kind === 'hearth_session' && !reflectionDismissed;
  const dismissReflection = () => setReflectionDismissed(true);

  const handleLogAnother = () => {
    setAttachedTitle(null);
    setAttachOpen(false);
    setReflectionDismissed(false);
    logAnother();
  };

  if (isLoading) return <SkeletonLoader />;

  if (state) {
    const canAttach = state.kind !== 'queued' && source.kind !== 'hearth_session';
    return (
      <>
        <ConfirmSurface
          state={state}
          learners={learners}
          frameworkTitle={frameworkLabel(pedagogy)}
          badgeReady={badgeReady}
          onLogAnother={handleLogAnother}
          onRetryEnrichment={retryEnrichment}
          attach={
            canAttach
              ? {
                  onOpen: () => {
                    track('logger_attach_opened');
                    setAttachOpen(true);
                  },
                  attachedTitle,
                }
              : undefined
          }
        />
        {attachOpen && savedEntryId && (
          <AttachToModuleModal
            entryId={savedEntryId}
            onClose={() => setAttachOpen(false)}
            onAttached={(_moduleId, title) => setAttachedTitle(title ?? 'your module')}
          />
        )}
        {scaffold && (
          <ReflectionModal
            isOpen={showReflection}
            sessionId={scaffold.session.id}
            hearthId={scaffold.session.hearthId}
            hearthName={scaffold.session.hearthName ?? 'Hearth'}
            sessionTitle={scaffold.session.title}
            onClose={dismissReflection}
            onShared={dismissReflection}
            onSkipped={dismissReflection}
          />
        )}
      </>
    );
  }

  const checkInLearner =
    source.kind === 'check_in' && source.learnerId
      ? learners.find((l) => l.id === source.learnerId) ?? null
      : null;

  return (
    <>
      <NoticeForm
        fields={fields}
        learners={learners}
        learnersFailed={failed}
        onReloadLearners={reload}
        source={source}
        scaffold={scaffold}
        online={online}
        draft={{
          restored: draft.draftRestored,
          dateReset: draft.dateReset,
          lastSavedAt: draft.lastSavedAt,
          onDismiss: draft.dismissDraftRestored,
          onStartFresh: () => {
            draft.clearDraft();
            resetForm();
          },
        }}
        voice={{
          isRecording: voice.isRecording,
          isTranscribing: voice.isTranscribing,
          audioLevel: voice.audioLevel,
          supported: voice.isSupported,
          onStart: voice.start,
          onStop: voice.stop,
        }}
        whatPlaceholder={vocab.logWhatPlaceholder || noticeCopy.whatPlaceholderFallback}
        sourceLearnerName={checkInLearner?.name ?? null}
        sourceThreadName={
          source.kind === 'check_in' && source.threadId ? getThreadName(source.threadId) : null
        }
        onToggleLearner={(id) => dispatch({ type: 'toggle-learner', id })}
        onTextChange={(text) => dispatch({ type: 'set-text', text })}
        onFelt={(id, level) => dispatch({ type: 'set-felt', id, level })}
        onNoticed={(id, text) => dispatch({ type: 'set-noticed', id, text })}
        onDate={(dateOccurred) => dispatch({ type: 'set-date', dateOccurred })}
        onAddPhoto={handleAddPhoto}
        photoBusy={photo.uploading}
        onAddEvidence={setEvidenceKind}
        onRemoveEvidence={(index) => dispatch({ type: 'remove-evidence', index })}
        save={{ block: saveBlock(fields), saving: isSaving, onSave: () => void save(fields) }}
      />
      <input
        ref={photo.inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => void photo.onFileChange(e)}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        data-testid="notice-photo-input"
      />
      {disclosureOpen && (
        <PhotoReadDisclosure
          readAvailable={photoConsent.readAvailable}
          onAnswer={handleDisclosureAnswer}
          onDismiss={handleDisclosureDismiss}
        />
      )}
      {evidenceKind && (
        <EvidenceModal
          type={evidenceKind}
          onClose={() => setEvidenceKind(null)}
          onSave={(item) => {
            dispatch({ type: 'add-evidence', item });
            setEvidenceKind(null);
          }}
        />
      )}
    </>
  );
}
