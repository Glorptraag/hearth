export type DocType = 'pack' | 'module' | 'approach' | 'activity' | 'badge';

export interface FieldRule {
  field: string;
  required: boolean;
  weakIf?: (value: unknown) => boolean;
  description: string;
}

/**
 * A rule whose verdict depends on more than one field, so it can't be expressed
 * as a single-field `FieldRule`. Evaluated against the whole doc, and emitted as
 * a non-blocking issue — it does NOT count toward the completeness score.
 */
export interface CrossFieldRule {
  /** Representative field for the emitted issue (used for dashboard grouping). */
  field: string;
  severity: 'error' | 'warning';
  /** Used verbatim as the issue message. */
  description: string;
  /** Returns true when the doc should be flagged. */
  flagIf: (doc: SanityDoc) => boolean;
}

export interface QAIssue {
  docType: DocType;
  docId: string;
  field: string;
  severity: 'error' | 'warning';
  message: string;
  path: string[];
}

export interface CompletenessResult {
  completeness: number;
  errors: QAIssue[];
  warnings: QAIssue[];
}

export interface SanityDoc {
  _id: string;
  _type?: string;
  _rev?: string;
  _updatedAt?: string;
  _key?: string;
  title?: string;
  slug?: { current?: string };
  [key: string]: unknown;
}

export interface PackTree {
  pack: SanityDoc | null;
  modules: SanityDoc[];
  approaches: SanityDoc[];
  activities: SanityDoc[];
  badges: SanityDoc[];
}
