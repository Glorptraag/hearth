import { describe, expect, it } from 'vitest';
import { matchShelf } from './match';
import {
  AI_MADE_PLAN,
  ALL_ABOUT_READING,
  GOOD_AND_BEAUTIFUL,
  MATH_U_SEE,
  MY_OWN_PLAN,
  SHELF_FIXTURE,
  STORY_OF_THE_WORLD,
} from './match.test-fixtures';

describe('matchShelf', () => {
  describe('Math-U-See', () => {
    it.each(['Primer', 'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta'])('matches level %s', (lvl) => {
      expect(matchShelf(`Math-U-See ${lvl}\nLesson 12\nInstruction Pages`, SHELF_FIXTURE)).toEqual({
        resourceId: MATH_U_SEE._id,
        level: lvl,
        lesson: 12,
        confidence: 'alias',
      });
    });

    it('is case and punctuation insensitive', () => {
      expect(matchShelf('MATH U SEE - gamma - LESSON 3', SHELF_FIXTURE)).toMatchObject({
        resourceId: MATH_U_SEE._id,
        level: 'Gamma',
        lesson: 3,
      });
      expect(matchShelf('mathusee beta lesson 20', SHELF_FIXTURE)).toMatchObject({ level: 'Beta', lesson: 20 });
    });

    it('returns the resource without level or lesson when neither is printed', () => {
      expect(matchShelf('Math-U-See', SHELF_FIXTURE)).toEqual({
        resourceId: MATH_U_SEE._id,
        confidence: 'alias',
      });
    });
  });

  describe('The Good and the Beautiful', () => {
    it('matches on the full title with a lesson', () => {
      expect(matchShelf('The Good and the Beautiful\nLanguage Arts Level 3\nLesson 45', SHELF_FIXTURE)).toEqual({
        resourceId: GOOD_AND_BEAUTIFUL._id,
        lesson: 45,
        confidence: 'alias',
      });
    });

    it('matches on a short alias', () => {
      expect(matchShelf('TGATB lesson 7', SHELF_FIXTURE)).toMatchObject({
        resourceId: GOOD_AND_BEAUTIFUL._id,
        lesson: 7,
      });
    });
  });

  describe('All About Reading', () => {
    it.each(['Pre-reading', 'Level 1', 'Level 2', 'Level 3', 'Level 4'])('matches level %s', (lvl) => {
      expect(matchShelf(`All About Reading ${lvl} - Lesson 9`, SHELF_FIXTURE)).toEqual({
        resourceId: ALL_ABOUT_READING._id,
        level: lvl,
        lesson: 9,
        confidence: 'alias',
      });
    });

    it('detects a level through an alias', () => {
      expect(matchShelf('All About Reading Prereading Lesson 2', SHELF_FIXTURE)).toMatchObject({ level: 'Pre-reading' });
      expect(matchShelf('All About Reading Level Three Lesson 2', SHELF_FIXTURE)).toMatchObject({ level: 'Level 3' });
    });

    it('does not read Level 1 out of Level 10', () => {
      expect(matchShelf('All About Reading Level 10 Lesson 2', SHELF_FIXTURE)?.level).toBeUndefined();
    });
  });

  describe('Story of the World', () => {
    it.each(['Volume 1', 'Volume 2', 'Volume 3', 'Volume 4'])('matches %s with a chapter', (vol) => {
      expect(matchShelf(`Story of the World ${vol}\nChapter 14: The Fall of Rome`, SHELF_FIXTURE)).toEqual({
        resourceId: STORY_OF_THE_WORLD._id,
        level: vol,
        lesson: 14,
        confidence: 'alias',
      });
    });

    it('resolves a volume by subtitle alias', () => {
      expect(matchShelf('The Story of the World: The Middle Ages, Chapter 3', SHELF_FIXTURE)).toMatchObject({
        level: 'Volume 2',
        lesson: 3,
      });
    });

    it('does not use the Lesson pattern of another resource', () => {
      expect(matchShelf('Story of the World Volume 1 Lesson 5', SHELF_FIXTURE)?.lesson).toBeUndefined();
    });
  });

  describe('pattern fallback', () => {
    it('matches on level and lesson when no title is printed and one resource fits', () => {
      expect(matchShelf('Epsilon\nLesson 8', SHELF_FIXTURE)).toEqual({
        resourceId: MATH_U_SEE._id,
        level: 'Epsilon',
        lesson: 8,
        confidence: 'pattern',
      });
    });

    it('refuses when the pattern is ambiguous across resources', () => {
      expect(matchShelf('Epsilon Level 1 Lesson 8', SHELF_FIXTURE)).toBeNull();
    });

    it('refuses a bare lesson number', () => {
      expect(matchShelf('Lesson 8', SHELF_FIXTURE)).toBeNull();
    });
  });

  describe('no match', () => {
    it('returns null for unrelated text', () => {
      expect(matchShelf('Shopping list: eggs, milk, bread', SHELF_FIXTURE)).toBeNull();
    });

    it('returns null for empty text or empty shelf', () => {
      expect(matchShelf('', SHELF_FIXTURE)).toBeNull();
      expect(matchShelf('   \n ', SHELF_FIXTURE)).toBeNull();
      expect(matchShelf('Math-U-See Alpha Lesson 1', [])).toBeNull();
    });

    it('does not match inside longer words', () => {
      expect(matchShelf('Mathematics Alphabet Betamax', SHELF_FIXTURE)).toBeNull();
    });
  });

  describe('universal resources', () => {
    it('never matches My own plan or An AI-made plan from printed text', () => {
      expect(matchShelf('My own plan', [MY_OWN_PLAN, AI_MADE_PLAN])).toBeNull();
      expect(matchShelf('An AI-made plan', [MY_OWN_PLAN, AI_MADE_PLAN])).toBeNull();
      expect(matchShelf('This is my own plan for the week, an AI-made plan', SHELF_FIXTURE)).toBeNull();
    });
  });

  describe('robustness', () => {
    it('ignores draft resources', () => {
      expect(matchShelf('Math-U-See Alpha Lesson 1', [{ ...MATH_U_SEE, status: 'draft' }])).toBeNull();
    });

    it('tolerates an invalid lessonPattern', () => {
      const broken = { ...MATH_U_SEE, lessonPattern: '(' };
      expect(matchShelf('Math-U-See Alpha Lesson 1', [broken])).toEqual({
        resourceId: MATH_U_SEE._id,
        level: 'Alpha',
        confidence: 'alias',
      });
    });

    it('prefers the longest alias when two resources both hit', () => {
      const result = matchShelf('The Good and the Beautiful Math-U-See Alpha', SHELF_FIXTURE);
      expect(result?.resourceId).toBe(GOOD_AND_BEAUTIFUL._id);
    });

    it('returns null on an exact alias tie between resources', () => {
      const twin = { ...MATH_U_SEE, _id: 'shelfResource.twin', slug: { current: 'twin' } };
      expect(matchShelf('Math-U-See Alpha Lesson 1', [MATH_U_SEE, twin])).toBeNull();
    });
  });
});
