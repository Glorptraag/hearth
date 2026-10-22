export type ShelfResourceKind = 'curriculum' | 'universal';

export type ShelfResourceStatus = 'draft' | 'published';

export interface ShelfResourceLevel {
  name: string;
  aliases?: string[];
}

export interface ShelfResource {
  _id: string;
  title: string;
  publisher?: string;
  slug: { current: string };
  kind: ShelfResourceKind;
  aliases?: string[];
  lessonNumberRegex?: string;
  levels?: ShelfResourceLevel[];
  ageBand?: { min?: number; max?: number };
  isUniversal?: boolean;
  status: ShelfResourceStatus;
}
