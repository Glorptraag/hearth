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

export interface PackTree {
  pack: any;
  modules: any[];
  approaches: any[];
  activities: any[];
  badges: any[];
}
