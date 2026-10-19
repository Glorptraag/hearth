'use client';

import { useCallback, useEffect, useReducer, useRef, type Dispatch } from 'react';
import type { DraftEvidenceItem } from '@/lib/logger/draft';
import {
  EMPTY_NOTICE,
  pruneToLearners,
  toggleLearner,
  type FeltLevel,
  type NoticeFields,
} from '@/lib/logger/notice';

export type NoticeAction =
  | { type: 'set-text'; text: string }
  /** Appends with a single space when the field already holds words (voice). */
  | { type: 'append-text'; text: string }
  | { type: 'toggle-learner'; id: string }
  /** Tapping the already-selected level clears it. */
  | { type: 'set-felt'; id: string; level: FeltLevel }
  | { type: 'set-noticed'; id: string; text: string }
  | { type: 'set-date'; dateOccurred: string | null }
  | { type: 'add-evidence'; item: DraftEvidenceItem }
  | { type: 'remove-evidence'; index: number }
  | { type: 'restore'; fields: NoticeFields }
  /**
   * Pre-fill from where the visit came from (scaffold, check-in, only child).
   * Applied only while the form is untouched, so a restored draft is never
   * overwritten by a preselect that lands after it.
   */
  | { type: 'init-from-source'; learnerIds: string[]; text?: string }
  | { type: 'reset' };

function isUntouched(f: NoticeFields): boolean {
  return f.learnerIds.length === 0 && f.text.length === 0 && f.evidence.length === 0;
}

export function noticeReducer(state: NoticeFields, action: NoticeAction): NoticeFields {
  switch (action.type) {
    case 'set-text':
      return { ...state, text: action.text };
    case 'append-text': {
      if (action.text.length === 0) return state;
      const separator = state.text.length === 0 || /\s$/.test(state.text) ? '' : ' ';
      return { ...state, text: `${state.text}${separator}${action.text}` };
    }
    case 'toggle-learner':
      return toggleLearner(state, action.id);
    case 'set-felt': {
      if (!state.learnerIds.includes(action.id)) return state;
      const felt = { ...state.felt };
      if (felt[action.id] === action.level) delete felt[action.id];
      else felt[action.id] = action.level;
      return { ...state, felt };
    }
    case 'set-noticed': {
      if (!state.learnerIds.includes(action.id)) return state;
      return { ...state, noticed: { ...state.noticed, [action.id]: action.text } };
    }
    case 'set-date':
      return { ...state, dateOccurred: action.dateOccurred };
    case 'add-evidence':
      return { ...state, evidence: [...state.evidence, action.item] };
    case 'remove-evidence':
      return { ...state, evidence: state.evidence.filter((_, i) => i !== action.index) };
    case 'restore':
      return pruneToLearners({ ...action.fields });
    case 'init-from-source': {
      if (!isUntouched(state)) return state;
      const learnerIds = Array.from(new Set(action.learnerIds));
      const text = action.text ?? '';
      if (learnerIds.length === 0 && text.length === 0) return state;
      return { ...state, learnerIds, text };
    }
    case 'reset':
      return EMPTY_NOTICE;
    default:
      return state;
  }
}

export type UseNoticeFormReturn = {
  fields: NoticeFields;
  dispatch: Dispatch<NoticeAction>;
  /** Wall-clock ms when text first became non-empty for this entry; null until then. */
  composeStartedAt: () => number | null;
};

/**
 * The Notice form's state. A reducer so every transition is pure and pinned
 * under test; the one piece of non-form bookkeeping (when composing started,
 * for the `compose_ms` analytics prop) lives in a ref that `reset` clears.
 */
export function useNoticeForm(): UseNoticeFormReturn {
  const [fields, rawDispatch] = useReducer(noticeReducer, EMPTY_NOTICE);
  const composeStartRef = useRef<number | null>(null);

  const dispatch = useCallback((action: NoticeAction) => {
    if (action.type === 'reset') composeStartRef.current = null;
    rawDispatch(action);
  }, []);

  useEffect(() => {
    if (fields.text.length > 0 && composeStartRef.current === null) {
      composeStartRef.current = Date.now();
    }
  }, [fields.text]);

  const composeStartedAt = useCallback(() => composeStartRef.current, []);

  return { fields, dispatch, composeStartedAt };
}
