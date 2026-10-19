import type { ShelfResource } from './types';

const level = (name: string, aliases: string[] = []) => ({ name, aliases });

export const MATH_U_SEE: ShelfResource = {
  _id: 'shelfResource.math-u-see',
  title: 'Math-U-See',
  publisher: 'Demme Learning',
  slug: { current: 'math-u-see' },
  kind: 'curriculum',
  aliases: ['MathUSee', 'Math U See', 'Demme Learning'],
  lessonPattern: 'Lesson\\s+(\\d+)',
  levels: [
    level('Primer'),
    level('Alpha'),
    level('Beta'),
    level('Gamma'),
    level('Delta'),
    level('Epsilon'),
    level('Zeta'),
  ],
  status: 'published',
};

export const GOOD_AND_BEAUTIFUL: ShelfResource = {
  _id: 'shelfResource.the-good-and-the-beautiful',
  title: 'The Good and the Beautiful',
  publisher: 'The Good and the Beautiful',
  slug: { current: 'the-good-and-the-beautiful' },
  kind: 'curriculum',
  aliases: ['Good and the Beautiful', 'TGATB', 'goodandbeautiful.com'],
  lessonPattern: 'Lesson\\s+(\\d+)',
  status: 'published',
};

export const ALL_ABOUT_READING: ShelfResource = {
  _id: 'shelfResource.all-about-reading',
  title: 'All About Reading',
  publisher: 'All About Learning Press',
  slug: { current: 'all-about-reading' },
  kind: 'curriculum',
  aliases: ['AAR', 'All About Learning Press'],
  lessonPattern: 'Lesson\\s+(\\d+)',
  levels: [
    level('Pre-reading', ['Pre reading', 'Prereading']),
    level('Level 1', ['Level One']),
    level('Level 2', ['Level Two']),
    level('Level 3', ['Level Three']),
    level('Level 4', ['Level Four']),
  ],
  status: 'published',
};

export const STORY_OF_THE_WORLD: ShelfResource = {
  _id: 'shelfResource.story-of-the-world',
  title: 'Story of the World',
  publisher: 'Peace Hill Press',
  slug: { current: 'story-of-the-world' },
  kind: 'curriculum',
  aliases: ['SOTW', 'Peace Hill Press'],
  lessonPattern: 'Chapter\\s+(\\d+)',
  levels: [
    level('Volume 1', ['Vol 1', 'Vol. 1', 'Ancient Times']),
    level('Volume 2', ['Vol 2', 'Vol. 2', 'The Middle Ages']),
    level('Volume 3', ['Vol 3', 'Vol. 3', 'Early Modern Times']),
    level('Volume 4', ['Vol 4', 'Vol. 4', 'The Modern Age']),
  ],
  status: 'published',
};

export const MY_OWN_PLAN: ShelfResource = {
  _id: 'shelfResource.my-own-plan',
  title: 'My own plan',
  slug: { current: 'my-own-plan' },
  kind: 'universal',
  isUniversal: true,
  status: 'published',
};

export const AI_MADE_PLAN: ShelfResource = {
  _id: 'shelfResource.an-ai-made-plan',
  title: 'An AI-made plan',
  slug: { current: 'an-ai-made-plan' },
  kind: 'universal',
  isUniversal: true,
  status: 'published',
};

export const SHELF_FIXTURE: ShelfResource[] = [
  MATH_U_SEE,
  GOOD_AND_BEAUTIFUL,
  ALL_ABOUT_READING,
  STORY_OF_THE_WORLD,
  MY_OWN_PLAN,
  AI_MADE_PLAN,
];
