import type { ComponentType } from 'react';
import {
  Leaf, CookingPot, BookOpen, Palette, SoccerBall, UsersThree, Note, Sparkle,
  BookOpenText, MathOperations, Atom, Globe, Cpu, PersonSimpleRun, ChatsCircle,
} from '@/components/icons';

/** Icon component shape used by the Logger's option catalogs. */
export type LogIconC = ComponentType<{ size?: number; weight?: 'regular' | 'fill' }>;

/** Activity-type chips for Section 2 (maps to curriculum subjects at save time). */
export const ACTIVITY_TYPES: ReadonlyArray<{ key: string; label: string; Icon: LogIconC }> = [
  { key: 'nature',     label: 'Nature Study',    Icon: Leaf },
  { key: 'cooking',    label: 'Kitchen Science', Icon: CookingPot },
  { key: 'reading',    label: 'Reading',         Icon: BookOpen },
  { key: 'art',        label: 'Creative Arts',   Icon: Palette },
  { key: 'physical',   label: 'Physical',        Icon: SoccerBall },
  { key: 'social',     label: 'Social',          Icon: UsersThree },
  { key: 'structured', label: 'Lesson',          Icon: Note },
  { key: 'freeplay',   label: 'Free Play',       Icon: Sparkle },
];

/** Lesson-subject chips shown when the activity type is 'structured'. */
export const SUBJECTS: ReadonlyArray<{ key: string; label: string; Icon: LogIconC }> = [
  { key: 'english',      label: 'English',      Icon: BookOpenText },
  { key: 'mathematics',  label: 'Maths',        Icon: MathOperations },
  { key: 'science',      label: 'Science',      Icon: Atom },
  { key: 'hass',         label: 'HASS',         Icon: Globe },
  { key: 'arts',         label: 'Arts',         Icon: Palette },
  { key: 'technologies', label: 'Technologies', Icon: Cpu },
  { key: 'hpe',          label: 'HPE',          Icon: PersonSimpleRun },
  { key: 'languages',    label: 'Languages',    Icon: ChatsCircle },
];
