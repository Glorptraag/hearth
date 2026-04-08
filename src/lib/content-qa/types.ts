export type DocType = 'pack' | 'module' | 'approach' | 'activity' | 'badge';

export interface FieldRule {
  field: string;
  required: boolean;
  weakIf?: (value: unknown) => boolean;
  description: string;
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
