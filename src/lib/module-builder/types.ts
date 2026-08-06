export type Pathway = 'material' | 'process' | 'inquiry' | 'retrospective' | 'understanding';

export interface ModuleStep {
  id: string;
  title: string;
  instructions: string;
  observationHint: string;
}

export interface SharedEditData {
  pathway: Pathway;
  title: string;
  targetUnderstanding: string;
  watchFor: string;
  pivot: string;
  steps: ModuleStep[];
  materials: string[];
  subjects: string[];
  duration: string;
  setting: string;
  ageRange: string;
  capabilities: Array<{ threadId: string; confidence: 'explicit' | 'inferred' }>;
  provenance: Record<string, unknown>;
}

/** Row shape returned by GET /api/modules/drafts. */
export interface ModuleDraftRecord {
  id: string;
  familyId: string;
  pathway: Pathway;
  draftData: Record<string, unknown>;
  status: 'draft' | 'complete';
  createdAt: string | null;
  updatedAt: string | null;
}
