import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const sanityFetch = vi.fn();
vi.mock('@/lib/sanity/server-fetch', () => ({
  sanityFetch: (...args: unknown[]) => sanityFetch(...args),
  SANITY_CONTENT_TAG: 'sanity:content',
}));

import { fetchCopyOverrides, getCopy } from './server';
import { SITE_COPY_QUERY } from '@/lib/sanity/queries';

describe('site copy server loader', () => {
  it('reads every siteCopy doc through the tagged fetch and returns the override diff', async () => {
    sanityFetch.mockImplementation(async () => [
      { surface: 'landing', entries: [{ key: 'hero.title', value: 'Live headline' }] },
    ]);
    const overrides = await fetchCopyOverrides();
    expect(sanityFetch).toHaveBeenCalledWith(SITE_COPY_QUERY);
    expect(overrides).toEqual({ landing: { 'hero.title': 'Live headline' } });
    const landing = await getCopy('landing');
    expect(landing['hero.title']).toBe('Live headline');
    expect(landing['nav.signIn']).toBe('Sign In');
  });

  it('falls back to code defaults when Sanity throws (missing env, network, ACL)', async () => {
    sanityFetch.mockImplementation(async () => {
      throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID is not set');
    });
    const overrides = await fetchCopyOverrides();
    expect(overrides).toEqual({});
    const welcome = await getCopy('welcome');
    expect(welcome['slide1.title']).toBe('Welcome to Hearth');
  });

  it('falls back when Sanity returns a malformed payload', async () => {
    sanityFetch.mockImplementation(async () => ({ unexpected: true }));
    const overrides = await fetchCopyOverrides();
    expect(overrides).toEqual({});
  });
});
