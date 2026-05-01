// ─── Module Experience Constants ─────────────────────────────────────────────

import type { ComponentType } from 'react';
import {
  HandsClapping,
  Eye,
  Ear,
  Quotes,
  UsersThree,
  Binoculars,
  Wind,
  Lightning,
  Flame,
  HouseLine,
  Tree,
  ArrowsClockwise,
  Note,
} from '@/components/icons';

type IconC = ComponentType<{ size?: number; weight?: 'regular' | 'fill' }>;

export const MODALITY_ICON: Record<string, IconC> = {
  kinesthetic: HandsClapping,
  visual: Eye,
  auditory: Ear,
  narrative: Quotes,
  social: UsersThree,
  exploratory: Binoculars,
};

export const ENERGY_ICON: Record<string, IconC> = {
  calm: Wind,
  moderate: Lightning,
  active: Flame,
};

export const SETTING_ICON: Record<string, IconC> = {
  indoor: HouseLine,
  outdoor: Tree,
  either: ArrowsClockwise,
};

/** Fallback icon when the value is missing/unknown. */
export const FALLBACK_PIN_ICON: IconC = Note;

/** Engagement scale emoji — INTENTIONALLY KEPT as emoji per docs/hearth-icon-system-v1.md.
 *  Faces carry warmth Phosphor can't match; bespoke illustration is the upgrade path. */
export const ENGAGEMENT_EMOJI = ['😴', '🙂', '😊', '🌟'];

export const PEDAGOGY_LABELS: Record<string, string> = {
  charlotte_mason: 'Charlotte Mason Lens',
  classical: 'Classical Lens',
  montessori: 'Montessori Lens',
  waldorf_steiner: 'Waldorf Lens',
  unschooling: 'Unschooling Lens',
  eclectic: 'Your Lens',
};
