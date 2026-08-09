/**
 * Unit tests for the universal-link manifests. Both routes are env-gated:
 * they must 404 (never serve a placeholder — Apple's CDN caches it) until
 * Drew's store enrolments provide the real identifiers.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NATIVE_APP_ID } from '@/lib/platform/native';
import { GET as getAasa } from './apple-app-site-association/route';
import { GET as getAssetlinks } from './assetlinks.json/route';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('/.well-known/apple-app-site-association', () => {
  it('404s until APPLE_TEAM_ID is configured', async () => {
    vi.stubEnv('APPLE_TEAM_ID', '');
    const res = await getAasa();
    expect(res.status).toBe(404);
  });

  it('serves the applinks manifest for the configured team', async () => {
    vi.stubEnv('APPLE_TEAM_ID', 'ABCDE12345');
    const res = await getAasa();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.applinks.details).toEqual([
      { appID: `ABCDE12345.${NATIVE_APP_ID}`, paths: ['*'] },
    ]);
    expect(body.webcredentials.apps).toEqual([`ABCDE12345.${NATIVE_APP_ID}`]);
  });
});

describe('/.well-known/assetlinks.json', () => {
  it('404s until ANDROID_CERT_SHA256 is configured', async () => {
    vi.stubEnv('ANDROID_CERT_SHA256', '');
    const res = await getAssetlinks();
    expect(res.status).toBe(404);
  });

  it('serves one statement with all configured fingerprints', async () => {
    vi.stubEnv('ANDROID_CERT_SHA256', 'AA:BB, CC:DD ');
    const res = await getAssetlinks();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].target.package_name).toBe(NATIVE_APP_ID);
    expect(body[0].target.sha256_cert_fingerprints).toEqual(['AA:BB', 'CC:DD']);
  });
});
