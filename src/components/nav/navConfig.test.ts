import { describe, expect, it } from 'vitest';
import { isDirectTabActive } from './navConfig';

describe('isDirectTabActive', () => {
  describe('/log', () => {
    it('is active on /log itself', () => {
      expect(isDirectTabActive('/log', '/log')).toBe(true);
    });

    it('is active on the Logger sub-pages', () => {
      expect(isDirectTabActive('/log/batch', '/log')).toBe(true);
      expect(isDirectTabActive('/log/import', '/log')).toBe(true);
    });

    it('does NOT match /login (prefix without the slash boundary)', () => {
      expect(isDirectTabActive('/login', '/log')).toBe(false);
    });

    it('does not match unrelated routes', () => {
      expect(isDirectTabActive('/dashboard', '/log')).toBe(false);
      expect(isDirectTabActive('/our-story/x', '/log')).toBe(false);
    });
  });

  describe('/dashboard', () => {
    it('matches only the exact path', () => {
      expect(isDirectTabActive('/dashboard', '/dashboard')).toBe(true);
      expect(isDirectTabActive('/log', '/dashboard')).toBe(false);
      expect(isDirectTabActive('/our-story/x', '/dashboard')).toBe(false);
    });
  });

  describe('/our-story', () => {
    it('covers the whole subtree', () => {
      expect(isDirectTabActive('/our-story', '/our-story')).toBe(true);
      expect(isDirectTabActive('/our-story/x', '/our-story')).toBe(true);
      expect(isDirectTabActive('/log/batch', '/our-story')).toBe(false);
      expect(isDirectTabActive('/dashboard', '/our-story')).toBe(false);
    });
  });
});
